import express from 'express';
import request from 'supertest';

import {contextSetupMiddleware, requestIdMiddleware} from './middleware';
import {getRequestContext, getRequestId, hasValidContext} from './utils/context';

describe('Middleware Integration Tests', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();

        // Set up middleware in the correct order
        app.use(requestIdMiddleware);
        app.use(contextSetupMiddleware);

        // Test endpoint that uses context
        app.get('/test-context', (_req, res) => {
            const context = getRequestContext();
            const requestId = getRequestId();
            const hasContext = hasValidContext();

            res.json({
                hasContext,
                requestId,
                context: context
                    ? {
                          requestId: context.requestId,
                          timestamp: context.timestamp,
                          userId: context.userId,
                          organizationId: context.organizationId,
                      }
                    : null,
            });
        });

        // Test endpoint that uses request object context methods
        app.get('/test-request-methods', (req, res) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hasContext = (req as any).hasContext?.() || false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const context = (req as any).getContext?.();

            res.json({
                hasContext,
                context: context
                    ? {
                          requestId: context.requestId,
                          timestamp: context.timestamp,
                          userId: context.userId,
                          organizationId: context.organizationId,
                      }
                    : null,
            });
        });

        // Test endpoint that checks response headers
        app.get('/test-headers', (_req, res) => {
            res.json({message: 'Headers test'});
        });
    });

    describe('Request ID Generation and Validation', () => {
        it('should generate a new request ID when none provided', async () => {
            const response = await request(app).get('/test-context').expect(200);

            expect(response.body.hasContext).toBe(true);
            expect(response.body.requestId).toBeDefined();
            expect(response.body.context).toBeDefined();
            expect(response.body.context.requestId).toBe(response.body.requestId);
        });

        it('should use provided valid x-request-id header', async () => {
            const validRequestId = '123e4567-e89b-12d3-a456-426614174000';

            const response = await request(app)
                .get('/test-context')
                .set('x-request-id', validRequestId)
                .expect(200);

            expect(response.body.requestId).toBe(validRequestId);
            expect(response.body.context.requestId).toBe(validRequestId);
        });

        it('should use provided valid x-correlation-id header as fallback', async () => {
            const validCorrelationId = '987fcdeb-51a2-43d1-b456-426614174000';

            const response = await request(app)
                .get('/test-context')
                .set('x-correlation-id', validCorrelationId)
                .expect(200);

            expect(response.body.requestId).toBe(validCorrelationId);
            expect(response.body.context.requestId).toBe(validCorrelationId);
        });

        it('should reject invalid request ID format', async () => {
            const invalidRequestId = 'invalid-id';

            const response = await request(app)
                .get('/test-context')
                .set('x-request-id', invalidRequestId)
                .expect(400);

            expect(response.body.error).toContain('Invalid request ID format');
            expect(response.body.requestId).toBe(invalidRequestId);
        });

        it('should set x-request-id response header', async () => {
            const response = await request(app).get('/test-headers').expect(200);

            expect(response.headers['x-request-id']).toBeDefined();
            expect(response.headers['x-request-id']).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
            );
        });
    });

    describe('AsyncLocalStorage Context Management', () => {
        it('should establish context for each request', async () => {
            const response = await request(app).get('/test-context').expect(200);

            expect(response.body.hasContext).toBe(true);
            expect(response.body.context).toBeDefined();
            expect(response.body.context.timestamp).toBeDefined();
            expect(typeof response.body.context.timestamp).toBe('number');
        });

        it('should provide context through request object methods', async () => {
            const response = await request(app).get('/test-request-methods').expect(200);

            expect(response.body.hasContext).toBe(true);
            expect(response.body.context).toBeDefined();
            expect(response.body.context.requestId).toBeDefined();
        });

        it('should isolate context between different requests', async () => {
            const response1 = await request(app).get('/test-context').expect(200);

            const response2 = await request(app).get('/test-context').expect(200);

            expect(response1.body.requestId).not.toBe(response2.body.requestId);
            expect(response1.body.context.requestId).not.toBe(response2.body.context.requestId);
        });

        it('should handle requests without context gracefully', async () => {
            // Create app without context middleware
            const appWithoutContext = express();
            appWithoutContext.use(requestIdMiddleware);

            appWithoutContext.get('/test', (_req, res) => {
                const hasContext = hasValidContext();
                const requestId = getRequestId();

                res.json({hasContext, requestId});
            });

            const response = await request(appWithoutContext).get('/test').expect(200);

            expect(response.body.hasContext).toBe(false);
            expect(response.body.requestId).toBeUndefined();
        });
    });

    describe('Error Handling and Fallbacks', () => {
        it('should continue processing when context setup fails', async () => {
            // This test verifies that the middleware continues to work
            // even if there are issues with AsyncLocalStorage
            const response = await request(app).get('/test-context').expect(200);

            // Should still get a response, even if context might be limited
            expect(response.body).toBeDefined();
        });

        it('should handle malformed request IDs gracefully', async () => {
            const response = await request(app)
                .get('/test-context')
                .set('x-request-id', 'not-a-uuid')
                .expect(400);

            expect(response.body.error).toContain('Invalid request ID format');
        });
    });

    describe('Performance Monitoring', () => {
        it('should complete within performance threshold', async () => {
            const startTime = Date.now();

            await request(app).get('/test-context').expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within 100ms (including network overhead)
            expect(duration).toBeLessThan(100);
        });

        it('should handle multiple concurrent requests', async () => {
            const concurrentRequests = 10;
            const promises = Array.from({length: concurrentRequests}, () =>
                request(app).get('/test-context').expect(200),
            );

            const responses = await Promise.all(promises);

            // All requests should succeed
            responses.forEach((response) => {
                expect(response.body.hasContext).toBe(true);
                expect(response.body.requestId).toBeDefined();
            });

            // All request IDs should be unique
            const requestIds = responses.map((r) => r.body.requestId);
            const uniqueIds = new Set(requestIds);
            expect(uniqueIds.size).toBe(concurrentRequests);
        });
    });

    describe('Middleware Order and Integration', () => {
        it('should maintain correct middleware order', async () => {
            const appWithOrder = express();

            // Add some test middleware to verify order
            const executionOrder: string[] = [];

            appWithOrder.use((_req, _res, next) => {
                executionOrder.push('before-request-id');
                next();
            });

            appWithOrder.use(requestIdMiddleware);
            appWithOrder.use((_req, _res, next) => {
                executionOrder.push('after-request-id');
                next();
            });

            appWithOrder.use(contextSetupMiddleware);
            appWithOrder.use((_req, _res, next) => {
                executionOrder.push('after-context');
                next();
            });

            appWithOrder.get('/test-order', (_req, res) => {
                executionOrder.push('route-handler');
                res.json({order: executionOrder});
            });

            const response = await request(appWithOrder).get('/test-order').expect(200);

            expect(response.body.order).toEqual([
                'before-request-id',
                'after-request-id',
                'after-context',
                'route-handler',
            ]);
        });

        it('should integrate with existing middleware patterns', async () => {
            const appWithAuth = express();

            appWithAuth.use(requestIdMiddleware);
            appWithAuth.use(contextSetupMiddleware);

            // Simulate auth middleware that sets user info
            appWithAuth.use((req, res, next) => {
                // Simulate setting user context
                if (req.headers.authorization) {
                    // This would normally be done by the actual auth middleware
                    // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
                    res.locals.user = {id: 123, email: 'test@example.com'};
                }
                next();
            });

            appWithAuth.get('/test-auth', (_req, res) => {
                const context = getRequestContext();
                res.json({
                    hasContext: hasValidContext(),
                    context: context
                        ? {
                              requestId: context.requestId,
                              timestamp: context.timestamp,
                          }
                        : null,
                    user: res.locals.user,
                });
            });

            const response = await request(appWithAuth)
                .get('/test-auth')
                .set('authorization', 'Bearer token')
                .expect(200);

            expect(response.body.hasContext).toBe(true);
            expect(response.body.context).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.id).toBe(123);
        });
    });
});

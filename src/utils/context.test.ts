import {
    getOrganizationId,
    getRequestContext,
    getRequestId,
    getUserEmail,
    getUserId,
    hasValidContext,
    requestContextStore,
    runWithContext,
    setUserContext,
    updateRequestContext,
} from './context';

import {RequestContext} from '#types';

describe('AsyncLocalStorage Context Management', () => {
    beforeEach(() => {
        // Clear any existing context before each test
        requestContextStore.disable();
    });

    afterEach(() => {
        // Re-enable the store after each test
        requestContextStore.disable();
    });

    describe('runWithContext', () => {
        it('should run a function within the specified context', async () => {
            const context: RequestContext = {
                requestId: 'test-request-id',
                userId: 123,
                organizationId: 456,
                userEmail: 'test@example.com',
                timestamp: Date.now(),
            };

            const result = await runWithContext(context, async () => {
                const currentContext = getRequestContext();
                expect(currentContext).toEqual(context);
                return 'test-result';
            });

            expect(result).toBe('test-result');
        });

        it('should isolate context between different calls', async () => {
            const context1: RequestContext = {
                requestId: 'request-1',
                timestamp: Date.now(),
            };

            const context2: RequestContext = {
                requestId: 'request-2',
                timestamp: Date.now(),
            };

            let capturedContext1: RequestContext | undefined;
            let capturedContext2: RequestContext | undefined;

            await runWithContext(context1, async () => {
                capturedContext1 = getRequestContext();
            });

            await runWithContext(context2, async () => {
                capturedContext2 = getRequestContext();
            });

            expect(capturedContext1).toEqual(context1);
            expect(capturedContext2).toEqual(context2);
            expect(capturedContext1).not.toEqual(capturedContext2);
        });
    });

    describe('getRequestContext', () => {
        it('should return undefined when not in a context', () => {
            const context = getRequestContext();
            expect(context).toBeUndefined();
        });

        it('should return the current context when in a context', async () => {
            const testContext: RequestContext = {
                requestId: 'test-id',
                timestamp: Date.now(),
            };

            await runWithContext(testContext, async () => {
                const context = getRequestContext();
                expect(context).toEqual(testContext);
            });
        });
    });

    describe('getRequestId', () => {
        it('should return undefined when not in a context', () => {
            const requestId = getRequestId();
            expect(requestId).toBeUndefined();
        });

        it('should return the request ID when in a context', async () => {
            const testContext: RequestContext = {
                requestId: 'test-request-id',
                timestamp: Date.now(),
            };

            await runWithContext(testContext, async () => {
                const requestId = getRequestId();
                expect(requestId).toBe('test-request-id');
            });
        });
    });

    describe('getUserId', () => {
        it('should return undefined when not in a context', () => {
            const userId = getUserId();
            expect(userId).toBeUndefined();
        });

        it('should return the user ID when in a context', async () => {
            const testContext: RequestContext = {
                requestId: 'test-id',
                userId: 123,
                timestamp: Date.now(),
            };

            await runWithContext(testContext, async () => {
                const userId = getUserId();
                expect(userId).toBe(123);
            });
        });
    });

    describe('getOrganizationId', () => {
        it('should return undefined when not in a context', () => {
            const organizationId = getOrganizationId();
            expect(organizationId).toBeUndefined();
        });

        it('should return the organization ID when in a context', async () => {
            const testContext: RequestContext = {
                requestId: 'test-id',
                organizationId: 456,
                timestamp: Date.now(),
            };

            await runWithContext(testContext, async () => {
                const organizationId = getOrganizationId();
                expect(organizationId).toBe(456);
            });
        });
    });

    describe('getUserEmail', () => {
        it('should return undefined when not in a context', () => {
            const userEmail = getUserEmail();
            expect(userEmail).toBeUndefined();
        });

        it('should return the user email when in a context', async () => {
            const testContext: RequestContext = {
                requestId: 'test-id',
                userEmail: 'test@example.com',
                timestamp: Date.now(),
            };

            await runWithContext(testContext, async () => {
                const userEmail = getUserEmail();
                expect(userEmail).toBe('test@example.com');
            });
        });
    });

    describe('updateRequestContext', () => {
        it('should update the current context with new values', async () => {
            const initialContext: RequestContext = {
                requestId: 'test-id',
                timestamp: Date.now(),
            };

            await runWithContext(initialContext, async () => {
                updateRequestContext({
                    userId: 123,
                    userEmail: 'test@example.com',
                });

                const updatedContext = getRequestContext();
                expect(updatedContext).toEqual({
                    ...initialContext,
                    userId: 123,
                    userEmail: 'test@example.com',
                });
            });
        });

        it('should do nothing when not in a context', () => {
            // This should not throw an error
            expect(() => {
                updateRequestContext({userId: 123});
            }).not.toThrow();
        });
    });

    describe('setUserContext', () => {
        it('should set user information in the current context', async () => {
            const initialContext: RequestContext = {
                requestId: 'test-id',
                timestamp: Date.now(),
            };

            await runWithContext(initialContext, async () => {
                setUserContext(123, 'test@example.com', 456);

                const updatedContext = getRequestContext();
                expect(updatedContext).toEqual({
                    ...initialContext,
                    userId: 123,
                    userEmail: 'test@example.com',
                    organizationId: 456,
                });
            });
        });

        it('should work without organization ID', async () => {
            const initialContext: RequestContext = {
                requestId: 'test-id',
                timestamp: Date.now(),
            };

            await runWithContext(initialContext, async () => {
                setUserContext(123, 'test@example.com');

                const updatedContext = getRequestContext();
                expect(updatedContext).toEqual({
                    ...initialContext,
                    userId: 123,
                    userEmail: 'test@example.com',
                });
            });
        });
    });

    describe('hasValidContext', () => {
        it('should return false when not in a context', () => {
            const hasContext = hasValidContext();
            expect(hasContext).toBe(false);
        });

        it('should return false when context has no request ID', async () => {
            const invalidContext = {} as RequestContext;

            await runWithContext(invalidContext, async () => {
                const hasContext = hasValidContext();
                expect(hasContext).toBe(false);
            });
        });

        it('should return true when context has a valid request ID', async () => {
            const validContext: RequestContext = {
                requestId: 'test-id',
                timestamp: Date.now(),
            };

            await runWithContext(validContext, async () => {
                const hasContext = hasValidContext();
                expect(hasContext).toBe(true);
            });
        });
    });

    describe('context isolation', () => {
        it('should maintain separate contexts for concurrent operations', async () => {
            const context1: RequestContext = {
                requestId: 'context-1',
                userId: 1,
                timestamp: Date.now(),
            };

            const context2: RequestContext = {
                requestId: 'context-2',
                userId: 2,
                timestamp: Date.now(),
            };

            const promises = [
                runWithContext(context1, async () => {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    return getRequestContext();
                }),
                runWithContext(context2, async () => {
                    await new Promise((resolve) => setTimeout(resolve, 5));
                    return getRequestContext();
                }),
            ];

            const [result1, result2] = await Promise.all(promises);

            expect(result1).toEqual(context1);
            expect(result2).toEqual(context2);
            expect(result1).not.toEqual(result2);
        });
    });
});

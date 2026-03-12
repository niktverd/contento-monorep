import {NextFunction, Request, Response} from 'express';

import {TEST_USER_TOKEN_HEADER, USER_TOKEN_HEADER} from './constants';
import {
    checkPermissions,
    contextSetupMiddleware,
    isSuperAdmin,
    requestIdMiddleware,
    requireOrganizationHeader,
} from './middleware';

// Mock the database and user functions
jest.mock('./db', () => ({
    getDb: jest.fn(),
    getOrCreateUser: jest.fn(),
}));

// Mock Firebase admin
jest.mock('#config/firebase', () => ({
    admin: {
        auth: () => ({
            verifyIdToken: jest.fn(),
        }),
    },
}));

// Mock the utils module for context functions
jest.mock('#utils', () => ({
    getOrganizationId: jest.fn(),
    getUserEmail: jest.fn(),
    getUserId: jest.fn(),
    isValidRequestId: jest.fn(),
    logError: jest.fn(),
    requestContextStore: {
        run: jest.fn((_context, callback) => callback()),
    },
    setUserContext: jest.fn(),
    updateRequestContext: jest.fn(),
}));

describe('Middleware Tests', () => {
    let mockRequest: Partial<Request> & {locals?: Record<string, unknown>};
    let mockResponse: Partial<Response> & {locals?: Record<string, unknown>};
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
            locals: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {} as Record<string, unknown>,
        };
        mockNext = jest.fn();
    });

    describe('requireOrganizationHeader', () => {
        it('should allow SuperAdmin users without organization header', () => {
            mockRequest.locals = {user: {isSuperAdmin: true}};

            requireOrganizationHeader(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should return 403 when organization header is missing for non-SuperAdmin users', () => {
            mockRequest.locals = {user: {isSuperAdmin: false}};

            requireOrganizationHeader(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Forbidden: x-organization-id header is required.',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 when organization header is not a valid number', () => {
            mockRequest.locals = {user: {isSuperAdmin: false}};
            mockRequest.headers = {'x-organization-id': 'invalid'};

            requireOrganizationHeader(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Bad Request: x-organization-id must be a number.',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should set organizationId in locals and call next when valid header is provided', () => {
            mockRequest.locals = {user: {isSuperAdmin: false}};
            mockRequest.headers = {'x-organization-id': '123'};

            requireOrganizationHeader(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.locals?.organizationId).toBe(123);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should handle zero as a valid organization ID', () => {
            mockRequest.locals = {user: {isSuperAdmin: false}};
            mockRequest.headers = {'x-organization-id': '0'};

            requireOrganizationHeader(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.locals?.organizationId).toBe(0);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('isSuperAdmin', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            jest.resetModules();
            process.env = {...originalEnv};
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        it('should set user as SuperAdmin when valid secret is provided', () => {
            process.env.SUPER_ADMIN_SECRET = 'test-secret';
            mockRequest.headers = {
                [USER_TOKEN_HEADER]: Buffer.from('test-secret', 'utf-8').toString('base64'),
                [TEST_USER_TOKEN_HEADER]: Buffer.from('test-secret', 'utf-8').toString('base64'),
            };

            isSuperAdmin(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.locals?.user).toEqual({isSuperAdmin: true});
            expect(mockNext).toHaveBeenCalled();
        });

        it('should not set user as SuperAdmin when secret is missing', () => {
            delete process.env.SUPER_ADMIN_SECRET;
            mockRequest.headers = {
                [USER_TOKEN_HEADER]: 'some-token',
                [TEST_USER_TOKEN_HEADER]: 'some-token',
            };

            isSuperAdmin(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.locals?.user).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should not set user as SuperAdmin when token is missing', () => {
            process.env.SUPER_ADMIN_SECRET = 'test-secret';

            isSuperAdmin(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.locals?.user).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should not set user as SuperAdmin when token does not match secret', () => {
            process.env.SUPER_ADMIN_SECRET = 'test-secret';
            mockRequest.headers = {
                [USER_TOKEN_HEADER]: Buffer.from('wrong-secret', 'utf-8').toString('base64'),
                [TEST_USER_TOKEN_HEADER]: Buffer.from('wrong-secret', 'utf-8').toString('base64'),
            };

            isSuperAdmin(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.locals?.user).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('checkPermissions', () => {
        const mockDb = {};
        const mockGetOrCreateUser = jest.fn();

        beforeEach(() => {
            jest.resetModules();
            const dbModule = require('./db');
            dbModule.getDb.mockReturnValue(mockDb);
            dbModule.getOrCreateUser.mockImplementation(mockGetOrCreateUser);
        });

        it('should allow SuperAdmin users without checking permissions', () => {
            mockRequest.locals = {user: {isSuperAdmin: true}};

            const permissionCheck = checkPermissions('some-permission');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockGetOrCreateUser).not.toHaveBeenCalled();
        });

        it('should extract organizationId from header if not in locals', () => {
            mockRequest.locals = {user: {uid: '123', email: 'test@test.com', name: 'Test User'}};
            mockRequest.headers = {'x-organization-id': '456'};
            mockGetOrCreateUser.mockResolvedValue({
                result: {
                    id: 1,
                    organizations: [{id: 456}],
                    roles: [{permissions: ['some-permission']}],
                },
            });

            const permissionCheck = checkPermissions('some-permission');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.locals?.organizationId).toBe(456);
            expect(mockGetOrCreateUser).toHaveBeenCalledWith(
                expect.objectContaining({organizationId: 456}),
                mockDb,
            );
        });

        it('should use organizationId from locals if already set', () => {
            mockRequest.locals = {
                user: {uid: '123', email: 'test@test.com', name: 'Test User'},
                organizationId: 789,
            };
            mockGetOrCreateUser.mockResolvedValue({
                result: {
                    id: 1,
                    organizations: [{id: 789}],
                    roles: [{permissions: ['some-permission']}],
                },
            });

            const permissionCheck = checkPermissions('some-permission');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockGetOrCreateUser).toHaveBeenCalledWith(
                expect.objectContaining({organizationId: 789}),
                mockDb,
            );
        });

        it('should return 401 when user is not authenticated', () => {
            mockRequest.locals = {user: {}};

            const permissionCheck = checkPermissions('some-permission');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({error: 'Unauthorized'});
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 404 when user is not found in database', () => {
            mockRequest.locals = {user: {uid: '123', email: 'test@test.com', name: 'Test User'}};
            mockRequest.headers = {'x-organization-id': '456'};
            mockGetOrCreateUser.mockResolvedValue({result: null});

            const permissionCheck = checkPermissions('some-permission');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({error: 'User not found'});
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 when user is not a member of the organization', () => {
            mockRequest.locals = {user: {uid: '123', email: 'test@test.com', name: 'Test User'}};
            mockRequest.headers = {'x-organization-id': '456'};
            mockGetOrCreateUser.mockResolvedValue({
                result: {
                    id: 1,
                    organizations: [],
                    roles: [],
                },
            });

            const permissionCheck = checkPermissions('some-permission');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Forbidden: You are not a member of this organization.',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 when user has no roles', () => {
            mockRequest.locals = {user: {uid: '123', email: 'test@test.com', name: 'Test User'}};
            mockRequest.headers = {'x-organization-id': '456'};
            mockGetOrCreateUser.mockResolvedValue({
                result: {
                    id: 1,
                    organizations: [{id: 456}],
                    roles: [],
                },
            });

            const permissionCheck = checkPermissions('some-permission');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({error: 'Forbidden: Role not found.'});
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 when user does not have required permission', () => {
            mockRequest.locals = {user: {uid: '123', email: 'test@test.com', name: 'Test User'}};
            mockRequest.headers = {'x-organization-id': '456'};
            mockGetOrCreateUser.mockResolvedValue({
                result: {
                    id: 1,
                    organizations: [{id: 456}],
                    roles: [{permissions: ['different-permission']}],
                },
            });

            const permissionCheck = checkPermissions('some-permission');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Forbidden: Permission is not found.',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should allow access when user has required permission', () => {
            mockRequest.locals = {user: {uid: '123', email: 'test@test.com', name: 'Test User'}};
            mockRequest.headers = {'x-organization-id': '456'};
            mockGetOrCreateUser.mockResolvedValue({
                result: {
                    id: 1,
                    organizations: [{id: 456}],
                    roles: [{permissions: ['some-permission']}],
                },
            });

            const permissionCheck = checkPermissions('some-permission');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should handle multiple roles and permissions correctly', () => {
            mockRequest.locals = {user: {uid: '123', email: 'test@test.com', name: 'Test User'}};
            mockRequest.headers = {'x-organization-id': '456'};
            mockGetOrCreateUser.mockResolvedValue({
                result: {
                    id: 1,
                    organizations: [{id: 456}],
                    roles: [
                        {permissions: ['permission1', 'permission2']},
                        {permissions: ['permission3']},
                    ],
                },
            });

            const permissionCheck = checkPermissions('permission2');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should return 500 on database error', () => {
            mockRequest.locals = {user: {uid: '123', email: 'test@test.com', name: 'Test User'}};
            mockRequest.headers = {'x-organization-id': '456'};
            mockGetOrCreateUser.mockRejectedValue(new Error('Database error'));

            const permissionCheck = checkPermissions('some-permission');
            permissionCheck(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({error: expect.any(String)}),
            );
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requestIdMiddleware', () => {
        it('should generate a new UUID when no request ID is provided', () => {
            mockRequest.headers = {};
            mockResponse.setHeader = jest.fn();

            requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'x-request-id',
                expect.stringMatching(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                ),
            );
            expect(mockResponse.locals?.requestId).toBeDefined();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should use provided x-request-id header when valid', () => {
            const validRequestId = '123e4567-e89b-12d3-a456-426614174000';
            mockRequest.headers = {'x-request-id': validRequestId};
            mockResponse.setHeader = jest.fn();

            requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', validRequestId);
            expect(mockResponse.locals?.requestId).toBe(validRequestId);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should use x-correlation-id header as fallback when x-request-id is not provided', () => {
            const correlationId = '550e8400-e29b-41d4-a716-446655440000';
            mockRequest.headers = {'x-correlation-id': correlationId};
            mockResponse.setHeader = jest.fn();

            requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', correlationId);
            expect(mockResponse.locals?.requestId).toBe(correlationId);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should return 400 error when invalid request ID format is provided', () => {
            const invalidRequestId = 'invalid-uuid';
            mockRequest.headers = {'x-request-id': invalidRequestId};

            requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid request ID format. Must be a valid UUID v4.',
                requestId: invalidRequestId,
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 error when invalid correlation ID format is provided', () => {
            const invalidCorrelationId = 'not-a-uuid';
            mockRequest.headers = {'x-correlation-id': invalidCorrelationId};

            requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid request ID format. Must be a valid UUID v4.',
                requestId: invalidCorrelationId,
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should prioritize x-request-id over x-correlation-id when both are provided', () => {
            const requestId = '123e4567-e89b-12d3-a456-426614174000';
            const correlationId = '550e8400-e29b-41d4-a716-446655440000';
            mockRequest.headers = {
                'x-request-id': requestId,
                'x-correlation-id': correlationId,
            };
            mockResponse.setHeader = jest.fn();

            requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', requestId);
            expect(mockResponse.locals?.requestId).toBe(requestId);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('contextSetupMiddleware', () => {
        it('should set up context when request ID is available', () => {
            const mockRequestId = '123e4567-e89b-12d3-a456-426614174000';
            mockResponse.locals = {requestId: mockRequestId};
            mockResponse.on = jest.fn();

            // Mock the requestContextStore.run method
            const mockRun = jest.fn((context, callback) => {
                expect(context.requestId).toBe(mockRequestId);
                expect(context.timestamp).toBeDefined();
                callback();
            });

            // Replace the mock for this test
            const utils = require('#utils');
            utils.requestContextStore.run = mockRun;

            contextSetupMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockRun).toHaveBeenCalled();
            expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
            expect(mockResponse.on).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockNext).toHaveBeenCalled();
        });

        it('should continue without context when no request ID is available', () => {
            mockResponse.locals = {};

            const utils = require('#utils');
            const mockRun = jest.fn();
            utils.requestContextStore.run = mockRun;

            contextSetupMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockRun).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Middleware Integration Tests', () => {
        it('should process request ID middleware before context setup middleware', () => {
            const mockRequestId = '123e4567-e89b-12d3-a456-426614174000';
            mockRequest.headers = {'x-request-id': mockRequestId};
            mockResponse.setHeader = jest.fn();
            mockResponse.on = jest.fn();

            // Mock the requestContextStore.run method
            const utils = require('#utils');
            const mockRun = jest.fn((context, callback) => {
                expect(context.requestId).toBe(mockRequestId);
                callback();
            });
            utils.requestContextStore.run = mockRun;

            // First run request ID middleware
            requestIdMiddleware(mockRequest as Request, mockResponse as Response, () => {
                // Then run context setup middleware
                contextSetupMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
            });

            expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', mockRequestId);
            expect(mockResponse.locals?.requestId).toBe(mockRequestId);
            expect(mockRun).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle middleware chain with proper error handling', () => {
            const invalidRequestId = 'invalid-uuid';
            mockRequest.headers = {'x-request-id': invalidRequestId};

            // Request ID middleware should reject invalid IDs
            requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid request ID format. Must be a valid UUID v4.',
                requestId: invalidRequestId,
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});

import {NextFunction, Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';

import {
    CORRELATION_ID_HEADER,
    REQUEST_ID_HEADER,
    TEST_USER_TOKEN_HEADER,
    USER_TOKEN_HEADER,
} from './constants';
import {getDb, getOrCreateUser} from './db';

import {admin} from '#config/firebase';
import {RequestContext} from '#src/types/common';
import {
    getOrganizationId,
    getRequestContext,
    getUserEmail,
    getUserId,
    hasValidContext,
    logError,
    requestContextStore,
    setUserContext as setUserContextUtil,
    updateRequestContext,
} from '#utils';

declare module 'express-serve-static-core' {
    interface Locals {
        user?: {
            uid?: string;
            email?: string;
            emailVerified?: boolean;
            name?: string;
            isSuperAdmin?: boolean;
            id?: number;
            skipAuthentication?: boolean;
        };
        organizationId?: number;
        requestId?: string;
    }
}

// Extend Express Request interface to include context-related properties
declare module 'express' {
    interface Request {
        /**
         * Get the current request context from AsyncLocalStorage
         * @returns RequestContext or undefined if not available
         */
        getContext?(): RequestContext | undefined;

        /**
         * Check if request context is available
         * @returns boolean indicating if context is available
         */
        hasContext?(): boolean;
    }
}

// eslint-disable-next-line valid-jsdoc
/**
 * Middleware to generate and validate request IDs
 * Generates a unique UUID v4 for each request if not provided in headers
 * Validates incoming x-request-id or x-correlation-id headers
 * Sets the request ID in res.locals for use by other middleware
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();

    const requestId =
        req.headers[REQUEST_ID_HEADER] || req.headers[CORRELATION_ID_HEADER] || uuidv4();

    // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
    res.locals.requestId = requestId as string;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;

    if (duration > 1) {
        logError(
            `Request ID middleware overhead: ${duration.toFixed(3)}ms (exceeds 1ms threshold)`,
            {
                requestId,
                duration,
                threshold: 1,
            },
        );
    }

    next();
};

/**
 * Middleware to set up AsyncLocalStorage context for the request
 * This middleware should run after requestIdMiddleware to ensure requestId is available
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 */
export const contextSetupMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();
    const requestId = res.locals.requestId;

    if (!requestId) {
        next();

        return;
    }

    const context: RequestContext = {
        requestId,
        timestamp: Date.now(),
    };

    try {
        requestContextStore.run(context, () => {
            try {
                Object.defineProperty(req, 'getContext', {
                    value: () => getRequestContext(),
                    writable: false,
                    configurable: false,
                });

                Object.defineProperty(req, 'hasContext', {
                    value: () => hasValidContext(),
                    writable: false,
                    configurable: false,
                });

                return next();
            } catch (contextMethodError) {
                logError('Failed to set up request context methods:', contextMethodError);

                Object.defineProperty(req, 'getContext', {
                    value: () => undefined,
                    writable: false,
                    configurable: false,
                });

                Object.defineProperty(req, 'hasContext', {
                    value: () => false,
                    writable: false,
                    configurable: false,
                });

                return next();
            }
        });
    } catch (asyncLocalStorageError) {
        logError('AsyncLocalStorage failed to set up context:', asyncLocalStorageError);

        Object.defineProperty(req, 'getContext', {
            value: () => undefined,
            writable: false,
            configurable: false,
        });

        Object.defineProperty(req, 'hasContext', {
            value: () => false,
            writable: false,
            configurable: false,
        });

        next();

        return;
    }

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;

    if (duration > 1) {
        logError(
            `Context setup middleware overhead: ${duration.toFixed(3)}ms (exceeds 1ms threshold)`,
            {
                requestId: requestId || 'unknown',
                duration,
                threshold: 1,
            },
        );
    }
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (res.locals.user?.skipAuthentication) {
            next();
            return;
        }

        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({error: 'Access token required'});
            return;
        }

        const decodedToken = await admin.auth().verifyIdToken(token);

        const userData = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            name: decodedToken.name,
            isSuperAdmin: Boolean(res.locals.user?.isSuperAdmin),
        };
        // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
        res.locals.user = userData;

        try {
            const db = getDb();
            const {result: user} = await getOrCreateUser(
                {
                    uid: userData.uid,
                    email: userData.email || '',
                    name: userData.name || '',
                    organizationId: res.locals.organizationId,
                },
                db,
            );

            if (user) {
                // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
                res.locals.user = {
                    ...res.locals.user,
                    id: user.id,
                };

                // Update AsyncLocalStorage context with user information
                // eslint-disable-next-line callback-return
                const {setUserContext} = await import('#utils');
                setUserContext(user.id, userData.email || '', res.locals.organizationId);
            }
        } catch (error) {
            logError('User creation error:', error);
        }

        next();
        return;
    } catch (error) {
        res.status(403).json({error: 'Invalid or expired token'});
        return;
    }
};

export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    const adminSecret = process.env.SUPER_ADMIN_SECRET;
    const requestSecret = req.headers[USER_TOKEN_HEADER]?.toString() || '';
    const requestTestSecret = req.headers[TEST_USER_TOKEN_HEADER]?.toString() || '';
    // decode the requestSecret from base64
    const decodedSecret = Buffer.from(requestSecret, 'base64').toString('utf-8');
    const decodedTestSecret = Buffer.from(requestTestSecret, 'base64').toString('utf-8');

    if (adminSecret && requestSecret && adminSecret === decodedSecret) {
        // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
        res.locals.user = {isSuperAdmin: true, skipAuthentication: false};
        // Also set in context for consistency
        updateRequestContext({isSuperAdmin: true, skipAuthentication: false});
    }

    if (adminSecret && requestTestSecret && adminSecret === decodedTestSecret) {
        // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
        res.locals.user = {isSuperAdmin: true, skipAuthentication: true};
        // Also set in context for consistency
        updateRequestContext({isSuperAdmin: true, skipAuthentication: true});
    }

    next();
};

/**
 * Helper function to get organization ID from context, locals, or headers
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {number | undefined} The organization ID or undefined if not found
 */
const getOrganizationIdFromRequest = (req: Request, res: Response): number | undefined => {
    // Get organization ID from context first, then fallback to res.locals and headers
    let organizationId = getOrganizationId();
    if (organizationId === undefined) {
        organizationId = res.locals.organizationId;
        if (organizationId === undefined) {
            const organizationIdString = req.headers['x-organization-id'];
            organizationId = organizationIdString ? Number(organizationIdString) : undefined;
            if (organizationId !== undefined) {
                // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
                res.locals.organizationId = organizationId;
            }
        }
    }
    return organizationId;
};

/**
 * Helper function to get user info from context or fallback to locals
 * @param {Response} res - Express response object
 * @returns {object} Object containing userEmail and userId
 */
const getUserInfoFromRequest = (
    res: Response,
): {userEmail: string | undefined; userId: number | undefined} => {
    // Get user info from context first, then fallback to res.locals
    let userEmail = getUserEmail();
    let userId = getUserId();

    // Fallback to res.locals if context is not available
    if (!userEmail || !userId) {
        const localsUser = res.locals.user;
        if (!localsUser?.uid || !localsUser.email || !localsUser.name) {
            return {userEmail: undefined, userId: undefined};
        }

        // Use res.locals user data
        userEmail = localsUser.email;
        userId = localsUser.id;
    }

    return {userEmail, userId};
};

/**
 * Helper function to validate user permissions
 * @param {object} user - User object with organizations and roles
 * @param {string} requiredPermission - The permission to check for
 * @returns {boolean} True if user has the required permission
 */
const validateUserPermissions = (
    user: {organizations: Array<{id: number}>; roles: Array<{permissions: string[]}>},
    requiredPermission: string,
): boolean => {
    const {
        organizations: [organization],
        roles,
    } = user;

    if (!organization) {
        return false;
    }

    if (!roles?.length) {
        return false;
    }

    const userPermissions = roles.reduce(
        (acc: Record<string, string>, role: {permissions: string[]}) => {
            role.permissions.forEach((permission: string) => {
                acc[permission] = permission;
            });
            return acc;
        },
        {},
    );

    return Boolean(userPermissions[requiredPermission]);
};

export const checkPermissions = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Check if user is super admin from res.locals (fallback for backward compatibility)
        if (res.locals.user?.isSuperAdmin) {
            next();
            return;
        }

        const organizationId = getOrganizationIdFromRequest(req, res);
        const {userEmail, userId} = getUserInfoFromRequest(res);

        // Fallback to res.locals if context is not available
        if (!userEmail || !userId) {
            res.status(401).json({error: 'Unauthorized'});
            return;
        }

        try {
            const db = getDb();
            const {result: user} = await getOrCreateUser(
                {
                    uid: res.locals.user?.uid || '',
                    email: userEmail || '',
                    name: res.locals.user?.name || '',
                    organizationId,
                },
                db,
            );

            if (!user) {
                res.status(404).json({error: 'User not found'});
                return;
            }

            // Update both res.locals and context for backward compatibility
            // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
            res.locals.user = {
                ...(res.locals.user || {}),
                id: user.id,
            };

            // Update context with user information if not already set
            if (!getUserId()) {
                setUserContextUtil(user.id, userEmail || '', organizationId);
            }

            if (!validateUserPermissions(user, requiredPermission)) {
                res.status(403).json({error: 'Forbidden: Permission is not found.'});
                return;
            }

            next();
            return;
        } catch (error) {
            logError('Permission check error:', error);
            res.status(500).json({error: 'Internal server error'});
            return;
        }
    };
};

export const requireOrganizationHeader = (req: Request, res: Response, next: NextFunction) => {
    const organizationIdHeader = req.headers['x-organization-id'];

    if (!organizationIdHeader) {
        res.status(403).json({error: 'Forbidden: x-organization-id header is required.'});
        return;
    }

    const parsed = Number(organizationIdHeader);
    if (Number.isNaN(parsed)) {
        res.status(400).json({error: 'Bad Request: x-organization-id must be a number.'});
        return;
    }

    // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
    res.locals.organizationId = parsed;

    next();
};

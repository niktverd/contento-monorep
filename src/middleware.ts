import {NextFunction, Request, Response} from 'express';

import {TEST_USER_TOKEN_HEADER, USER_TOKEN_HEADER} from './constants';
import {getDb, getOrCreateUser} from './db';

import {admin} from '#config/firebase';
import {logError} from '#utils';

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
    }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('authMiddleware', 'res.locals.user', res.locals.user);
        if (res.locals.user?.skipAuthentication) {
            next();
            return;
        }

        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        console.log('authMiddleware', 'token', token);
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
        console.log('authMiddleware', 'userData', userData);
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
            }
        } catch (error) {
            logError('User creation error:', error);
        }

        console.log('authMiddleware', 'res.locals.user', res.locals.user);
        next();
        return;
    } catch (error) {
        console.error('Token verification error:', error);
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
    console.log(
        'decodedSecret',
        decodedSecret,
        requestSecret,
        adminSecret,
        adminSecret === decodedSecret,
    );
    const decodedTestSecret = Buffer.from(requestTestSecret, 'base64').toString('utf-8');

    if (adminSecret && requestSecret && adminSecret === decodedSecret) {
        // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
        res.locals.user = {isSuperAdmin: true, skipAuthentication: false};
    }

    if (adminSecret && requestTestSecret && adminSecret === decodedTestSecret) {
        // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
        res.locals.user = {isSuperAdmin: true, skipAuthentication: true};
    }

    console.log(isSuperAdmin, 'res.locals.user', res.locals.user);

    next();
};

export const checkPermissions = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        console.log('checkPermissions', 'res.locals.user', res.locals.user);
        if (res.locals.user?.isSuperAdmin) {
            console.log('checkPermissions', 'isSuperAdmin', true);
            next();
            return;
        }

        let organizationId = res.locals.organizationId;
        if (organizationId === undefined) {
            const organizationIdString = req.headers['x-organization-id'];
            organizationId = organizationIdString ? Number(organizationIdString) : undefined;
            if (organizationId !== undefined) {
                // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
                res.locals.organizationId = organizationId;
            }
        }

        console.log('checkPermissions', 'organizationId', organizationId);

        const localsUser = res.locals.user;
        if (!localsUser?.uid || !localsUser.email || !localsUser.name) {
            res.status(401).json({error: 'Unauthorized'});
            return;
        }

        try {
            const db = getDb();
            const {result: user} = await getOrCreateUser(
                {
                    uid: localsUser.uid,
                    email: localsUser.email,
                    name: localsUser.name,
                    organizationId,
                },
                db,
            );

            if (!user) {
                res.status(404).json({error: 'User not found'});
                return;
            }

            // eslint-disable-next-line no-not-accumulator-reassign/no-not-accumulator-reassign
            res.locals.user = {
                ...(res.locals.user || {}),
                id: user.id,
            };

            const {
                organizations: [organization],
                roles,
            } = user;

            if (!organization) {
                res.status(403).json({
                    error: 'Forbidden: You are not a member of this organization.',
                });
                return;
            }

            if (!roles?.length) {
                res.status(403).json({error: 'Forbidden: Role not found.'});
                return;
            }

            const userPermissions = roles.reduce((acc, role) => {
                role.permissions.forEach((permission) => {
                    acc[permission] = permission;
                });

                return acc;
            }, {} as Record<string, string>);

            const hasPermission = userPermissions[requiredPermission];

            if (hasPermission) {
                next();
                return;
            }

            res.status(403).json({error: 'Forbidden: Permission is not found.'});

            return;
        } catch (error) {
            console.error('Permission check error:', error);
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

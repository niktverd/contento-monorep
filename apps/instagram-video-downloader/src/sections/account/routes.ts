import {Router as expressRouter} from 'express';

import {
    createAccountPost,
    deleteAccountDelete,
    getAccountByIdGet,
    getAccountBySlugGet,
    getAllAccountsGet,
    updateAccountPatch,
} from './account.controller';

import {authMiddleware, checkPermissions, requireOrganizationHeader} from '#src/middleware';
import {routes} from '#src/types/routes/account';

const {create, list, get, update, delete: deleteRoute, getBySlug} = routes;

const router = expressRouter();

export enum AccountsPermissions {
    Get = 'accounts.get',
    Edit = 'accounts.edit',
}

// Organization-scoped routes - require organization header
router.post(
    create,
    [authMiddleware, requireOrganizationHeader, checkPermissions(AccountsPermissions.Edit)],
    createAccountPost,
);
router.get(
    list,
    [authMiddleware, requireOrganizationHeader, checkPermissions(AccountsPermissions.Get)],
    getAllAccountsGet,
);
router.get(
    get,
    [authMiddleware, requireOrganizationHeader, checkPermissions(AccountsPermissions.Get)],
    getAccountByIdGet,
);
router.get(
    getBySlug,
    [authMiddleware, requireOrganizationHeader, checkPermissions(AccountsPermissions.Get)],
    getAccountBySlugGet,
);
router.patch(
    update,
    [authMiddleware, requireOrganizationHeader, checkPermissions(AccountsPermissions.Edit)],
    updateAccountPatch,
);
router.delete(
    deleteRoute,
    [authMiddleware, requireOrganizationHeader, checkPermissions(AccountsPermissions.Edit)],
    deleteAccountDelete,
);

export default router;

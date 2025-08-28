/* eslint-disable @typescript-eslint/no-explicit-any */
import {omit} from 'lodash';

import {Account} from './models/Account';
import {assertSameOrg} from './utils';

import {
    CreateAccountParams,
    CreateAccountResponse,
    DeleteAccountParams,
    DeleteAccountResponse,
    GetAccountByIdParams,
    GetAccountByIdResponse,
    GetAccountBySlugParams,
    GetAccountBySlugResponse,
    GetAllAccountsParams,
    GetAllAccountsResponse,
    UpdateAccountParams,
    UpdateAccountResponse,
} from '#src/types';
import {ApiFunctionPrototype} from '#src/types/common';
import {ThrownError} from '#src/utils/error';

export const createAccount: ApiFunctionPrototype<
    CreateAccountParams,
    CreateAccountResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    const {availableScenarios, instagramLocations, ...accountParams} = params;

    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const accountPromise = await db.transaction(async (trx) => {
        // Validate that all scenarios belong to the same organization
        if (availableScenarios?.length) {
            for (const scenario of availableScenarios) {
                await assertSameOrg(trx, organizationId, {
                    entityName: 'scenario',
                    id: scenario.id,
                });
            }
        }

        const account = await Account.query(trx).insert({
            ...omit(accountParams, 'availableScenarios', 'instagramLocations', 'organizationId'),
            organizationId,
        });

        if (availableScenarios?.length) {
            const rows = availableScenarios.map(({id: scenarioId}) => ({
                accountId: account.id,
                scenarioId,
                organizationId,
            }));

            await trx('accountScenarios').insert(rows);
        }

        // Handle instagram locations
        if (instagramLocations?.length) {
            const locationRows = instagramLocations.map(({id: instagramLocationId}) => ({
                accountId: account.id,
                instagramLocationId,
            }));

            await trx('accountInstagramLocations').insert(locationRows);
        }

        return account;
    });

    return {
        result: accountPromise,
        code: 200,
    };
};

export const getAccountById: ApiFunctionPrototype<
    GetAccountByIdParams,
    GetAccountByIdResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;

    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const account = await Account.query(db)
        .findById(params.id)
        .where('organizationId', organizationId)
        .withGraphFetched('availableScenarios')
        .withGraphFetched('instagramLocations');

    if (!account) {
        throw new ThrownError('Account not found', 404);
    }

    return {
        result: account,
        code: 200,
    };
};

export const getAccountBySlug: ApiFunctionPrototype<
    GetAccountBySlugParams,
    GetAccountBySlugResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;

    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const account = await Account.query(db)
        .where('slug', params.slug)
        .where('organizationId', organizationId)
        .first()
        .withGraphFetched('availableScenarios')
        .withGraphFetched('instagramLocations');

    if (!account) {
        throw new ThrownError('Account not found', 404);
    }

    return {
        result: account,
        code: 200,
    };
};

export const getAllAccounts: ApiFunctionPrototype<
    GetAllAccountsParams,
    GetAllAccountsResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;

    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const {onlyEnabled = false} = params;
    const query = Account.query(db)
        .where('organizationId', organizationId)
        .withGraphFetched('availableScenarios')
        .withGraphFetched('instagramLocations');

    if (onlyEnabled) {
        query.where('enabled', true);
    }

    const accounts = await query;

    return {
        result: accounts,
        code: 200,
    };
};

export const updateAccount: ApiFunctionPrototype<
    UpdateAccountParams,
    UpdateAccountResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    const {id, availableScenarios, instagramLocations, ...updateData} = params;

    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const accountPromise = await db.transaction(async (t) => {
        // First, verify the account exists and belongs to the organization
        const existingAccount = await Account.query(t)
            .findById(id)
            .where('organizationId', organizationId);

        if (!existingAccount) {
            throw new ThrownError('Account not found', 404);
        }

        // Update the account with org-scoped constraint
        const account = await Account.query(t)
            .where({id, organizationId})
            .patch(omit(updateData, 'availableScenarios', 'instagramLocations', 'organizationId'))
            .returning('*')
            .first();

        if (!account) {
            throw new ThrownError('Account not found', 404);
        }

        if (availableScenarios) {
            // Validate that all scenarios belong to the same organization
            if (availableScenarios?.length) {
                for (const scenario of availableScenarios) {
                    await assertSameOrg(t, organizationId, {
                        entityName: 'scenario',
                        id: scenario.id,
                    });
                }
            }

            await t('accountScenarios').where({accountId: id}).del();

            if (availableScenarios?.length) {
                const inserts = availableScenarios.map(({id: scenarioId}) => ({
                    accountId: id,
                    scenarioId,
                    organizationId,
                }));

                await t('accountScenarios').insert(inserts);
            }
        }

        // Handle instagram locations
        if (instagramLocations) {
            await t('accountInstagramLocations').where({accountId: id}).del();

            if (instagramLocations?.length) {
                const locationInserts = instagramLocations.map(({id: instagramLocationId}) => ({
                    accountId: id,
                    instagramLocationId,
                }));

                await t('accountInstagramLocations').insert(locationInserts);
            }
        }

        return account;
    });

    return {
        result: accountPromise,
        code: 200,
    };
};

export const deleteAccount: ApiFunctionPrototype<
    DeleteAccountParams,
    DeleteAccountResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;

    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    // Delete with org-scoped constraint
    const deletedCount = await Account.query(db).where({id: params.id, organizationId}).delete();

    if (deletedCount === 0) {
        throw new ThrownError('Account not found', 404);
    }

    return {
        result: deletedCount,
        code: 200,
    };
};

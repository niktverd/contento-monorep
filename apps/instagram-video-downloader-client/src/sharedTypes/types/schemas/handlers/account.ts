import {z} from 'zod';

import {IAccount} from './../../../schemas/models/account';
import {AccountSchema} from './../../../types/schemas/models';
import {zodOptionalBoolean} from './utils';

export const CreateAccountParamsSchema = AccountSchema.omit({id: true});
export const GetAccountByIdParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

export const GetAccountBySlugParamsSchema = z
    .object({
        slug: z.string(),
    })
    .strict();

export const GetAllAccountsParamsSchema = z
    .object({
        onlyEnabled: zodOptionalBoolean(),
    })
    .strict();

export const UpdateAccountParamsSchema = CreateAccountParamsSchema.partial()
    .extend({
        id: z.number(),
    })
    .strict();

export const DeleteAccountParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

// types

export type CreateAccountParams = z.infer<typeof CreateAccountParamsSchema>;
export type CreateAccountResponse = IAccount;

export type GetAccountByIdParams = z.infer<typeof GetAccountByIdParamsSchema>;
export type GetAccountByIdResponse = IAccount;

export type GetAccountBySlugParams = z.infer<typeof GetAccountBySlugParamsSchema>;
export type GetAccountBySlugResponse = IAccount;

export type GetAllAccountsParams = z.infer<typeof GetAllAccountsParamsSchema>;
export type GetAllAccountsResponse = IAccount[];

export type UpdateAccountParams = z.infer<typeof UpdateAccountParamsSchema>;
export type UpdateAccountResponse = IAccount;

export type DeleteAccountParams = z.infer<typeof DeleteAccountParamsSchema>;
export type DeleteAccountResponse = number;

import {TransactionOrKnex} from 'objection';

import {ActionsOptions} from './actions';

export type IResponse<T> = Promise<{
    result: T;
    code?: number;
}>;

export type ApiFunctionPrototype<T, R> = (
    args: T,
    trx: TransactionOrKnex,
    options?: ActionsOptions,
) => IResponse<R>;

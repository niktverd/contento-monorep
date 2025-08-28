import {TransactionOrKnex} from 'objection';

export type IResponse<T> = Promise<{
    result: T;
    code?: number;
}>;

type AuthentificatedUser = {
    uid: string;
    name: string;
    email: string;
    id: number;
};

export type ApiFunctionPrototype<T, R> = (
    args: T,
    trx: TransactionOrKnex,
    options?: {
        user?: AuthentificatedUser;
        organizationId?: number;
    },
) => IResponse<R>;

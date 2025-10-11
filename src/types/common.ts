import {AsyncLocalStorage} from 'async_hooks';

type AuthentificatedUser = {
    uid: string;
    name: string;
    email: string;
    id: number;
};

export type ActionsOptions = {
    user?: AuthentificatedUser;
    organizationId?: number;
};

/**
 * Request context data that will be stored in AsyncLocalStorage
 */
export interface RequestContext {
    requestId: string;
    userId?: number;
    organizationId?: number;
    userEmail?: string;
    timestamp: number;
    isSuperAdmin?: boolean;
    skipAuthentication?: boolean;
}

/**
 * Type for the AsyncLocalStorage store
 */
export type RequestContextStore = AsyncLocalStorage<RequestContext>;

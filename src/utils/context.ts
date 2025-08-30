import {AsyncLocalStorage} from 'async_hooks';

import {RequestContext} from '#types';

/**
 * Global AsyncLocalStorage instance for storing request context
 */
export const requestContextStore = new AsyncLocalStorage<RequestContext>();

/**
 * Sets up the request context in AsyncLocalStorage
 * @param context The request context data to store
 * @param fn The function to run within the context
 * @returns The result of the function
 */
export async function runWithContext<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
    return requestContextStore.run(context, fn);
}

/**
 * Gets the current request context from AsyncLocalStorage
 * @returns The current request context or undefined if not in a context
 */
export function getRequestContext(): RequestContext | undefined {
    return requestContextStore.getStore();
}

/**
 * Gets the current request ID from the context
 * @returns The current request ID or undefined if not in a context
 */
export function getRequestId(): string | undefined {
    const context = getRequestContext();
    return context?.requestId;
}

/**
 * Gets the current user ID from the context
 * @returns The current user ID or undefined if not in a context
 */
export function getUserId(): number | undefined {
    const context = getRequestContext();
    return context?.userId;
}

/**
 * Gets the current organization ID from the context
 * @returns The current organization ID or undefined if not in a context
 */
export function getOrganizationId(): number | undefined {
    const context = getRequestContext();
    return context?.organizationId;
}

/**
 * Gets the current user email from the context
 * @returns The current user email or undefined if not in a context
 */
export function getUserEmail(): string | undefined {
    const context = getRequestContext();
    return context?.userEmail;
}

/**
 * Updates the current request context with user information
 * This function should be called from middleware after user authentication
 * @param updates Partial context updates to apply
 * @returns {void}
 */
export function updateRequestContext(updates: Partial<RequestContext>): void {
    const context = getRequestContext();
    if (context) {
        Object.assign(context, updates);
    }
}

/**
 * Sets user information in the current request context
 * @param userId The user ID
 * @param userEmail The user email
 * @param organizationId The organization ID
 * @returns {void}
 */
export function setUserContext(userId: number, userEmail: string, organizationId?: number): void {
    updateRequestContext({
        userId,
        userEmail,
        organizationId,
    });
}

/**
 * Checks if the current request has a valid context
 * @returns True if context exists and has a request ID
 */
export function hasValidContext(): boolean {
    const context = getRequestContext();
    return Boolean(context?.requestId);
}

/**
 * Gets the current request ID with fallback to a generated ID if context is not available
 * @returns The current request ID or a generated fallback ID
 */
export function getRequestIdWithFallback(): string {
    const context = getRequestContext();
    if (context?.requestId) {
        return context.requestId;
    }

    // Generate a fallback ID based on timestamp and random value
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `fallback-${timestamp}-${random}`;
}

/**
 * Gets the current user ID with fallback to undefined if context is not available
 * @returns The current user ID or undefined
 */
export function getUserIdWithFallback(): number | undefined {
    const context = getRequestContext();
    return context?.userId;
}

/**
 * Gets the current organization ID with fallback to undefined if context is not available
 * @returns The current organization ID or undefined
 */
export function getOrganizationIdWithFallback(): number | undefined {
    const context = getRequestContext();
    return context?.organizationId;
}

/**
 * Gets the current user email with fallback to undefined if context is not available
 * @returns The current user email or undefined
 */
export function getUserEmailWithFallback(): string | undefined {
    const context = getRequestContext();
    return context?.userEmail;
}

/**
 * Creates a fallback context when AsyncLocalStorage is not available
 * @param requestId Optional request ID to use in fallback context
 * @returns A fallback RequestContext object
 */
export function createFallbackContext(requestId?: string): RequestContext {
    return {
        requestId: requestId || getRequestIdWithFallback(),
        timestamp: Date.now(),
        // Fallback values for other fields
        userId: undefined,
        organizationId: undefined,
        userEmail: undefined,
        isSuperAdmin: false,
        skipAuthentication: false,
    };
}

/**
 * Safely executes a function with context, falling back to fallback context if needed
 * @param fn Function to execute with context
 * @param fallbackContext Optional fallback context to use if no context is available
 * @returns The result of the function execution
 */
export function executeWithContextFallback<T>(
    fn: (context: RequestContext) => T,
    fallbackContext?: RequestContext,
): T {
    const context = getRequestContext();
    if (context) {
        return fn(context);
    }

    // Use provided fallback context or create a new one
    const contextToUse = fallbackContext || createFallbackContext();
    return fn(contextToUse);
}

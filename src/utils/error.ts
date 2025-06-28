import {logError} from './logging';

export class ThrownError extends Error {
    code: number;
    constructor(message: string, code?: number) {
        logError('ThrownError', message, code);
        super(message);
        this.code = code || 500;
    }
}

export class NotRetryableError extends Error {
    code: number;
    constructor(message: string, code?: number) {
        logError('NotRetryableError', message, code);
        super(message);
        this.code = code || 500;
    }
}

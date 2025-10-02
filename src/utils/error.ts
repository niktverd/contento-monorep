import { workerLog } from "./logger";

export class ThrownError extends Error {
    code: number;
    name: string;
    constructor(message: string, code?: number) {
        super(message);
        this.code = code || 500;
        this.name = this.constructor.name || 'function name is undefined';
        workerLog.error('ThrownError', message, code, this.name);

        // Capture stack trace and exclude this constructor
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotRetryableError extends Error {
    code: number;
    name: string;
    constructor(message: string, code?: number) {
        super(message);
        this.code = code || 500;
        this.name = this.constructor.name || 'function name is undefined';
        workerLog.error('NotRetryableError', message, code, this.name);

        // Capture stack trace and exclude this constructor
        Error.captureStackTrace(this, this.constructor);
    }
}

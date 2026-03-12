import { Context } from "@temporalio/activity";
import { formatLog } from "./log";

export class ThrownError extends Error {
    code: number;
    name: string;
    constructor(message: string, code?: number) {
        super(message);
        this.code = code || 500;
        this.name = this.constructor.name || 'function name is undefined';
        
        
        Context.current().log.error(formatLog('ThrownError', message, code, this.name));

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
        
        Context.current().log.error(formatLog('NotRetryableError', message, code, this.name));

        // Capture stack trace and exclude this constructor
        Error.captureStackTrace(this, this.constructor);
    }
}

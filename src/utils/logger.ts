import { Context } from '@temporalio/activity';
import { getEnv } from './common';
import { LogMetadata } from '@temporalio/worker';

const {log} = console;

class WorkerLogger {
    workerlog = Context.current().log;

    info (...args: any[]) {
        this.baseLoggin(this.workerlog.info)(args)
    }

    error (...args: any[]) {
        this.baseLoggin(this.workerlog.error)(args)
    }

    warn (...args: any[]) {
        this.baseLoggin(this.workerlog.warn)(args)
    }

    private baseLoggin (method: (message: string, meta?: LogMetadata | undefined) => any) {
        return (...args: any[]) => {
            const isDevelopment = getEnv() === 'development';
            if (isDevelopment) {
                log(args);
            }
    
            method(JSON.stringify(args));
        }
    }
}

export const workerLog = new WorkerLogger();
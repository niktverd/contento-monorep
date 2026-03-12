import { Worker } from "@temporalio/worker";
import { CreateWorkerWithRetryOptions } from "./types";

const SHUTDOWN_TIMEOUT = parseInt(process.env.WORKER_SHUTDOWN_TIMEOUT || '30000', 10);
const MAX_RETRIES = parseInt(process.env.WORKER_MAX_RETRIES || '10', 10);
const INITIAL_RETRY_DELAY = parseInt(process.env.WORKER_INITIAL_RETRY_DELAY || '2000', 10);

export const gracefulShutdown = async (worker: Worker, signal: string, name: string) => {
    // if (isShuttingDown) {
    //     console.log('⚠️ Shutdown already in progress, ignoring signal');
    //     return;
    // }

    // isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    try {
        // Shutdown worker with timeout
        await Promise.race([
            worker.shutdown(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Worker shutdown timeout')), SHUTDOWN_TIMEOUT),
            ),
        ]);

        console.log(`✅ ${name} worker shutdown complete`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during worker shutdown:', error);
        process.exit(1);
    }
};

export const sleep = (ms: number): Promise<void> =>  {
    return new Promise((resolve) => setTimeout(resolve, ms));
};


export const  createWorkerWithRetry = async ({name, ...options}: CreateWorkerWithRetryOptions): Promise<Worker> =>  {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(
                `🔄 Attempt ${attempt}/${MAX_RETRIES}: Creating Temporal downloading worker...`,
            );

            const worker = await Worker.create({
                // connection,
                // taskQueue,
                // // taskQueue: process.env.DOWNLOADING_WORKER_TASK_QUEUE || 'video-downloading',
                // activities,
                // // activities: {
                // //     downloadVideo,
                // //     getAccountsActivity,
                // //     runProcessingActivity,
                // // },
                // maxConcurrentActivityTaskExecutions,
                // maxConcurrentWorkflowTaskExecutions,
                ...options,
                namespace: process.env.TEMPORAL_NAMESPACE || 'default',
                workflowsPath: require.resolve('../workflows'),
            });

            console.log(`✅ ${name} worker created successfully`);
            return worker;
        } catch (error) {
            lastError = error as Error;
            console.error(`❌ Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

            if (attempt < MAX_RETRIES) {
                const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await sleep(delay);
            }
        }
    }

    throw new Error(
        `Failed to create worker after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`,
    );
}

export const startWorker = async (worker: Worker, name: string) => {
    console.log(`🚀 Starting Temporal ${name} worker...`);

    try {
        // Setup enhanced graceful shutdown for multiple signals
        const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
        signals.forEach((signal) => {
            process.on(signal, () => gracefulShutdown(worker, signal, name));
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error(`❌ Uncaught Exception in ${name} worker:`, error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error(
                `❌ Unhandled Rejection in ${name} worker at:`,
                promise,
                'reason:',
                reason,
            );
            process.exit(1);
        });

        console.log(`🏃 ${name} worker is running. Press Ctrl+C to stop.`);
        await worker.run();
    } catch (error) {
        console.error(`❌ Failed to start ${name} worker:`, error);
        process.exit(1);
    }
}

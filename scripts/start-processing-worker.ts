// eslint-disable-next-line import/order, import/no-extraneous-dependencies
import 'module-alias/register';

import {Worker} from '@temporalio/worker';
import dotenv from 'dotenv';

import {
    downloadVideo,
    getAccountsActivity,
    runProcessingActivity,
} from '../src/temporal/activities';

dotenv.config();

// Production configuration
const SHUTDOWN_TIMEOUT = parseInt(process.env.WORKER_SHUTDOWN_TIMEOUT || '30000', 10);
const MAX_RETRIES = parseInt(process.env.WORKER_MAX_RETRIES || '10', 10);
const INITIAL_RETRY_DELAY = parseInt(process.env.WORKER_INITIAL_RETRY_DELAY || '2000', 10);

let isShuttingDown = false;

// Sleep utility
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Enhanced graceful shutdown handler
async function gracefulShutdown(worker: Worker, signal: string) {
    if (isShuttingDown) {
        console.log('⚠️ Shutdown already in progress, ignoring signal');
        return;
    }

    isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    try {
        // Shutdown worker with timeout
        await Promise.race([
            worker.shutdown(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Worker shutdown timeout')), SHUTDOWN_TIMEOUT),
            ),
        ]);

        console.log('✅ Processing worker shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during worker shutdown:', error);
        process.exit(1);
    }
}

async function createWorkerWithRetry(): Promise<Worker> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(
                `🔄 Attempt ${attempt}/${MAX_RETRIES}: Creating Temporal processing worker...`,
            );

            const worker = await Worker.create({
                taskQueue: 'video-processing',
                workflowsPath: require.resolve('../src/temporal/workflows'),
                activities: {
                    downloadVideo,
                    getAccountsActivity,
                    runProcessingActivity,
                },
                maxConcurrentActivityTaskExecutions: 10,
                maxConcurrentWorkflowTaskExecutions: 15,
            });

            console.log('✅ Processing worker created successfully');
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

async function startWorker() {
    console.log('🚀 Starting Temporal processing worker...');

    try {
        const worker = await createWorkerWithRetry();

        console.log('📋 Task Queue: video-processing');
        console.log('🔄 Max concurrent activities: 10');
        console.log('🔄 Max concurrent workflows: 15');

        // Setup enhanced graceful shutdown for multiple signals
        const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
        signals.forEach((signal) => {
            process.on(signal, () => gracefulShutdown(worker, signal));
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception in processing worker:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error(
                '❌ Unhandled Rejection in processing worker at:',
                promise,
                'reason:',
                reason,
            );
            process.exit(1);
        });

        console.log('🏃 Processing worker is running. Press Ctrl+C to stop.');
        await worker.run();
    } catch (error) {
        console.error('❌ Failed to start processing worker:', error);
        process.exit(1);
    }
}

startWorker().catch((err) => {
    console.error('❌ Processing worker startup error:', err);
    process.exit(1);
});

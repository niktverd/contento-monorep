// eslint-disable-next-line import/order, import/no-extraneous-dependencies
import 'module-alias/register';

import {NativeConnection, Worker} from '@temporalio/worker';
import dotenv from 'dotenv';

import {} from '../src/temporal/activities';
import {
    createInstagramContainer,
    // getRandomPreparedVideForAccountActivity,
    publishInstagramPost,
} from '../src/temporal/activities/instagram.activity';

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

        console.log('✅ Publishing worker shutdown complete');
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
                `🔄 Attempt ${attempt}/${MAX_RETRIES}: Creating Temporal publishing worker...`,
            );

            const connection = await NativeConnection.connect({
                address: process.env.TEMPORAL_ADDRESS || 'temporal:7233',
            });

            const worker = await Worker.create({
                connection,
                namespace: 'default',
                taskQueue: 'process-video-publishing',
                workflowsPath: require.resolve('../src/temporal/workflows'),
                activities: {
                    createInstagramContainer,
                    publishInstagramPost,
                    // getRandomPreparedVideForAccountActivity,
                },
                maxConcurrentActivityTaskExecutions: 20,
                maxConcurrentWorkflowTaskExecutions: 20,
                stickyQueueScheduleToStartTimeout: '5m',
            });

            console.log('✅ Publishing worker created successfully');
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
    console.log('🚀 Starting Temporal publishing worker...');

    try {
        const worker = await createWorkerWithRetry();

        console.log('📋 Task Queue: video-publishing');
        console.log('🔄 Max concurrent activities: 1');
        console.log('🔄 Max concurrent workflows: 1');

        // Setup enhanced graceful shutdown for multiple signals
        const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
        signals.forEach((signal) => {
            process.on(signal, () => gracefulShutdown(worker, signal));
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception in publishing worker:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error(
                '❌ Unhandled Rejection in publishing worker at:',
                promise,
                'reason:',
                reason,
            );
            process.exit(1);
        });

        console.log('🏃 Publishing worker is running. Press Ctrl+C to stop.');
        await worker.run();
    } catch (error) {
        console.error('❌ Failed to start publishing worker:', error);
        process.exit(1);
    }
}

startWorker().catch((err) => {
    console.error('❌ Publishing worker startup error:', err);
    process.exit(1);
});

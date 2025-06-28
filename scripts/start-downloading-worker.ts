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

let isShuttingDown = false;

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

        console.log('✅ Downloading worker shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during worker shutdown:', error);
        process.exit(1);
    }
}

async function startWorker() {
    console.log('🚀 Starting Temporal downloading worker...');

    try {
        const worker = await Worker.create({
            taskQueue: 'video-downloading',
            workflowsPath: require.resolve('../src/temporal/workflows'),
            activities: {
                downloadVideo,
                getAccountsActivity,
                runProcessingActivity,
            },
            maxConcurrentActivityTaskExecutions: 15,
            maxConcurrentWorkflowTaskExecutions: 25,
        });

        console.log('✅ Downloading worker created successfully');
        console.log('📋 Task Queue: video-downloading');
        console.log('🔄 Max concurrent activities: 15');
        console.log('🔄 Max concurrent workflows: 25');

        // Setup enhanced graceful shutdown for multiple signals
        const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
        signals.forEach((signal) => {
            process.on(signal, () => gracefulShutdown(worker, signal));
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception in downloading worker:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error(
                '❌ Unhandled Rejection in downloading worker at:',
                promise,
                'reason:',
                reason,
            );
            process.exit(1);
        });

        console.log('🏃 Downloading worker is running. Press Ctrl+C to stop.');
        await worker.run();
    } catch (error) {
        console.error('❌ Failed to start downloading worker:', error);
        process.exit(1);
    }
}

startWorker().catch((err) => {
    console.error('❌ Downloading worker startup error:', err);
    process.exit(1);
});

// Temporal Worker Process for Video Processing
import {NativeConnection, Worker} from '@temporalio/worker';

import * as activities from './activities';

async function runWorker() {
    try {
        // Create connection to Temporal Server
        const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
        const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
        const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'video-processing';

        const connection = await NativeConnection.connect({
            address,
        });

        console.log(`Worker connecting to Temporal at ${address}, namespace: ${namespace}`);

        // Create and configure Worker
        const worker = await Worker.create({
            connection,
            namespace,
            workflowsPath: require.resolve('../workflows'),
            activities,
            taskQueue,
            // Performance and resource configuration
            maxConcurrentActivityTaskExecutions: 5, // Limit concurrent ffmpeg processes
            maxConcurrentWorkflowTaskExecutions: 10, // Allow multiple workflows
            maxActivitiesPerSecond: 20, // Rate limiting for activities
        });

        console.log(`Temporal Worker started successfully`);
        console.log(`- Task Queue: ${taskQueue}`);
        console.log(`- Max Concurrent Activities: 5`);
        console.log(`- Max Concurrent Workflows: 10`);
        console.log(`- Activities Path: ${require.resolve('../workflows')}`);

        // Start polling for tasks
        await worker.run();
    } catch (error) {
        console.error('Worker failed to start:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Start the worker
console.log('Starting Temporal Worker for Video Processing...');
runWorker().catch((err) => {
    console.error('Unhandled worker error:', err);
    process.exit(1);
});

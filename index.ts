import {Server} from 'http';

import dotenv from 'dotenv';

import app from './app';
import {DelayMS} from './src/constants';
import {log} from './src/utils';

import {downloadVideoCron} from '$/chore/components/preprocess-video';

dotenv.config();

const dynamicPort = Number(process.env.PORT);
const appPort = isNaN(dynamicPort) ? 8080 : dynamicPort;

const server: Server = app.listen(appPort, () => {
    log(`🚀 Server listening on port ${appPort}`);
    log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Start background jobs
downloadVideoCron(DelayMS.Sec30);

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
    log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    server.close((err) => {
        if (err) {
            log(`❌ Error during server shutdown: ${err.message}`);
            process.exit(1);
        }

        log('✅ HTTP server closed successfully');

        // Additional cleanup can be added here
        // - Close database connections
        // - Stop background jobs
        // - Cleanup temporary files

        log('✅ Graceful shutdown complete');
        process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        log('⚠️ Forcing shutdown after timeout');
        process.exit(1);
    }, 30000);
};

// Handle process signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    log(`❌ Uncaught Exception: ${err.message}`);
    log(err.stack);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});

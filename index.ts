import {Server} from 'http';

import dotenv from 'dotenv';

import app from './app';
import {initializeDb} from './src/db/utils';
import {log} from './src/utils';

dotenv.config();

const dynamicPort = Number(process.env.PORT);
const appPort = isNaN(dynamicPort) ? 8080 : dynamicPort;

let server: Server;

// Initialize database connection with logging
const initializeApplication = async () => {
    try {
        // Initialize database with connection logging
        await initializeDb();

        // Start the server
        server = app.listen(appPort, () => {
            log(`🚀 Server listening on port ${appPort}`);
            log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            log(`🌍 Environment: ${process.env.APP_ENV || 'development'}`);
            log(`CODE IS RUNNING`);
        });

        return server;
    } catch (error) {
        log('❌ Failed to initialize application:', error);
        process.exit(1);
        return null;
    }
};

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
    log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    if (server) {
        server.close((err: Error | undefined) => {
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
    } else {
        log('⚠️ Server not initialized, exiting immediately');
        process.exit(0);
    }

    // Force shutdown after 30 seconds
    setTimeout(() => {
        log('⚠️ Forcing shutdown after timeout');
        process.exit(1);
    }, 30000);
};

// Start the application
initializeApplication().catch((error) => {
    log('💥 Application startup failed:', error);
    process.exit(1);
});

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

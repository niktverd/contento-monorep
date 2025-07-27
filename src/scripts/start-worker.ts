#!/usr/bin/env tsx
/* eslint-disable no-nested-ternary */

// Production Temporal Worker Startup Script
import {readFileSync} from 'fs';
import http from 'http';
import {join} from 'path';

import {DefaultLogger, NativeConnection, Runtime, Worker} from '@temporalio/worker';
import type {LogLevel} from '@temporalio/worker';

import {downloadVideo} from '../temporal/activities/download.activity';
import {
    createInstagramContainer,
    publishInstagramPost,
} from '../temporal/activities/instagram.activity';
import {processVideo} from '../temporal/activities/process.activity';

// Production Configuration
interface WorkerConfig {
    // Connection settings
    temporalAddress: string;
    namespace: string;
    taskQueue: string;

    // Worker capacity
    maxConcurrentActivityTaskExecutions: number;
    maxConcurrentWorkflowTaskExecutions: number;

    // Timeouts
    shutdownTimeout: number;
    gracefulShutdownTimeout: number;

    // Security
    tlsEnabled: boolean;
    tlsCertPath?: string;
    tlsKeyPath?: string;
    tlsCaPath?: string;

    // Monitoring
    metricsEnabled: boolean;
    metricsPort: number;
    healthCheckPort: number;
    logLevel: LogLevel;
}

const LogLevelMap: Record<string, LogLevel> = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
};

// Load configuration from environment variables
function loadConfig(): WorkerConfig {
    const config: WorkerConfig = {
        // Connection
        temporalAddress: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
        taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'video-processing',

        // Capacity
        maxConcurrentActivityTaskExecutions: parseInt(
            process.env.TEMPORAL_WORKER_MAX_CONCURRENT_ACTIVITIES || '10',
            10,
        ),
        maxConcurrentWorkflowTaskExecutions: parseInt(
            process.env.TEMPORAL_WORKER_MAX_CONCURRENT_WORKFLOWS || '100',
            10,
        ),

        // Timeouts
        shutdownTimeout: parseInt(process.env.TEMPORAL_WORKER_SHUTDOWN_TIMEOUT || '30000', 10),
        gracefulShutdownTimeout: parseInt(
            process.env.TEMPORAL_WORKER_GRACEFUL_SHUTDOWN_TIMEOUT || '10000',
            10,
        ),

        // Security
        tlsEnabled: process.env.TEMPORAL_TLS_ENABLED === 'true',
        tlsCertPath: process.env.TEMPORAL_TLS_CERT_PATH,
        tlsKeyPath: process.env.TEMPORAL_TLS_KEY_PATH,
        tlsCaPath: process.env.TEMPORAL_TLS_CA_PATH,

        // Monitoring
        metricsEnabled: process.env.TEMPORAL_METRICS_ENABLED === 'true',
        metricsPort: parseInt(process.env.TEMPORAL_METRICS_PORT || '9090', 10),
        healthCheckPort: parseInt(process.env.TEMPORAL_HEALTH_CHECK_PORT || '8080', 10),
        logLevel: LogLevelMap[process.env.TEMPORAL_LOG_LEVEL || 'INFO'] || 'INFO',
    };

    return config;
}

// Setup TLS configuration if enabled
function setupTLS(config: WorkerConfig) {
    if (!config.tlsEnabled) {
        return undefined;
    }

    if (!config.tlsCertPath || !config.tlsKeyPath) {
        throw new Error('TLS enabled but certificate paths not provided');
    }

    return {
        clientCertPair: {
            crt: readFileSync(config.tlsCertPath),
            key: readFileSync(config.tlsKeyPath),
        },
        serverRootCACertificate: config.tlsCaPath ? readFileSync(config.tlsCaPath) : undefined,
    };
}

// Setup monitoring endpoints
function setupMonitoring(config: WorkerConfig) {
    if (!config.metricsEnabled) {
        return null;
    }

    // Create simple HTTP server for metrics
    const metricsServer = http.createServer((_req, res) => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('# Temporal Worker Metrics\n# TODO: Implement Prometheus metrics\n');
    });

    metricsServer.listen(config.metricsPort, () => {
        console.log(`📊 Metrics server listening on port ${config.metricsPort}`);
    });

    // Create health check server
    const healthServer = http.createServer((_req, res) => {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(
            JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                worker: 'active',
            }),
        );
    });

    healthServer.listen(config.healthCheckPort, () => {
        console.log(`🏥 Health check server listening on port ${config.healthCheckPort}`);
    });

    return {metricsServer, healthServer};
}

// Graceful shutdown handling
function setupGracefulShutdown(worker: Worker, config: WorkerConfig, healthServer?: http.Server) {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach((signal) => {
        process.on(signal, async () => {
            console.log(`Received ${signal}, starting graceful shutdown...`);

            // Close health check server first
            if (healthServer) {
                healthServer.close();
            }

            try {
                // Shutdown worker with timeout
                await Promise.race([
                    worker.shutdown(),
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error('Shutdown timeout')),
                            config.shutdownTimeout,
                        ),
                    ),
                ]);

                console.log('Worker shutdown completed successfully');
                process.exit(0);
            } catch (error) {
                console.error('Error during worker shutdown:', error as Error);
                process.exit(1);
            }
        });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
}

// Main worker startup function
async function startWorker() {
    const config = loadConfig();

    console.log('Starting Temporal Worker with configuration:', {
        temporalAddress: config.temporalAddress,
        namespace: config.namespace,
        taskQueue: config.taskQueue,
        maxConcurrentActivities: config.maxConcurrentActivityTaskExecutions,
        maxConcurrentWorkflows: config.maxConcurrentWorkflowTaskExecutions,
        tlsEnabled: config.tlsEnabled,
        metricsEnabled: config.metricsEnabled,
    });

    try {
        // Configure runtime
        Runtime.install({
            logger: new DefaultLogger(config.logLevel, ({level, message, meta}) => {
                const timestamp = new Date().toISOString();
                const logEntry = {
                    timestamp,
                    level,
                    message,
                    ...meta,
                };

                // In production, send to your logging service
                console.log(JSON.stringify(logEntry));
            }),
            // Configure telemetry in production
            telemetryOptions: config.metricsEnabled
                ? {
                      metrics: {
                          prometheus: {
                              bindAddress: `0.0.0.0:${config.metricsPort}`,
                          },
                      },
                  }
                : undefined,
        });

        // Setup TLS if enabled
        const tls = setupTLS(config);

        // Create connection
        const connection = await NativeConnection.connect({
            address: config.temporalAddress,
            tls,
        });

        console.log(`Connected to Temporal Server at ${config.temporalAddress}`);

        // Create and configure worker
        const worker = await Worker.create({
            connection,
            namespace: config.namespace,
            taskQueue: config.taskQueue,
            workflowsPath: require.resolve('../src/temporal/workflows'),
            activities: {
                downloadVideo,
                processVideo,
                createInstagramContainer,
                publishInstagramPost,
            },
            maxConcurrentActivityTaskExecutions: config.maxConcurrentActivityTaskExecutions,
            maxConcurrentWorkflowTaskExecutions: config.maxConcurrentWorkflowTaskExecutions,
            ...(config.metricsEnabled && {
                runtimeOptions: {
                    telemetryOptions: {
                        metrics: {
                            prometheus: {
                                bindAddress: `0.0.0.0:${config.metricsPort}`,
                            },
                        },
                    },
                },
            }),

            // Additional production settings
            debugMode: process.env.TEMPORAL_DEBUG_MODE === 'true',
        });

        console.log('Worker created successfully');

        // Setup monitoring
        const monitoringServers = setupMonitoring(config);

        // Setup graceful shutdown
        setupGracefulShutdown(worker, config, monitoringServers?.healthServer);

        console.log(`Worker starting on task queue: ${config.taskQueue}`);
        console.log('Worker is ready to process workflows and activities');

        // Start the worker
        await worker.run();
    } catch (error) {
        console.error('Failed to start worker:', error);
        process.exit(1);
    }
}

// Start the worker if this script is run directly
if (require.main === module) {
    // Load environment variables
    require('dotenv').config();

    // Load temporal-specific env file if it exists
    const temporalEnvPath = join(process.cwd(), '.env.temporal');
    try {
        require('dotenv').config({path: temporalEnvPath});
        console.log('Loaded Temporal-specific environment variables');
    } catch (error) {
        console.log('No .env.temporal file found, using default environment variables');
    }

    startWorker().catch((error) => {
        console.error('Worker startup failed:', error);
        process.exit(1);
    });
}

export {startWorker, loadConfig};

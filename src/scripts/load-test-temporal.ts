#!/usr/bin/env tsx
// Load Testing Script for Temporal Video Workflows
import {performance} from 'perf_hooks';

import {Client, Connection} from '@temporalio/client';

import {VideoWorkflowInput} from '../types/temporal';

interface LoadTestConfig {
    concurrentWorkflows: number;
    totalWorkflows: number;
    taskQueue: string;
    namespace: string;
    address: string;
    timeoutMs: number;
}

interface WorkflowMetrics {
    workflowId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    success: boolean;
    error?: string;
}

interface LoadTestResults {
    totalWorkflows: number;
    successfulWorkflows: number;
    failedWorkflows: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    throughput: number; // workflows per second
    errors: string[];
    metrics: WorkflowMetrics[];
}

class TemporalLoadTester {
    private client!: Client;
    private connection!: Connection;
    private config: LoadTestConfig;
    private metrics: WorkflowMetrics[] = [];

    constructor(config: LoadTestConfig) {
        this.config = config;
    }

    async initialize(): Promise<void> {
        console.log('🚀 Initializing Temporal Load Tester...');
        console.log(
            `📊 Config: ${this.config.concurrentWorkflows} concurrent, ${this.config.totalWorkflows} total workflows`,
        );

        try {
            this.connection = await Connection.connect({
                address: this.config.address,
            });

            this.client = new Client({
                connection: this.connection,
                namespace: this.config.namespace,
            });

            console.log('✅ Connected to Temporal Server');
        } catch (error) {
            console.error('❌ Failed to connect to Temporal Server:', error);
            throw error;
        }
    }

    async cleanup(): Promise<void> {
        if (this.connection) {
            await this.connection.close();
            console.log('🧹 Cleaned up Temporal connection');
        }
    }

    async runLoadTest(): Promise<LoadTestResults> {
        console.log('🎯 Starting load test...');
        const testStartTime = performance.now();

        const totalBatches = Math.ceil(
            this.config.totalWorkflows / this.config.concurrentWorkflows,
        );
        this.metrics = [];

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const remainingWorkflows =
                this.config.totalWorkflows - batchIndex * this.config.concurrentWorkflows;
            const batchSize = Math.min(this.config.concurrentWorkflows, remainingWorkflows);

            const batchResults = await this.runWorkflowBatch(batchSize, batchIndex);
            this.metrics.push(...batchResults);

            // Progress report
            const completed = this.metrics.length;
            const successRate = (this.metrics.filter((m) => m.success).length / completed) * 100;
            console.log(
                `📈 Progress: ${completed}/${this.config.totalWorkflows} (${successRate.toFixed(
                    1,
                )}% success)`,
            );
        }

        const testEndTime = performance.now();
        const totalTestDuration = testEndTime - testStartTime;

        return this.calculateResults(totalTestDuration);
    }

    async monitorSystemResources(): Promise<void> {
        // Basic system monitoring
        const memUsage = process.memoryUsage();
        console.log('\n💾 SYSTEM RESOURCES:');
        console.log(`Memory Usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Memory Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        console.log(`External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
    }

    printResults(results: LoadTestResults): void {
        console.log('\n📊 LOAD TEST RESULTS');
        console.log('='.repeat(50));
        console.log(`Total Workflows: ${results.totalWorkflows}`);
        console.log(
            `Successful: ${results.successfulWorkflows} (${(
                (results.successfulWorkflows / results.totalWorkflows) *
                100
            ).toFixed(1)}%)`,
        );
        console.log(
            `Failed: ${results.failedWorkflows} (${(
                (results.failedWorkflows / results.totalWorkflows) *
                100
            ).toFixed(1)}%)`,
        );
        console.log(`Average Duration: ${results.averageDuration.toFixed(2)}ms`);
        console.log(`Min Duration: ${results.minDuration.toFixed(2)}ms`);
        console.log(`Max Duration: ${results.maxDuration.toFixed(2)}ms`);
        console.log(`Throughput: ${results.throughput.toFixed(2)} workflows/second`);

        if (results.errors.length > 0) {
            console.log('\n❌ UNIQUE ERRORS:');
            results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        // Performance thresholds
        console.log('\n🎯 PERFORMANCE ANALYSIS:');
        const avgDurationSeconds = results.averageDuration / 1000;

        if (avgDurationSeconds < 30) {
            console.log('✅ Excellent performance: Average duration < 30s');
        } else if (avgDurationSeconds < 60) {
            console.log('⚠️  Good performance: Average duration < 60s');
        } else {
            console.log('🔴 Poor performance: Average duration > 60s');
        }

        if (results.throughput > 1) {
            console.log('✅ Good throughput: > 1 workflow/second');
        } else if (results.throughput > 0.5) {
            console.log('⚠️  Moderate throughput: > 0.5 workflow/second');
        } else {
            console.log('🔴 Low throughput: < 0.5 workflow/second');
        }

        const successRate = (results.successfulWorkflows / results.totalWorkflows) * 100;
        if (successRate > 95) {
            console.log('✅ Excellent reliability: > 95% success rate');
        } else if (successRate > 90) {
            console.log('⚠️  Good reliability: > 90% success rate');
        } else {
            console.log('🔴 Poor reliability: < 90% success rate');
        }
    }

    private generateWorkflowInput(index: number): VideoWorkflowInput {
        return {
            sourceId: 10000 + index,
            accountId: 20000 + index,
            scenarioId: 30000 + index,
            firebaseUrl: `https://test-load-firebase.com/video-${index}.mp4`,
        };
    }

    private async runSingleWorkflow(index: number): Promise<WorkflowMetrics> {
        const workflowId = `load-test-${Date.now()}-${index}`;
        const metric: WorkflowMetrics = {
            workflowId,
            startTime: performance.now(),
            success: false,
        };

        try {
            const input = this.generateWorkflowInput(index);

            const handle = await this.client.workflow.start('videoProcessingWorkflow', {
                args: [input],
                taskQueue: this.config.taskQueue,
                workflowId,
            });

            // Wait for workflow completion with timeout
            await Promise.race([
                handle.result(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Workflow timeout')), this.config.timeoutMs),
                ),
            ]);

            metric.endTime = performance.now();
            metric.duration = metric.endTime - metric.startTime;
            metric.success = true;

            console.log(`✅ Workflow ${index} completed in ${metric.duration.toFixed(2)}ms`);
            return metric;
        } catch (error) {
            metric.endTime = performance.now();
            metric.duration = metric.endTime - metric.startTime;
            metric.success = false;
            metric.error = error instanceof Error ? error.message : 'Unknown error';

            console.log(`❌ Workflow ${index} failed: ${metric.error}`);
            return metric;
        }
    }

    private async runWorkflowBatch(
        batchSize: number,
        batchIndex: number,
    ): Promise<WorkflowMetrics[]> {
        console.log(`🔄 Starting batch ${batchIndex + 1} with ${batchSize} workflows...`);

        const promises: Promise<WorkflowMetrics>[] = [];
        const startIndex = batchIndex * this.config.concurrentWorkflows;

        for (let i = 0; i < batchSize; i++) {
            const workflowIndex = startIndex + i;
            promises.push(this.runSingleWorkflow(workflowIndex));
        }

        const batchResults = await Promise.all(promises);
        console.log(`✅ Batch ${batchIndex + 1} completed`);

        return batchResults;
    }

    private calculateResults(totalTestDuration: number): LoadTestResults {
        const successfulWorkflows = this.metrics.filter((m) => m.success);
        const failedWorkflows = this.metrics.filter((m) => !m.success);

        const durations = successfulWorkflows
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .map((m) => m.duration!)
            .filter((d) => d !== undefined);

        const averageDuration =
            durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

        const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
        const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

        const throughput = (successfulWorkflows.length / totalTestDuration) * 1000; // per second

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const errors = failedWorkflows.map((m) => m.error!).filter((e) => e !== undefined);

        return {
            totalWorkflows: this.config.totalWorkflows,
            successfulWorkflows: successfulWorkflows.length,
            failedWorkflows: failedWorkflows.length,
            averageDuration,
            minDuration,
            maxDuration,
            throughput,
            errors: [...new Set(errors)], // unique errors
            metrics: this.metrics,
        };
    }
}

// CLI Configuration
async function main() {
    const config: LoadTestConfig = {
        // eslint-disable-next-line radix
        concurrentWorkflows: parseInt(process.env.CONCURRENT_WORKFLOWS || '5'),
        // eslint-disable-next-line radix
        totalWorkflows: parseInt(process.env.TOTAL_WORKFLOWS || '20'),
        taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'video-processing',
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
        // eslint-disable-next-line radix
        timeoutMs: parseInt(process.env.WORKFLOW_TIMEOUT_MS || '120000'),
    };

    console.log('🔧 Load Test Configuration:');
    Object.entries(config).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });

    const tester = new TemporalLoadTester(config);

    try {
        await tester.initialize();
        await tester.monitorSystemResources();

        const results = await tester.runLoadTest();

        tester.printResults(results);
        await tester.monitorSystemResources();

        // Export results to JSON if requested
        if (process.env.EXPORT_RESULTS === 'true') {
            const fs = await import('fs');
            const filename = `load-test-results-${Date.now()}.json`;
            fs.writeFileSync(filename, JSON.stringify(results, null, 2));
            console.log(`\n💾 Results exported to: ${filename}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('💥 Load test failed:', error);
        process.exit(1);
    } finally {
        await tester.cleanup();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

export {TemporalLoadTester, LoadTestConfig, LoadTestResults};

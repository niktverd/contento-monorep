#!/usr/bin/env ts-node

/**
 * Post-Upgrade Monitoring Script for Temporal
 *
 * This script monitors the Temporal system after upgrade for:
 * 1. Connection stability
 * 2. Workflow execution success rates
 * 3. Worker health
 * 4. Performance metrics
 * 5. Error rates
 */

import {Client, Connection} from '@temporalio/client';

interface MonitoringMetrics {
    connectionAttempts: number;
    connectionFailures: number;
    workflowExecutions: number;
    workflowFailures: number;
    averageResponseTime: number;
    startTime: Date;
}

class TemporalMonitor {
    private client: Client | null = null;
    private connection: Connection | null = null;
    private metrics: MonitoringMetrics;
    private isRunning = false;

    constructor() {
        this.metrics = {
            connectionAttempts: 0,
            connectionFailures: 0,
            workflowExecutions: 0,
            workflowFailures: 0,
            averageResponseTime: 0,
            startTime: new Date(),
        };
    }

    async start() {
        console.log('🔍 Starting Temporal Post-Upgrade Monitoring...\n');
        this.isRunning = true;

        // Start monitoring loop
        this.monitoringLoop();

        // Handle graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    async stop() {
        console.log('\n🛑 Stopping Temporal monitoring...');
        this.isRunning = false;

        if (this.connection) {
            await this.connection.close();
        }

        console.log('📊 Final Monitoring Summary:');
        this.printMetrics();
        process.exit(0);
    }

    private async monitoringLoop() {
        while (this.isRunning) {
            try {
                await this.checkConnection();
                await this.checkWorkflowHealth();
                await this.printMetrics();

                // Wait 30 seconds before next check
                await this.sleep(30000);
            } catch (error) {
                console.error('❌ Monitoring error:', error);
                this.metrics.connectionFailures++;
                await this.sleep(10000); // Wait 10 seconds on error
            }
        }
    }

    private async checkConnection() {
        this.metrics.connectionAttempts++;
        const startTime = Date.now();

        try {
            if (!this.connection) {
                const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
                const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

                this.connection = await Connection.connect({address});
                this.client = new Client({connection: this.connection, namespace});
            }

            // Test connection with a simple operation
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const workflows = this.client!.workflow.list();
            let count = 0;
            for await (const _workflow of workflows) {
                count++;
                if (count >= 1) break; // Just test that we can iterate
            }

            const responseTime = Date.now() - startTime;
            this.updateAverageResponseTime(responseTime);
        } catch (error) {
            this.metrics.connectionFailures++;
            this.connection = null;
            this.client = null;
            throw error;
        }
    }

    private async checkWorkflowHealth() {
        if (!this.client) return;

        try {
            // Check for recent workflow failures
            const workflows = this.client.workflow.list();
            let totalWorkflows = 0;
            let failedWorkflows = 0;

            for await (const workflow of workflows) {
                totalWorkflows++;
                if (workflow.status?.name === 'FAILED') {
                    failedWorkflows++;
                }
                if (totalWorkflows >= 100) break; // Limit check to recent workflows
            }

            this.metrics.workflowExecutions = totalWorkflows;
            this.metrics.workflowFailures = failedWorkflows;
        } catch (error) {
            console.error('⚠️  Workflow health check failed:', error);
        }
    }

    private updateAverageResponseTime(newTime: number) {
        if (this.metrics.averageResponseTime === 0) {
            this.metrics.averageResponseTime = newTime;
        } else {
            this.metrics.averageResponseTime = (this.metrics.averageResponseTime + newTime) / 2;
        }
    }

    private printMetrics() {
        const uptime = Date.now() - this.metrics.startTime.getTime();
        const uptimeMinutes = Math.floor(uptime / 60000);
        const successRate =
            this.metrics.connectionAttempts > 0
                ? (
                      ((this.metrics.connectionAttempts - this.metrics.connectionFailures) /
                          this.metrics.connectionAttempts) *
                      100
                  ).toFixed(1)
                : '0';

        console.log(`\n📊 Temporal Monitoring Report (${uptimeMinutes}m uptime)`);
        console.log('='.repeat(50));
        console.log(
            `🔗 Connection Success Rate: ${successRate}% (${
                this.metrics.connectionAttempts - this.metrics.connectionFailures
            }/${this.metrics.connectionAttempts})`,
        );
        console.log(`⚡ Average Response Time: ${this.metrics.averageResponseTime.toFixed(0)}ms`);
        console.log(`🔄 Workflows Checked: ${this.metrics.workflowExecutions}`);
        console.log(`❌ Failed Workflows: ${this.metrics.workflowFailures}`);

        if (this.metrics.workflowExecutions > 0) {
            const workflowSuccessRate = (
                ((this.metrics.workflowExecutions - this.metrics.workflowFailures) /
                    this.metrics.workflowExecutions) *
                100
            ).toFixed(1);
            console.log(`✅ Workflow Success Rate: ${workflowSuccessRate}%`);
        }

        // Alert on issues
        if (parseFloat(successRate) < 95) {
            console.log('🚨 ALERT: Connection success rate below 95%');
        }
        if (this.metrics.averageResponseTime > 5000) {
            console.log('🚨 ALERT: Average response time above 5 seconds');
        }
        if (this.metrics.workflowFailures > 0) {
            console.log('🚨 ALERT: Workflow failures detected');
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

async function main() {
    const monitor = new TemporalMonitor();
    await monitor.start();
}

// Run monitoring if this script is executed directly
if (require.main === module) {
    main().catch((error) => {
        console.error('Monitoring script failed:', error);
        process.exit(1);
    });
}

export {TemporalMonitor};

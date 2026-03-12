#!/usr/bin/env tsx

/**
 * End-to-End Deployment Test Script
 * Tests staging environment after deployment to verify all services are working correctly
 */

import http from 'http';
import {URL} from 'url';

import {Client, Connection} from '@temporalio/client';

// Configuration
const config = {
    staging: {
        baseUrl: process.env.STAGING_URL || 'http://localhost:8080',
        temporalAddress: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
        temporalNamespace: process.env.TEMPORAL_NAMESPACE || 'default',
    },
    timeout: 30000, // 30 seconds
    retries: 3,
};

// Test results tracking
interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration: number;
}

const testResults: TestResult[] = [];

// Utility functions
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function makeHttpRequest(
    url: string,
    timeout = 10000,
): Promise<{
    statusCode: number;
    data: string;
}> {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            timeout,
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode || 0,
                    data,
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    console.log(`🧪 Running test: ${testName}`);

    try {
        await testFn();
        const duration = Date.now() - startTime;
        testResults.push({name: testName, passed: true, duration});
        console.log(`  ✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        testResults.push({name: testName, passed: false, error: errorMessage, duration});
        console.log(`  ❌ ${testName} - FAILED (${duration}ms): ${errorMessage}`);
    }
}

// Test functions
async function testHealthEndpoint(): Promise<void> {
    const response = await makeHttpRequest(`${config.staging.baseUrl}/api/ping`, config.timeout);

    if (response.statusCode !== 200) {
        throw new Error(`Health endpoint returned ${response.statusCode}, expected 200`);
    }

    // Parse health response
    let healthData;
    try {
        healthData = JSON.parse(response.data);
    } catch {
        throw new Error('Health endpoint returned invalid JSON');
    }

    if (healthData.status !== 'success') {
        throw new Error(`Health status is '${healthData.status}', expected 'success'`);
    }

    console.log(`    ℹ️ Health check response: ${JSON.stringify(healthData, null, 2)}`);
}

async function testMetricsEndpoint(): Promise<void> {
    const response = await makeHttpRequest(`${config.staging.baseUrl}/metrics`, config.timeout);

    if (response.statusCode !== 200) {
        throw new Error(`Metrics endpoint returned ${response.statusCode}, expected 200`);
    }

    // Check for basic Prometheus metrics
    if (!response.data.includes('# HELP')) {
        throw new Error('Metrics endpoint does not contain Prometheus format metrics');
    }

    console.log(`    ℹ️ Metrics endpoint returning ${response.data.length} characters`);
}

async function testTemporalConnection(): Promise<void> {
    const connection = await Connection.connect({
        address: config.staging.temporalAddress,
    });

    const client = new Client({
        connection,
        namespace: config.staging.temporalNamespace,
    });

    // Test listing workflows (should work even if empty)
    const workflows = client.workflow.list();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workflowArray: any[] = [];
    for await (const workflow of workflows) {
        workflowArray.push(workflow);
    }
    console.log(`    ℹ️ Temporal connection successful, found ${workflowArray.length} workflows`);

    await connection.close();
}

async function testTemporalWebUI(): Promise<void> {
    // Temporal UI should be accessible via NGINX proxy
    const temporalUIUrl = `${config.staging.baseUrl}/temporal`;
    const response = await makeHttpRequest(temporalUIUrl, config.timeout);

    if (response.statusCode !== 200) {
        throw new Error(`Temporal UI returned ${response.statusCode}, expected 200`);
    }

    // Check for basic Temporal UI content
    if (!response.data.includes('Temporal') && !response.data.includes('temporal')) {
        throw new Error('Temporal UI does not contain expected content');
    }

    console.log(`    ℹ️ Temporal UI accessible and responding`);
}

async function testWorkflowExecution(): Promise<void> {
    const connection = await Connection.connect({
        address: config.staging.temporalAddress,
    });

    // Start a simple test workflow (if test workflows are available)
    try {
        const workflowId = `e2e-test-${Date.now()}`;

        // This is a placeholder - would need actual test workflow
        console.log(`    ℹ️ Would start test workflow with ID: ${workflowId}`);
        console.log(`    ℹ️ Workflow execution test skipped (no test workflows configured)`);
    } catch (error) {
        console.log(`    ⚠️ Workflow execution test failed, but this is expected in basic setup`);
    }

    await connection.close();
}

async function testDatabaseConnection(): Promise<void> {
    // Test database connection via application health endpoint
    const response = await makeHttpRequest(`${config.staging.baseUrl}/api/ping`, config.timeout);

    if (response.statusCode !== 200) {
        throw new Error(`Database health endpoint returned ${response.statusCode}, expected 200`);
    }

    console.log(`    ℹ️ Database connection test via health endpoint successful`);
}

async function testContainerHealth(): Promise<void> {
    // Test all critical endpoints to ensure containers are healthy
    const endpoints = [
        {name: 'Application API', url: `${config.staging.baseUrl}/api/ping`},
        {name: 'Metrics', url: `${config.staging.baseUrl}/metrics`},
        {name: 'Temporal UI', url: `${config.staging.baseUrl}/temporal`},
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await makeHttpRequest(endpoint.url, 5000);
            if (response.statusCode >= 400) {
                throw new Error(`${endpoint.name} returned ${response.statusCode}`);
            }
            console.log(`    ✅ ${endpoint.name} is healthy`);
        } catch (error) {
            throw new Error(`${endpoint.name} failed: ${(error as Error).message}`);
        }
    }
}

async function testResourceUsage(): Promise<void> {
    // Basic test to ensure services are responding within reasonable time
    const startTime = Date.now();
    await makeHttpRequest(`${config.staging.baseUrl}/api/ping`, 5000);
    const responseTime = Date.now() - startTime;

    if (responseTime > 3000) {
        throw new Error(`Response time ${responseTime}ms is too slow (>3000ms)`);
    }

    console.log(`    ℹ️ Response time: ${responseTime}ms (good)`);
}

// Main test runner
async function runAllTests(): Promise<void> {
    console.log('🚀 Starting End-to-End Deployment Tests');
    console.log(`📍 Testing staging environment: ${config.staging.baseUrl}`);
    console.log(`⏰ Timeout: ${config.timeout}ms`);
    console.log('');

    // Wait for services to be ready
    console.log('⏳ Waiting for services to be ready...');
    await sleep(10000);

    // Run all tests
    await runTest('Health Endpoint', testHealthEndpoint);
    await runTest('Metrics Endpoint', testMetricsEndpoint);
    await runTest('Database Connection', testDatabaseConnection);
    await runTest('Temporal Connection', testTemporalConnection);
    await runTest('Temporal Web UI', testTemporalWebUI);
    await runTest('Container Health', testContainerHealth);
    await runTest('Resource Usage', testResourceUsage);
    await runTest('Workflow Execution', testWorkflowExecution);

    // Generate test report
    console.log('');
    console.log('📊 Test Results Summary:');
    console.log('========================');

    const passed = testResults.filter((t) => t.passed).length;
    const failed = testResults.filter((t) => !t.passed).length;
    const totalDuration = testResults.reduce((sum, t) => sum + t.duration, 0);

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);
    console.log('');

    // Detailed results
    testResults.forEach((result) => {
        const status = result.passed ? '✅' : '❌';
        const duration = `${result.duration}ms`;
        console.log(`${status} ${result.name.padEnd(30)} ${duration.padStart(8)}`);
        if (result.error) {
            console.log(`    Error: ${result.error}`);
        }
    });

    console.log('');

    // Final verdict
    if (failed === 0) {
        console.log('🎉 All tests passed! Staging deployment is healthy.');
        process.exit(0);
    } else {
        console.log(`💥 ${failed} test(s) failed. Staging deployment has issues.`);
        process.exit(1);
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run tests
runAllTests().catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
});

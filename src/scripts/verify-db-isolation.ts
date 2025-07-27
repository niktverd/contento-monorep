#!/usr/bin/env tsx

/**
 * Database Isolation Verification Script
 *
 * This script verifies that app_user can only access app_db and cannot access
 * temporal or temporal_visibility databases, ensuring proper database isolation.
 */

import {Client} from 'pg';

interface DatabaseTestConfig {
    database: string;
    expectedResult: 'success' | 'failure';
    description: string;
}

const APP_DATABASE_URL = process.env.APP_DATABASE_URL;
const DATABASE_URL = process.env.DATABASE_URL;

if (!APP_DATABASE_URL) {
    console.error('❌ APP_DATABASE_URL environment variable is required');
    process.exit(1);
}

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required for comparison');
    process.exit(1);
}

// Parse connection details from APP_DATABASE_URL
const parseConnectionUrl = (url: string) => {
    const urlObj = new URL(url);
    return {
        host: urlObj.hostname,
        // eslint-disable-next-line radix
        port: parseInt(urlObj.port) || 5432,
        user: urlObj.username,
        password: urlObj.password,
        database: urlObj.pathname.substring(1), // Remove leading slash
    };
};

const appDbConfig = parseConnectionUrl(APP_DATABASE_URL);

// Test configurations for different databases
const testConfigs: DatabaseTestConfig[] = [
    {
        database: 'app_db',
        expectedResult: 'success',
        description: 'app_user should have access to app_db',
    },
    {
        database: 'temporal',
        expectedResult: 'failure',
        description: 'app_user should NOT have access to temporal database',
    },
    {
        database: 'temporal_visibility',
        expectedResult: 'failure',
        description: 'app_user should NOT have access to temporal_visibility database',
    },
];

async function testDatabaseAccess(database: string): Promise<boolean> {
    const client = new Client({
        host: appDbConfig.host,
        port: appDbConfig.port,
        user: appDbConfig.user,
        password: appDbConfig.password,
        database: database,
        ssl: process.env.NODE_ENV === 'production' ? {rejectUnauthorized: false} : false,
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        await client.query('SELECT 1 as test');
        await client.end();
        return true;
    } catch (error) {
        try {
            await client.end();
        } catch {
            // Ignore cleanup errors
        }
        return false;
    }
}

async function verifyDatabaseIsolation(): Promise<boolean> {
    console.log('🔒 Starting database isolation verification...');
    console.log(
        `Using app_user credentials from: ${appDbConfig.user}@${appDbConfig.host}:${appDbConfig.port}`,
    );

    let allTestsPassed = true;
    const results: Array<{test: string; passed: boolean; expected: string; actual: string}> = [];

    for (const config of testConfigs) {
        console.log(`\n📊 Testing access to database: ${config.database}`);
        console.log(`Expected: ${config.expectedResult} - ${config.description}`);

        try {
            const canAccess = await testDatabaseAccess(config.database);
            const testPassed = (config.expectedResult === 'success') === canAccess;

            const result = {
                test: `${config.database} access`,
                passed: testPassed,
                expected: config.expectedResult,
                actual: canAccess ? 'success' : 'failure',
            };

            results.push(result);

            if (testPassed) {
                console.log(`✅ PASS: ${config.description}`);
                if (canAccess) {
                    console.log(`   ↳ Successfully connected to ${config.database}`);
                } else {
                    console.log(`   ↳ Correctly denied access to ${config.database}`);
                }
            } else {
                console.error(`❌ FAIL: ${config.description}`);
                console.error(
                    `   ↳ Expected ${config.expectedResult}, got ${
                        canAccess ? 'success' : 'failure'
                    }`,
                );
                allTestsPassed = false;
            }
        } catch (error) {
            console.error(`❌ ERROR testing ${config.database}: ${error}`);
            allTestsPassed = false;
            results.push({
                test: `${config.database} access`,
                passed: false,
                expected: config.expectedResult,
                actual: 'error',
            });
        }
    }

    // Summary
    console.log('\n📋 DATABASE ISOLATION VERIFICATION SUMMARY');
    console.log('='.repeat(50));

    results.forEach((result) => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${result.test}: expected ${result.expected}, got ${result.actual}`);
    });

    const passedCount = results.filter((r) => r.passed).length;
    console.log(`\nResults: ${passedCount}/${results.length} tests passed`);

    if (allTestsPassed) {
        console.log('🎉 All database isolation tests passed!');
        console.log('✅ Database separation is properly configured');
    } else {
        console.error('💥 Some database isolation tests failed!');
        console.error('❌ Database separation needs to be fixed');
    }

    return allTestsPassed;
}

// Additional verification: Check that app_user can perform basic operations on app_db
async function verifyAppDbOperations(): Promise<boolean> {
    console.log('\n🔧 Verifying app_user can perform operations on app_db...');

    const client = new Client({
        host: appDbConfig.host,
        port: appDbConfig.port,
        user: appDbConfig.user,
        password: appDbConfig.password,
        database: appDbConfig.database,
        ssl: process.env.NODE_ENV === 'production' ? {rejectUnauthorized: false} : false,
    });

    try {
        await client.connect();

        // Test basic operations
        const operations = [
            {name: 'SELECT version()', query: 'SELECT version()'},
            {
                name: 'List tables',
                query: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
            },
            {
                name: 'Check migrations table',
                query: 'SELECT name FROM knex_migrations ORDER BY id DESC LIMIT 1',
            },
        ];

        for (const op of operations) {
            try {
                const result = await client.query(op.query);
                console.log(`✅ ${op.name}: OK (${result.rowCount} rows)`);

                if (op.name === 'Check migrations table' && result.rows.length > 0) {
                    console.log(`   ↳ Latest migration: ${result.rows[0].name}`);
                }
            } catch (error) {
                console.warn(`⚠️  ${op.name}: ${error}`);
            }
        }

        await client.end();
        return true;
    } catch (error) {
        console.error(`❌ Failed to verify app_db operations: ${error}`);
        try {
            await client.end();
        } catch {
            // Ignore cleanup errors
        }
        return false;
    }
}

async function main() {
    try {
        console.log('🔍 Database Isolation Verification Script Starting...');
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

        const isolationPassed = await verifyDatabaseIsolation();
        const operationsPassed = await verifyAppDbOperations();

        const overallSuccess = isolationPassed && operationsPassed;

        console.log('\n' + '='.repeat(60));
        if (overallSuccess) {
            console.log('🎉 DATABASE ISOLATION VERIFICATION: SUCCESS');
            console.log('✅ All checks passed - database separation is working correctly');
            process.exit(0);
        } else {
            console.error('💥 DATABASE ISOLATION VERIFICATION: FAILED');
            console.error('❌ Some checks failed - database separation needs attention');
            process.exit(1);
        }
    } catch (error) {
        console.error(`💥 Script failed with error: ${error}`);
        process.exit(1);
    }
}

// Run the verification if this script is executed directly
if (require.main === module) {
    main();
}

export {verifyDatabaseIsolation, verifyAppDbOperations};

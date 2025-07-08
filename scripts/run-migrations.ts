#!/usr/bin/env ts-node
import * as path from 'path';

import {Knex, knex} from 'knex';

// Define logging functions that work in both development and production
const log = (message: string) => {
    const isDevelopment = process.env.APP_ENV === 'development';
    if (isDevelopment) {
        console.log(`[MIGRATION] ${message}`);
    } else {
        console.log(JSON.stringify(['[MIGRATION]', message]));
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logError = (message: string, error?: any) => {
    const isDevelopment = process.env.APP_ENV === 'development';
    if (isDevelopment) {
        console.error(`[MIGRATION ERROR] ${message}`, error || '');
    } else {
        console.error(JSON.stringify(['[MIGRATION ERROR]', message, error || '']));
    }
};

const logMigrationProgress = (
    migrationName: string,
    status: 'starting' | 'completed' | 'skipped',
) => {
    const isDevelopment = process.env.APP_ENV === 'development';
    const statusEmoji = {
        starting: '⏳',
        completed: '✅',
        skipped: '⏭️',
    };

    const message = `${statusEmoji[status]} Migration ${migrationName} ${status}`;

    if (isDevelopment) {
        console.log(`[MIGRATION] ${message}`);
    } else {
        console.log(JSON.stringify(['[MIGRATION]', message]));
    }
};

async function runMigrationsWithLogging() {
    const environment = process.env.APP_ENV || 'development';
    let db: Knex | null = null;

    try {
        // Load knex configuration
        const dbConfig = require(path.join(__dirname, '../knexfile'))[environment];
        log(`Starting migrations for environment: ${environment}`);

        // Create database connection
        db = knex(dbConfig);

        // Check current migration status
        const [completedMigrations, pendingMigrations] = await Promise.all([
            db.migrate.currentVersion(),
            db.migrate.list(),
        ]);

        log(`Current migration version: ${completedMigrations || 'none'}`);

        const [, pending] = pendingMigrations;

        if (pending.length === 0) {
            log('✅ All migrations are up to date - no migrations to run');
            return;
        }

        log(`Found ${pending.length} pending migration(s):`);
        pending.forEach((migration: string) => {
            log(`  - ${migration}`);
        });

        // Run migrations with progress logging
        log('🚀 Starting migration process...');

        // Use the migrate.latest() method but with custom logging
        const [batchNo, migrationNames] = await db.migrate.latest();

        if (migrationNames.length === 0) {
            log('✅ No new migrations to apply');
        } else {
            log(`📦 Applied ${migrationNames.length} migration(s) in batch ${batchNo}:`);
            migrationNames.forEach((migrationName: string) => {
                logMigrationProgress(migrationName, 'completed');
            });
        }

        // Log final status
        const finalVersion = await db.migrate.currentVersion();
        log(`✅ Migration process completed successfully`);
        log(`📊 Final database schema version: ${finalVersion}`);
    } catch (error) {
        logError('Migration process failed', error);
        process.exit(1);
    } finally {
        if (db) {
            await db.destroy();
        }
    }
}

// Run the migration process
runMigrationsWithLogging()
    .then(() => {
        log('🎉 Migration script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        logError('Migration script failed', error);
        process.exit(1);
    });

/* eslint-env jest */
const {execSync} = require('child_process');

const {db} = require('../db/utils');

beforeAll(async () => {
    process.env.SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || 'test-secret';
    // Откатываем все миграции и накатываем заново
    execSync('npx knex migrate:rollback --all');
    execSync('npx knex migrate:latest');
});

beforeEach(async () => {
    const {rows} = await db.raw(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'knex_%'
  `);

    const tableNames = rows.map((r) => `"${r.tablename}"`).join(', ');

    if (tableNames) {
        await db.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
    }

    // Insert a default organization for FK constraints in UI tests
    const inserted = await db('organizations').insert({name: 'Default Test Org'}).returning('id');
    const orgId = Array.isArray(inserted) ? inserted[0].id ?? inserted[0] : inserted;
    process.env.TEST_ORG_ID = String(orgId);
});

afterAll(async () => {
    await db.destroy();
    if (process.env.NODE_ENV === 'debug') {
        // eslint-disable-next-line no-underscore-dangle
        console.log('HANDLES', process._getActiveHandles());
        // eslint-disable-next-line no-underscore-dangle
        console.log('REQUESTS', process._getActiveRequests());
    }
});

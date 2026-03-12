/* eslint-disable valid-jsdoc */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// Reusable helpers to keep migration DRY and consistent
async function ensureOrganizationsTable(trx, knex) {
    const hasOrganizations = await trx.schema.hasTable('organizations');
    if (!hasOrganizations) {
        await trx.schema.createTable('organizations', (table) => {
            table.increments('id').primary();
            table.string('name').unique().notNullable();
            table.timestamp('createdAt').defaultTo(knex.fn.now());
            table.timestamp('updatedAt').defaultTo(knex.fn.now());
        });
    }
}

async function upsertInternalOrganization(trx) {
    const inserted = await trx('organizations')
        .insert({name: 'Internal'})
        .onConflict('name')
        .ignore()
        .returning('id');

    if (inserted && inserted.length > 0 && inserted[0] && inserted[0].id !== undefined) {
        return inserted[0].id;
    }

    const existing = await trx('organizations').select('id').where({name: 'Internal'}).first();
    return existing.id;
}

async function addOrganizationIdColumn(trx, tableName) {
    await trx.schema.alterTable(tableName, (table) => {
        table.integer('organizationId').nullable();
    });
}

async function populateOrganizationId(trx, tableName, organizationId) {
    await trx(tableName).update({organizationId}).whereNull('organizationId');
}

async function dropUniqueConstraint(trx, tableName, columns) {
    await trx.schema.alterTable(tableName, (table) => {
        table.dropUnique(columns);
    });
}

async function addUniqueConstraint(trx, tableName, columns, constraintName) {
    await trx.schema.alterTable(tableName, (table) => {
        table.unique(columns, constraintName);
    });
}

async function addIndex(trx, tableName, columns, indexName) {
    await trx.schema.alterTable(tableName, (table) => {
        table.index(columns, indexName);
    });
}

async function addOrganizationForeignKey(trx, tableName, fkName) {
    await trx.schema.alterTable(tableName, (table) => {
        table.foreign('organizationId', fkName).references('organizations.id').onDelete('RESTRICT');
    });
}

async function enforceOrganizationIdNotNull(trx, tableName) {
    await trx.schema.alterTable(tableName, (table) => {
        table.integer('organizationId').notNullable().alter();
    });
}

async function removeIndex(trx, tableName, columns, indexName) {
    await trx.schema.alterTable(tableName, (table) => {
        table.dropIndex(columns, indexName);
    });
}

async function removeUniqueConstraint(trx, tableName, columns, constraintName) {
    await trx.schema.alterTable(tableName, (table) => {
        table.dropUnique(columns, constraintName);
    });
}

async function removeOrganizationForeignKeyAndColumn(trx, tableName, fkName) {
    await trx.schema.alterTable(tableName, (table) => {
        table.dropForeign('organizationId', fkName);
        table.dropColumn('organizationId');
    });
}

// Declarative table specs to apply the same transformation compactly
const TABLE_SPECS = [
    {
        table: 'accounts',
        fkName: 'accounts_org_fk',
        uniqueDrop: ['slug'],
        uniqueAdd: {cols: ['organizationId', 'slug'], name: 'accounts_org_slug_unique'},
        uniqueRestore: ['slug'],
        indexes: [{cols: ['organizationId', 'slug'], name: 'accounts_org_slug_idx'}],
    },
    {
        table: 'scenarios',
        fkName: 'scenarios_org_fk',
        uniqueDrop: ['slug'],
        uniqueAdd: {cols: ['organizationId', 'slug'], name: 'scenarios_org_slug_unique'},
        uniqueRestore: ['slug'],
        indexes: [{cols: ['organizationId', 'slug'], name: 'scenarios_org_slug_idx'}],
    },
    {
        table: 'accountScenarios',
        fkName: 'account_scenarios_org_fk',
        uniqueDrop: ['accountId', 'scenarioId'],
        uniqueAdd: {
            cols: ['organizationId', 'accountId', 'scenarioId'],
            name: 'account_scenarios_org_account_scenario_unique',
        },
        uniqueRestore: ['accountId', 'scenarioId'],
    },
    {
        table: 'sources',
        fkName: 'sources_org_fk',
        indexes: [{cols: ['organizationId', 'lastUsed'], name: 'sources_org_lastUsed_idx'}],
    },
    {
        table: 'preparedVideos',
        fkName: 'prepared_videos_org_fk',
        indexes: [
            {cols: ['organizationId', 'accountId'], name: 'prepared_videos_org_account_idx'},
            {cols: ['organizationId', 'scenarioId'], name: 'prepared_videos_org_scenario_idx'},
        ],
    },
    {
        table: 'instagramMediaContainers',
        fkName: 'ig_media_containers_org_fk',
        indexes: [
            {cols: ['organizationId', 'accountId'], name: 'ig_media_containers_org_account_idx'},
            {
                cols: ['organizationId', 'preparedVideoId'],
                name: 'ig_media_containers_org_prepared_video_idx',
            },
            {
                cols: ['organizationId', 'isPublished'],
                name: 'ig_media_containers_org_published_idx',
            },
        ],
    },
    // instagramLocations and its join tables remain global (no organizationId)
    {
        table: 'cloudRunScenarioExecutions',
        fkName: 'cloud_run_exec_org_fk',
        indexes: [
            {cols: ['organizationId', 'status'], name: 'cloud_run_exec_org_status_idx'},
            {
                cols: ['organizationId', 'accountId', 'scenarioId'],
                name: 'cloud_run_exec_org_account_scenario_idx',
            },
        ],
    },
];

exports.up = async function (knex) {
    await knex.transaction(async (trx) => {
        await ensureOrganizationsTable(trx, knex);
        const internalOrgId = await upsertInternalOrganization(trx);

        for (const spec of TABLE_SPECS) {
            await addOrganizationIdColumn(trx, spec.table);
            await populateOrganizationId(trx, spec.table, internalOrgId);

            if (spec.uniqueDrop) {
                await dropUniqueConstraint(trx, spec.table, spec.uniqueDrop);
            }
            if (spec.uniqueAdd) {
                await addUniqueConstraint(
                    trx,
                    spec.table,
                    spec.uniqueAdd.cols,
                    spec.uniqueAdd.name,
                );
            }
            if (spec.indexes) {
                for (const idx of spec.indexes) {
                    await addIndex(trx, spec.table, idx.cols, idx.name);
                }
            }

            await addOrganizationForeignKey(trx, spec.table, spec.fkName);
            await enforceOrganizationIdNotNull(trx, spec.table);
        }
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.transaction(async (trx) => {
        for (const spec of [...TABLE_SPECS].reverse()) {
            if (spec.indexes) {
                for (const idx of spec.indexes) {
                    await removeIndex(trx, spec.table, idx.cols, idx.name);
                }
            }
            if (spec.uniqueAdd) {
                await removeUniqueConstraint(
                    trx,
                    spec.table,
                    spec.uniqueAdd.cols,
                    spec.uniqueAdd.name,
                );
            }
            await removeOrganizationForeignKeyAndColumn(trx, spec.table, spec.fkName);
            if (spec.uniqueRestore) {
                await addUniqueConstraint(trx, spec.table, spec.uniqueRestore);
            }
        }
    });
};

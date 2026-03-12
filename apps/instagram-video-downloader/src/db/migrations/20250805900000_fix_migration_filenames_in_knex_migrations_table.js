/* eslint-disable valid-jsdoc */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Fix migration filenames in knex_migrations table for production environments
    // This handles the case where migrations were already applied with the wrong timestamps

    const oldToNewMappings = [
        {
            old: '20252201120000_create_cloud_run_scenario_executions_table.js',
            new: '20250806000000_create_cloud_run_scenario_executions_table.js',
        },
        {
            old: '20252115674113_create_instagram_locations_table.js',
            new: '20250806100000_create_instagram_locations_table.js',
        },
    ];

    // Check if knex_migrations table exists and has the old records
    const hasTable = await knex.schema.hasTable('knex_migrations');
    if (!hasTable) {
        // Fresh environment, nothing to fix
        return;
    }

    for (const mapping of oldToNewMappings) {
        // Check if the old record exists
        const oldRecord = await knex('knex_migrations').where('name', mapping.old).first();

        if (oldRecord) {
            // Update the record with the new filename
            await knex('knex_migrations').where('name', mapping.old).update({
                name: mapping.new,
            });

            console.log(`Updated migration record: ${mapping.old} → ${mapping.new}`);
        }
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Revert the migration filename changes
    const newToOldMappings = [
        {
            new: '20250806000000_create_cloud_run_scenario_executions_table.js',
            old: '20252201120000_create_cloud_run_scenario_executions_table.js',
        },
        {
            new: '20250806100000_create_instagram_locations_table.js',
            old: '20252115674113_create_instagram_locations_table.js',
        },
    ];

    const hasTable = await knex.schema.hasTable('knex_migrations');
    if (!hasTable) {
        return;
    }

    for (const mapping of newToOldMappings) {
        const newRecord = await knex('knex_migrations').where('name', mapping.new).first();

        if (newRecord) {
            await knex('knex_migrations').where('name', mapping.new).update({
                name: mapping.old,
            });

            console.log(`Reverted migration record: ${mapping.new} → ${mapping.old}`);
        }
    }
};

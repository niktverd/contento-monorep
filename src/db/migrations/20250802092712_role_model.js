// eslint-disable-next-line valid-jsdoc
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.dropTableIfExists('userOrganizationRoles');
    await knex.schema.dropTableIfExists('roles');
    await knex.schema.dropTableIfExists('users');

    await knex.schema.createTable('users', (table) => {
        table.increments('id').primary(); // Auto-incrementing ID
        table.string('email').unique().notNullable();
        table.string('name');
        table.string('uid').notNullable();
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('roles', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('description').notNullable();
        table.jsonb('permissions').notNullable().defaultTo([]);
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('userOrganizationRoles', (table) => {
        table.increments('id').primary();
        table.integer('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table
            .integer('organizationId')
            .notNullable()
            .references('id')
            .inTable('organizations')
            .onDelete('CASCADE');
        table.integer('roleId').notNullable().references('id').inTable('roles').onDelete('CASCADE');
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
    });
};

// eslint-disable-next-line valid-jsdoc
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('userOrganizationRoles');
    await knex.schema.dropTableIfExists('roles');
    await knex.schema.dropTableIfExists('users');
};

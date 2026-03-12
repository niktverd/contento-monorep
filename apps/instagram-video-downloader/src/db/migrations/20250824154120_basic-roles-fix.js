/* eslint-disable valid-jsdoc */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    try {
        const roles = await knex('roles').select('*');

        for (const role of roles) {
            if (role.permissions.includes('instagramLocations.delete')) {
                const permissions = role.permissions.filter(
                    (permission) => permission !== 'instagramLocations.delete',
                );
                await knex('roles')
                    .where('id', role.id)
                    .update({permissions: JSON.stringify(permissions)});
            }
        }
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    return knex('roles').where('name', 'Instagram Locations Admin');
};

/* eslint-disable valid-jsdoc */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const basicScenariosPermissions = {
    scenaiosGet: {
        name: 'Scenarios Viewer',
        description: 'Scenario Viewer',
        permissions: ['scenarios.get'],
    },
    scenariosEdit: {
        name: 'Scenarios Editor',
        description: 'Scenario Editor',
        permissions: ['scenarios.edit'],
    },
    scenariosAdmin: {
        name: 'Scenarios Admin',
        description: 'Scenario Admin',
        permissions: ['scenarios.edit', 'scenarios.get'],
    },
};

const basicAccountsPermissions = {
    accountsGet: {
        name: 'Accounts Viewer',
        description: 'Account Viewer',
        permissions: ['accounts.get'],
    },
    accountsEdit: {
        name: 'Accounts Editor',
        description: 'Account Editor',
        permissions: ['accounts.edit'],
    },
    accountsAdmin: {
        name: 'Accounts Admin',
        description: 'Account Admin',
        permissions: ['accounts.edit', 'accounts.get'],
    },
};

const basicSourcesPermissions = {
    sourcesGet: {
        name: 'Sources Viewer',
        description: 'Source Viewer',
        permissions: ['sources.get'],
    },
    sourcesEdit: {
        name: 'Sources Editor',
        description: 'Source Editor',
        permissions: ['sources.edit'],
    },
    sourcesAdmin: {
        name: 'Sources Admin',
        description: 'Source Admin',
        permissions: ['sources.edit', 'sources.get'],
    },
};

const basicPreparedVideosPermissions = {
    preparedVideosGet: {
        name: 'Prepared Videos Viewer',
        description: 'Prepared Video Viewer',
        permissions: ['preparedVideos.get'],
    },
    preparedVideosEdit: {
        name: 'Prepared Videos Editor',
        description: 'Prepared Video Editor',
        permissions: ['preparedVideos.edit'],
    },
    preparedVideosAdmin: {
        name: 'Prepared Videos Admin',
        description: 'Prepared Video Admin',
        permissions: ['preparedVideos.edit', 'preparedVideos.get'],
    },
};

const basicInstagramMediaContainersPermissions = {
    instagramMediaContainersGet: {
        name: 'Instagram Media Container Viewer',
        description: 'Instagram Media Container Viewer',
        permissions: ['instagramMediaContainers.get'],
    },
    instagramMediaContainersEdit: {
        name: 'Instagram Media Container Editor',
        description: 'Instagram Media Container Editor',
        permissions: ['instagramMediaContainers.edit'],
    },
    instagramMediaContainersAdmin: {
        name: 'Instagram Media Container Admin',
        description: 'Instagram Media Container Admin',
        permissions: ['instagramMediaContainers.edit', 'instagramMediaContainers.get'],
    },
};

// instagramLocations
const basicInstagramLocationsPermissions = {
    instagramLocationsGet: {
        name: 'Instagram Locations Viewer',
        description: 'Instagram Locations Viewer',
        permissions: ['instagramLocations.get'],
    },
    instagramLocationsEdit: {
        name: 'Instagram Locations Editor',
        description: 'Instagram Locations Editor',
        permissions: ['instagramLocations.edit'],
    },
    instagramLocationsAdmin: {
        name: 'Instagram Locations Admin',
        description: 'Instagram Locations Admin',
        permissions: ['instagramLocations.edit', 'instagramLocations.delete'],
    },
};

// organizations
const basicOrganizationsPermissions = {
    organizationsGet: {
        name: 'Organizations Viewer',
        description: 'Organization Viewer',
        permissions: ['organizations.get'],
    },
    organizationsEdit: {
        name: 'Organizations Editor',
        description: 'Organization Editor',
        permissions: ['organizations.edit'],
    },
    organizationsAdmin: {
        name: 'Organizations Admin',
        description: 'Organization Admin',
        permissions: ['organizations.edit', 'organizations.get'],
    },
};

// roles
const basicRolesPermissions = {
    rolesGet: {
        name: 'Roles Viewer',
        description: 'Role Viewer',
        permissions: ['roles.get'],
    },
    rolesEdit: {
        name: 'Roles Editor',
        description: 'Role Editor',
        permissions: ['roles.edit'],
    },
    rolesAdmin: {
        name: 'Roles Admin',
        description: 'Role Admin',
        permissions: ['roles.edit', 'roles.get'],
    },
};

// users
const basicUsersPermissions = {
    usersGet: {
        name: 'Users Viewer',
        description: 'User Viewer',
        permissions: ['users.get'],
    },
    usersEdit: {
        name: 'Users Editor',
        description: 'User Editor',
        permissions: ['users.edit'],
    },
    usersAdmin: {
        name: 'Users Admin',
        description: 'User Admin',
        permissions: ['users.edit', 'users.get'],
    },
};

const fullAdmin = {
    name: 'Full Admin',
    description: 'Full Admin',
    permissions: [
        ...basicScenariosPermissions.scenariosAdmin.permissions,
        ...basicAccountsPermissions.accountsAdmin.permissions,
        ...basicSourcesPermissions.sourcesAdmin.permissions,
        ...basicPreparedVideosPermissions.preparedVideosAdmin.permissions,
        ...basicInstagramMediaContainersPermissions.instagramMediaContainersAdmin.permissions,
        ...basicInstagramLocationsPermissions.instagramLocationsAdmin.permissions,
        ...basicOrganizationsPermissions.organizationsAdmin.permissions,
        ...basicRolesPermissions.rolesAdmin.permissions,
        ...basicUsersPermissions.usersAdmin.permissions,
    ],
};

const fullViewer = {
    name: 'Full Viewer',
    description: 'Full Viewer',
    permissions: [
        ...basicScenariosPermissions.scenaiosGet.permissions,
        ...basicAccountsPermissions.accountsGet.permissions,
        ...basicSourcesPermissions.sourcesGet.permissions,
        ...basicPreparedVideosPermissions.preparedVideosGet.permissions,
        ...basicInstagramMediaContainersPermissions.instagramMediaContainersGet.permissions,
        ...basicInstagramLocationsPermissions.instagramLocationsGet.permissions,
        ...basicOrganizationsPermissions.organizationsGet.permissions,
        ...basicRolesPermissions.rolesGet.permissions,
        ...basicUsersPermissions.usersGet.permissions,
    ],
};

const allRoles = [
    ...Object.values(basicScenariosPermissions),
    ...Object.values(basicAccountsPermissions),
    ...Object.values(basicSourcesPermissions),
    ...Object.values(basicPreparedVideosPermissions),
    ...Object.values(basicInstagramMediaContainersPermissions),
    ...Object.values(basicInstagramLocationsPermissions),
    ...Object.values(basicOrganizationsPermissions),
    ...Object.values(basicRolesPermissions),
    ...Object.values(basicUsersPermissions),
    fullAdmin,
    fullViewer,
];

const allRoleNames = allRoles.map((role) => role.name);

exports.up = async function (knex) {
    for (const role of allRoles) {
        try {
            const roleToInsert = {
                ...role,
                permissions: JSON.stringify(role.permissions),
            };
            await knex('roles').insert(roleToInsert);
            console.log(`Inserted role: ${role.name}`);
        } catch (error) {
            console.error(`Failed to insert role ${role.name}:`, error);
            console.error('Role data:', JSON.stringify(role, null, 2));
            throw error;
        }
    }

    return Promise.resolve();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex('roles').whereIn('name', allRoleNames).del();
};

import {Model} from 'objection';

import {BaseModel} from './BaseModel';
import {Organization} from './Organization';
import Role from './Role';
import UserOrganizationRole from './UserOrganizationRole';

import {IOrganization, IRole, IUser} from '#types';

export class User extends BaseModel implements IUser {
    id!: number;
    email!: string;
    name!: string;
    uid!: string;

    roles!: IRole[];
    organizations!: IOrganization[];

    // Table name is the only required property
    static get tableName() {
        return 'users';
    }

    static get relationMappings() {
        return {
            // Direct relationship to the join table entries
            userOrganizationRoles: {
                relation: Model.HasManyRelation,
                modelClass: UserOrganizationRole,
                join: {
                    from: 'users.id',
                    to: 'userOrganizationRoles.userId',
                },
            },
            // Many-to-many for organizations
            organizations: {
                relation: Model.ManyToManyRelation,
                modelClass: Organization,
                join: {
                    from: 'users.id',
                    through: {
                        from: 'userOrganizationRoles.userId',
                        to: 'userOrganizationRoles.organizationId',
                    },
                    to: 'organizations.id',
                },
            },
            // Many-to-many for roles
            roles: {
                relation: Model.ManyToManyRelation,
                modelClass: Role,
                join: {
                    from: 'users.id',
                    through: {
                        from: 'userOrganizationRoles.userId',
                        to: 'userOrganizationRoles.roleId',
                    },
                    to: 'roles.id',
                },
            },
        };
    }
}

export default User;

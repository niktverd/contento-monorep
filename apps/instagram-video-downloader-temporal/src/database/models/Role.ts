import {Model} from 'objection';

import {BaseModel} from './BaseModel';
import UserOrganizationRole from './UserOrganizationRole';

import {IRole} from '#types';

export class Role extends BaseModel implements IRole {
    id!: number;
    name!: string;
    description!: string;
    permissions!: string[];

    // Table name is the only required property
    static get tableName() {
        return 'roles';
    }

    static get jsonAttributes() {
        return ['permissions']; // This tells Objection to handle JSONB conversion automatically
    }

    static get relationMappings() {
        return {
            // Direct relationship to the join table entries
            userOrganizationRoles: {
                relation: Model.HasManyRelation,
                modelClass: UserOrganizationRole,
                join: {
                    from: 'roles.id',
                    to: 'userOrganizationRoles.roleId',
                },
            },
        };
    }
}

export default Role;

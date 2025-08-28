import {BaseModel} from './BaseModel';

import {IUserOrganizationRole} from '#types';

export class UserOrganizationRole extends BaseModel implements IUserOrganizationRole {
    id!: number;
    userId!: number;
    organizationId!: number;
    roleId!: number;

    // Table name is the only required property
    static get tableName() {
        return 'userOrganizationRoles';
    }
}

export default UserOrganizationRole;

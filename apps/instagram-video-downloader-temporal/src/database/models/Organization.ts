import {Model} from 'objection';

import {OrganizationSender} from './OrganizationSenders';
import User from './User';

import {IOrganization, IUser} from '#types';

export class Organization extends Model implements IOrganization {
    id!: number;
    name!: string;
    createdAt!: string;
    updatedAt!: string;

    users!: IUser[];

    static get tableName() {
        return 'organizations';
    }

    static get idColumn() {
        return 'id';
    }

    static get relationMappings() {
        return {
            users: {
                relation: Model.ManyToManyRelation,
                modelClass: User,
                join: {
                    from: 'organizations.id',
                    through: {
                        from: 'userOrganizationRoles.organizationId',
                        to: 'userOrganizationRoles.userId',
                    },
                    to: 'users.id',
                },
            },
            organizationSenders: {
                relation: Model.HasManyRelation,
                modelClass: OrganizationSender,
                join: {
                    from: 'organizations.id',
                    to: 'organizationSenders.organizationId',
                },
            },
        };
    }
}

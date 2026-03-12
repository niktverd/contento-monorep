import {Model} from 'objection';

import {Organization} from './Organization';

import {IOrganization, IOrganizationSender} from '#types';

export class OrganizationSender extends Model implements IOrganizationSender {
    id!: number;
    senderId!: string;
    organizationId!: number;
    createdAt!: string;
    updatedAt!: string;

    organizations!: IOrganization[];

    static get tableName() {
        return 'organizationSenders';
    }

    static get relationMappings() {
        return {
            organization: {
                relation: Model.BelongsToOneRelation,
                modelClass: Organization,
                join: {
                    from: 'organizationSenders.organizationId',
                    to: 'organizations.id',
                },
            },
        };
    }
}

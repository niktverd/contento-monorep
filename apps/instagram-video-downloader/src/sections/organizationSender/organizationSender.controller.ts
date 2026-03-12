import {wrapper} from '../../db/utils';

import {
    deleteOrganizationSender,
    getOrganizationSendersByOrganizationId,
} from '#src/db/organizationSenders';
import {
    DeleteOrganizationSenderParams,
    DeleteOrganizationSenderParamsSchema,
    DeleteOrganizationSenderResponse,
    GetOrganizationSendersByOrganizationIdParams,
    GetOrganizationSendersByOrganizationIdParamsSchema,
    GetOrganizationSendersByOrganizationIdResponse,
} from '#types';

export const getOrganizationSendersByOrganizationIdGet = wrapper<
    GetOrganizationSendersByOrganizationIdParams,
    GetOrganizationSendersByOrganizationIdResponse
>(
    getOrganizationSendersByOrganizationId,
    GetOrganizationSendersByOrganizationIdParamsSchema,
    'GET',
);

export const deleteOrganizationSenderDelete = wrapper<
    DeleteOrganizationSenderParams,
    DeleteOrganizationSenderResponse
>(deleteOrganizationSender, DeleteOrganizationSenderParamsSchema, 'DELETE');

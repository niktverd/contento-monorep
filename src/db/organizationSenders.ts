import {OrganizationSender} from '#models/OrganizationSenders';
import {
    CreateOrganizationSenderParams,
    CreateOrganizationSenderResponse,
    DeleteOrganizationSenderParams,
    DeleteOrganizationSenderResponse,
    GetOrganizationIdBySenderIdParams,
    GetOrganizationIdBySenderIdResponse,
    GetOrganizationSendersByOrganizationIdParams,
    GetOrganizationSendersByOrganizationIdResponse,
} from '#src/types';
import {ApiFunctionPrototype} from '#src/types/common';
import {ThrownError} from '#src/utils/error';

export const getOrganizationIdsBySenderId: ApiFunctionPrototype<
    GetOrganizationIdBySenderIdParams,
    GetOrganizationIdBySenderIdResponse
> = async (params, db) => {
    const {senderId} = params;

    const organization = await OrganizationSender.query(db).where('senderId', senderId);

    return {
        result: organization,
        code: 200,
    };
};

export const getOrganizationSendersByOrganizationId: ApiFunctionPrototype<
    GetOrganizationSendersByOrganizationIdParams,
    GetOrganizationSendersByOrganizationIdResponse
> = async (params, db) => {
    const {organizationId} = params;

    if (!organizationId) {
        throw new ThrownError(
            'getOrganizationSendersByOrganizationId | Organization ID is required',
            400,
        );
    }

    const organizationsSenders = await OrganizationSender.query(db).where(
        'organizationId',
        organizationId,
    );

    return {
        result: organizationsSenders,
        code: 200,
    };
};

export const createOrganizationSender: ApiFunctionPrototype<
    CreateOrganizationSenderParams,
    CreateOrganizationSenderResponse
> = async (params, db) => {
    const {senderId, organizationId} = params;

    const organizationSender = await OrganizationSender.query(db).insert({
        senderId,
        organizationId,
    });

    return {
        result: organizationSender,
        code: 200,
    };
};

export const deleteOrganizationSender: ApiFunctionPrototype<
    DeleteOrganizationSenderParams,
    DeleteOrganizationSenderResponse
> = async (params, db) => {
    const {id} = params;

    const organizationSender = await OrganizationSender.query(db).where('id', id).delete();

    return {
        result: organizationSender,
        code: 200,
    };
};

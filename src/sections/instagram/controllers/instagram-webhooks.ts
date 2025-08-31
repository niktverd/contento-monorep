import dotenv from 'dotenv';
import {Request, Response} from 'express';
import Objection from 'objection';

import {createSource, wrapper} from '#src/db';
import {createOrganizationSender, getOrganizationIdsBySenderId} from '#src/db/organizationSenders';
import {startVideoDownloadingWorkflow} from '#src/sections/temporal/client';
import {ApiFunctionPrototype} from '#src/types/common';
import {MessageWebhookV3Params, MessageWebhookV3Response} from '#src/types/instagramApi';
import {MessageWebhookV3Schema} from '#src/types/schemas/handlers';
import {ThrownError} from '#src/utils/error';
import {initiateRecordV3, log, logError} from '#utils';

dotenv.config();

// const availableSenders = (process.env.ALLOWED_SENDER_ID || '').split(',').filter(Boolean);

const getAttachment = async (body: Request['body'], db: Objection.TransactionOrKnex) => {
    const {object, entry: entries} = body;
    log(body);

    if (object !== 'instagram') {
        throw new ThrownError('Object is not instagram', 400);
    }

    if (!entries?.length) {
        throw new ThrownError('entries is empty', 400);
    }

    const entry = entries[0];

    if (!entry) {
        throw new ThrownError('entry is undefined', 400);
    }

    if (!entry.messaging) {
        throw new ThrownError('entry.messaging is undefined', 400);
    }

    const [messaging] = entry.messaging;
    const senderId = messaging.sender?.id;
    const recipientId = messaging.recipient?.id;

    const {result: organizationsToSave} = await getOrganizationIdsBySenderId({senderId}, db);

    if (!organizationsToSave.length) {
        throw new ThrownError(`senderId (${senderId}) is not allowed`, 400);
    }

    const attachments = messaging.message?.attachments;
    if (!attachments.length) {
        throw new ThrownError('attachments is empty', 400);
    }

    const [attachment] = attachments;
    if (!attachment) {
        throw new ThrownError('attachment is undefined', 400);
    }

    return {senderId, recipientId, attachment, organizationsToSave};
};

const checkInstagramMessageIsSystem = async (
    payload: Request['body'],
    db: Objection.TransactionOrKnex,
) => {
    // ["reqId_","messageWebhookV3","params",{"object":"instagram","entry":[{"time":1756640156419,"id":"17841472056838218","messaging":[{"sender":{"id":"614477204908095"},"recipient":{"id":"17841472056838218"},"timestamp":1756640155162,"message":{"mid":"aWdfZAG1faXRlbToxOklHTWVzc2FnZAUlEOjE3ODQxNDcyMDU2ODM4MjE4OjM0MDI4MjM2Njg0MTcxMDMwMTI0NDI1OTY0MjcwMzEwODM3MTczNDozMjQwNDI5MTM3MTg3Njc2OTE3NzAzNTM1MzYzNTE2MDA2NAZDZD","text":"Some message"}}]}]},"messageWebhookV3","anonymous","Layer","next","Route","Layer","anonymous","Function"]
    try {
        const {object, entry: entries} = payload;
        log(payload);

        if (object !== 'instagram') {
            throw new ThrownError('Object is not instagram', 400);
        }

        if (!entries?.length) {
            throw new ThrownError('entries is empty', 400);
        }

        const entry = entries[0];

        if (!entry) {
            throw new ThrownError('entry is undefined', 400);
        }

        const text = entry.messaging?.[0]?.message?.text;

        const data = JSON.parse(Buffer.from(text, 'base64').toString('utf-8')) as {
            organizationId: number;
            secret: string;
            date: string;
        };
        log({data});

        if (data.secret !== 'instagram-secret') {
            throw new ThrownError('secret is not instagram-secret', 400);
        }

        if (new Date(data.date).getTime() < new Date().getTime() - 3 * 24 * 60 * 60 * 1000) {
            throw new ThrownError('date is more than 3 days ago', 400);
        }

        if (!data.organizationId) {
            throw new ThrownError('organizationId is not provided', 400);
        }

        const senderId = entry.messaging?.[0]?.sender?.id;
        if (!senderId) {
            throw new ThrownError('senderId is not provided', 400);
        }

        await createOrganizationSender({senderId, organizationId: data.organizationId}, db);

        return true;
    } catch (error) {
        logError(error);
        return false;
    }
};

export const hubChallangeWebhook = (req: Request, res: Response) => {
    log(req.query);
    const hubChallenge = req.query['hub.challenge'];
    log(hubChallenge);

    res.status(200).send(hubChallenge);
};

const messageWebhookV3: ApiFunctionPrototype<
    MessageWebhookV3Params,
    MessageWebhookV3Response
> = async (params, db) => {
    try {
        log('messageWebhookV3', 'params', params);

        const isSystemMessage = await checkInstagramMessageIsSystem(params, db);
        if (isSystemMessage) {
            return {
                result: {
                    success: true,
                    message: 'success',
                },
                code: 200,
            };
        }

        const {senderId, recipientId, attachment, organizationsToSave} = await getAttachment(
            params,
            db,
        );
        const {type, payload} = attachment;
        log({type, senderId, recipientId, attachment, organizationsToSave});

        const {url, title = ''} = payload;
        const originalHashtags: string[] = title?.match(/#\w+/g) || [];

        for (const organization of organizationsToSave) {
            const data = initiateRecordV3(
                {
                    instagramReel: {
                        url,
                        senderId,
                        title,
                        originalHashtags,
                        owner: '',
                    },
                },
                params.body,
                senderId,
                recipientId,
                organization.id,
            );

            const sourceRecord = await createSource(data, db, {organizationId: organization.id});
            log('firestoreDoc', sourceRecord);
            await startVideoDownloadingWorkflow(
                {
                    sourceId: sourceRecord.result.id,
                },
                {organizationId: organization.id},
            );
        }
    } catch (error) {
        logError(error);
    }

    return {
        result: {
            success: true,
            message: 'success',
        },
        code: 200,
    };
};

export const messageWebhookV3Post = wrapper<MessageWebhookV3Params, MessageWebhookV3Response>(
    messageWebhookV3,
    MessageWebhookV3Schema,
    'POST',
);

import type {NextApiRequest, NextApiResponse} from 'next';

import {sendDirectMessage} from '../../../../src/utils/instagramApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ok: false, message: `Method ${req.method} Not Allowed`});
        return;
    }
    const {threadId, message} = req.body;
    if (!threadId || !message) {
        res.status(400).json({ok: false, message: 'threadId and message required'});
        return;
    }
    try {
        const result = await sendDirectMessage(threadId, message);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ok: false, message: 'Failed to send message'});
    }
}

import type {NextApiRequest, NextApiResponse} from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ok: false, message: `Method ${req.method} Not Allowed`});
        return;
    }
    const {threadId, limit} = req.query;
    if (!threadId) {
        res.status(400).json({ok: false, message: 'threadId required'});
        return;
    }
    // TODO: Реальный запрос к Instagram API
    res.status(200).json({ok: true, data: {threadId, messages: [], limit, mock: true}});
}

import type {NextApiRequest, NextApiResponse} from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ok: false, message: `Method ${req.method} Not Allowed`});
        return;
    }
    const {commentId} = req.body;
    if (!commentId) {
        res.status(400).json({ok: false, message: 'commentId required'});
        return;
    }
    // TODO: Реальный запрос к Instagram API
    res.status(200).json({ok: true, data: {commentId, hidden: true, mock: true}});
}

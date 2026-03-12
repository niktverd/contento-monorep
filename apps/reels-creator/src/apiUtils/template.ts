import type {NextApiRequest, NextApiResponse} from 'next';

import type {Handlers} from './types';

export const createHandler =
    ({get, put, delete: del, post}: Handlers) =>
    (req: NextApiRequest, res: NextApiResponse) => {
        if (req.method === 'GET' && get) {
            get(req, res);
            return;
        }
        if (req.method === 'PUT' && put) {
            put(req, res);
            return;
        }
        if (req.method === 'DELETE' && del) {
            del(req, res);
            return;
        }
        if (req.method === 'POST' && post) {
            post(req, res);
            return;
        }

        res.status(404).send('Method not allowed');
    };

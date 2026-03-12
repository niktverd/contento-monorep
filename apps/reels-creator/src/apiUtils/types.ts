import type {NextApiRequest, NextApiResponse} from 'next';

export type Handler<T = unknown, R = unknown> = (
    req: NextApiRequest,
    res: NextApiResponse<R>,
) => Promise<T>;

export type Handlers = {
    get?: Handler;
    put?: Handler;
    delete?: Handler;
    post?: Handler;
};

// import axios from 'axios';

const log = (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[InstagramAPI]', ...args);
    }
};

const logError = (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error('[InstagramAPI]', ...args);
};

export async function fetchMediaInsights(mediaId: string, metrics: string[], period?: string) {
    try {
        log('fetchMediaInsights', {mediaId, metrics, period});
        // TODO: Реальный запрос к Instagram API
        return {ok: true, data: {mediaId, metrics, period, mock: true}};
    } catch (error) {
        logError('fetchMediaInsights', error);
        throw error;
    }
}

export async function fetchAccountInsights(accountId: string, metrics: string[], period?: string) {
    try {
        log('fetchAccountInsights', {accountId, metrics, period});
        // TODO: Реальный запрос к Instagram API
        return {ok: true, data: {accountId, metrics, period, mock: true}};
    } catch (error) {
        logError('fetchAccountInsights', error);
        throw error;
    }
}

export async function sendDirectMessage(threadId: string, message: string) {
    try {
        log('sendDirectMessage', {threadId, message});
        // TODO: Реальный запрос к Instagram API
        return {ok: true, data: {threadId, message, mock: true}};
    } catch (error) {
        logError('sendDirectMessage', error);
        throw error;
    }
}

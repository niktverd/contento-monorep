/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import axios from 'axios';

import type {MediaInsights} from '../types';

const {useState, useCallback} = React;

export function useMediaInsights(mediaId: string | undefined) {
    const [insights, setInsights] = useState<MediaInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(
        async (metrics: string[] = [], period?: string) => {
            if (!mediaId) return;
            setLoading(true);
            setError(null);
            try {
                const {data} = await axios.get('/api/instagram/insights/media', {
                    params: {mediaId, metrics, period},
                });
                setInsights(data.data as MediaInsights);
            } catch (e: any) {
                setError(e?.message || 'Failed to fetch insights');
            } finally {
                setLoading(false);
            }
        },
        [mediaId],
    );

    return {insights, loading, error, fetchInsights};
}

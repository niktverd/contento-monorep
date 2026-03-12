/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import axios from 'axios';

const {useState, useCallback} = React;

export function useInsightsComparison() {
    const [comparison, setComparison] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchComparison = useCallback(async (mediaIds: string[], metrics: string[] = []) => {
        setLoading(true);
        setError(null);
        try {
            const {data} = await axios.get('/api/instagram/insights/compare', {
                params: {mediaIds, metrics},
            });
            setComparison(data.data);
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch comparison');
        } finally {
            setLoading(false);
        }
    }, []);

    return {comparison, loading, error, fetchComparison};
}

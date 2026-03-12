/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import axios from 'axios';

import type {AccountInsights} from '../types';

const {useCallback, useState} = React;

export function useAccountInsights(accountId: string | undefined) {
    const [insights, setInsights] = useState<AccountInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(
        async (metrics: string[] = [], period?: string) => {
            if (!accountId) return;
            setLoading(true);
            setError(null);
            try {
                const {data} = await axios.get('/api/instagram/insights/account', {
                    params: {accountId, metrics, period},
                });
                setInsights(data.data as AccountInsights);
            } catch (e: any) {
                setError(e?.message || 'Failed to fetch insights');
            } finally {
                setLoading(false);
            }
        },
        [accountId],
    );

    return {insights, loading, error, fetchInsights};
}

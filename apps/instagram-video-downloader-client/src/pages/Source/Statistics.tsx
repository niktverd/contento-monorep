import React, {useCallback, useContext, useEffect, useState} from 'react';

import {Button, Spin, useToaster} from '@gravity-ui/uikit';
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';

import {AppEnvContext} from '../../contexts/AppEnv';
import {SourceStatisticsResponse} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

function getLastNDays(n: number) {
    const days: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
}

export const Statistics = () => {
    const {isProd} = useContext(AppEnvContext);
    const [days, setDays] = useState(() => getLastNDays(7));
    const [data, setData] = useState<{day: string; count: number}[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const {add} = useToaster();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchGet<SourceStatisticsResponse>({
                route: fetchRoutes.sources.statistics,
                query: {days},
                isProd,
            });
            setData(days.map((day) => ({day, count: response[day] ?? 0})));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || 'Failed to fetch statistics');
            add({
                name: 'stats-error',
                title: err.message || 'Failed to fetch statistics',
                theme: 'danger',
            });
        } finally {
            setLoading(false);
        }
    }, [days, isProd, add]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRange = (n: number) => {
        setDays(getLastNDays(n));
    };

    return (
        <div style={{padding: 20, maxWidth: 900, margin: '0 auto'}}>
            <h2>Sources Statistics</h2>
            <div style={{marginBottom: 16, display: 'flex', gap: 8}}>
                <Button
                    view={days.length === 7 ? 'action' : 'normal'}
                    onClick={() => handleRange(7)}
                >
                    Last 7 days
                </Button>
                <Button
                    view={days.length === 14 ? 'action' : 'normal'}
                    onClick={() => handleRange(14)}
                >
                    Last 14 days
                </Button>
                <Button
                    view={days.length === 30 ? 'action' : 'normal'}
                    onClick={() => handleRange(30)}
                >
                    Last 30 days
                </Button>
                <Button view="outlined" onClick={fetchStats}>
                    Refresh
                </Button>
                <Button view="outlined" href="/sources">
                    Back
                </Button>
            </div>
            {/* eslint-disable-next-line no-nested-ternary */}
            {loading ? (
                <div style={{display: 'flex', justifyContent: 'center', padding: 40}}>
                    <Spin size="l" />
                </div>
            ) : error ? (
                <div style={{color: '#c62828', marginBottom: 20}}>{error}</div>
            ) : (
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data} margin={{top: 20, right: 30, left: 0, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

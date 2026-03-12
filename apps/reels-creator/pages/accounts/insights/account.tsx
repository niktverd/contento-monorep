import React from 'react';

import {
    Box,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
} from '@material-ui/core';
import axios from 'axios';

import {AccountLayout} from '../../../src/components/AccountLayout/AccountLayout';
import {InsightsChart} from '../../../src/components/Instagram/InsightsChart';

const {useEffect, useState} = React;
// Types
interface Value {
    value: number;
    end_time: string;
}

interface Insight {
    name: string;
    period: string;
    values: Value[];
    title: string;
    description: string;
    id: string;
}

const PERIODS = [
    {label: 'Day', value: 'day'},
    {label: 'Week', value: 'week'},
];

export default function InsightsPage() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [period, setPeriod] = useState<string>('day');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInsights = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/api/instagram/insights/account', {
                    params: {period},
                });
                setInsights(res.data.data || []);
            } catch (err) {
                setInsights([]);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [period]);

    return (
        <AccountLayout>
            <h2>Instagram Insights</h2>
            <FormControl variant="outlined" size="small" style={{minWidth: 160, marginBottom: 24}}>
                <InputLabel id="period-label">Period</InputLabel>
                <Select
                    labelId="period-label"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as string)}
                    label="Period"
                >
                    {PERIODS.map((p) => (
                        <MenuItem key={p.value} value={p.value}>
                            {p.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Box display="flex" flexWrap="wrap" mt={3} style={{gap: 24}}>
                {/* eslint-disable-next-line no-nested-ternary */}
                {loading ? (
                    <Typography>Loading...</Typography>
                ) : insights.length === 0 ? (
                    <Typography>No insights found.</Typography>
                ) : (
                    insights.map((insight) => (
                        <Card key={insight.id} style={{width: 400, marginBottom: 24}}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {insight.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    {insight.description}
                                </Typography>
                                <InsightsChart title={insight.title} data={insight.values} />
                                <Typography variant="caption" color="textSecondary">
                                    Period: {insight.period}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>
        </AccountLayout>
    );
}

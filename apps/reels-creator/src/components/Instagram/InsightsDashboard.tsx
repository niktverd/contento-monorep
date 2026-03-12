import React from 'react';

import {Box, Button, Tab, Tabs, Typography} from '@material-ui/core';
import axios from 'axios';

const {useEffect} = React;

const TABS = [
    {label: 'Posts', value: 'posts'},
    {label: 'Stories', value: 'stories'},
    {label: 'Reels', value: 'reels'},
];

export function InsightsDashboard() {
    const [tab, setTab] = React.useState('posts');
    const [dateRange] = React.useState<{start: string; end: string} | null>(null);

    useEffect(() => {
        const fetchInsights = async () => {
            const insights = await axios.get('/api/instagram/insights/account');
            // eslint-disable-next-line no-console
            console.log('insights', insights);
        };
        fetchInsights();
    }, [tab]);

    // TODO: интеграция с хуками и компонентами аналитики

    return (
        <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    {TABS.map((t) => (
                        <Tab key={t.value} label={t.label} value={t.value} />
                    ))}
                </Tabs>
                <Button variant="contained" color="primary">
                    Export
                </Button>
            </Box>
            <Box mb={2}>
                {/* TODO: Date range picker */}
                <Typography variant="body2">
                    Date range: {dateRange ? `${dateRange.start} — ${dateRange.end}` : 'All time'}
                </Typography>
            </Box>
            <Box>
                {/* TODO: Metric cards, charts, tables */}
                <Typography variant="h6">Analytics content for: {tab}</Typography>
            </Box>
        </Box>
    );
}

import React from 'react';

import {Box, Typography} from '@material-ui/core';
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';

interface Value {
    value: number;
    end_time: string;
}

export function InsightsChart({title, data}: {title: string; data: Value[]}) {
    return (
        <Box mb={2}>
            <Typography variant="subtitle1">{title}</Typography>
            <Box height={240}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{top: 16, right: 16, left: 0, bottom: 0}}>
                        <XAxis dataKey="end_time" tickFormatter={(d) => d.slice(0, 10)} />
                        <YAxis />
                        <Tooltip
                            formatter={(v: number) => v.toLocaleString()}
                            labelFormatter={(d) => d.slice(0, 10)}
                        />
                        <Bar dataKey="value" fill="#1976d2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
}

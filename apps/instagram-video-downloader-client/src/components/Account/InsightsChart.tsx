import React from 'react';

import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';

export type InsightsChartValue = {
    end_time: string;
    value: number;
};

export function InsightsChart({title, data}: {title: string; data: InsightsChartValue[]}) {
    return (
        <div>
            <h4>{title}</h4>
            <div style={{height: '240px'}}>
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
            </div>
        </div>
    );
}

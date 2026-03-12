import React from 'react';

import {Alert, Card, Loader, Text} from '@gravity-ui/uikit';
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';

import {InsightsChartProps} from '../../types';

import styles from './InsightsChart.module.css';

export const InsightsChart: React.FC<InsightsChartProps> = ({data, loading, error}) => {
    // Handle loading state
    if (loading) {
        return (
            <Card className="insights-chart">
                <div className={styles.loadingContainer}>
                    <Loader size="l" />
                    <Text variant="body-2" color="secondary">
                        Loading...
                    </Text>
                </div>
            </Card>
        );
    }

    // Handle error state
    if (error) {
        return (
            <Card className="insights-chart">
                <Alert theme="danger" title="Error loading chart data" message={error} />
            </Card>
        );
    }

    // Handle empty data state
    if (!data || data.length === 0) {
        return (
            <Card className="insights-chart">
                <div className={styles.emptyStateContainer}>
                    <Text variant="subheader-2" color="complementary">
                        No data available
                    </Text>
                    <Text variant="body-2" color="secondary">
                        Try selecting different filters or check if data exists for this period
                    </Text>
                </div>
            </Card>
        );
    }

    return (
        <Card className="insights-chart">
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 60,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            tick={{fontSize: 12}}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                        />
                        <YAxis
                            tick={{fontSize: 12}}
                            tickFormatter={(value) => value.toLocaleString()}
                        />
                        <Tooltip
                            formatter={(value: number) => [value.toLocaleString(), 'Value']}
                            labelFormatter={(label) => `Account: ${label}`}
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                        />
                        <Bar
                            dataKey="value"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            stroke="#2563eb"
                            strokeWidth={1}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

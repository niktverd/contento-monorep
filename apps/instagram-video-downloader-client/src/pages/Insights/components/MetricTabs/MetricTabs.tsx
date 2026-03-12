import React from 'react';

import {Spin, Tab, TabList, TabProvider} from '@gravity-ui/uikit';

import {MetricTabsProps, MetricType} from '../../types';

import styles from './MetricTabs.module.css';

// Mapping of metric keys to display labels
const METRIC_LABELS: Record<MetricType, string> = {
    reach: 'Reach',
    follower_count: 'Followers',
    online_followers: 'Online Followers',
} as const;

export const MetricTabs: React.FC<MetricTabsProps> = ({
    availableMetrics,
    selectedMetric,
    onMetricChange,
    loading = false,
}) => {
    // Show loading state
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spin size="s" />
                <span>Loading metrics...</span>
            </div>
        );
    }

    // Show message if no metrics are available
    if (!availableMetrics.length) {
        return <div>No metrics available for the selected day</div>;
    }

    return (
        <TabProvider value={selectedMetric} onUpdate={onMetricChange}>
            <TabList>
                {availableMetrics.map((metric) => (
                    <Tab key={metric} value={metric}>
                        {METRIC_LABELS[metric]}
                    </Tab>
                ))}
            </TabList>
        </TabProvider>
    );
};

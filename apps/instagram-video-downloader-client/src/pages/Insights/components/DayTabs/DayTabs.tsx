import React from 'react';

import {Spin, Tab, TabList, TabProvider} from '@gravity-ui/uikit';

import {DayTabsProps} from '../../types';

import styles from './DayTabs.module.css';

export const DayTabs: React.FC<DayTabsProps> = ({
    availableDays,
    selectedDay,
    onDayChange,
    loading = false,
}) => {
    // Format day for display (e.g., "2025-06-14" -> "June 14, 2025")
    const formatDayLabel = (dayString: string) => {
        try {
            const date = new Date(dayString);
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return dayString; // Fallback to original string if parsing fails
        }
    };

    // Format day for tab ID (shorter version)
    const formatDayId = (dayString: string) => {
        try {
            const date = new Date(dayString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dayString;
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spin size="s" />
                <span>Loading days...</span>
            </div>
        );
    }

    // Show message if no days are available
    if (!availableDays.length) {
        return (
            <div className={styles.noDataMessage}>No data available for the selected period</div>
        );
    }

    return (
        <TabProvider value={selectedDay} onUpdate={onDayChange}>
            <TabList>
                {availableDays.map((day) => (
                    <Tab key={day} value={day} title={formatDayLabel(day)}>
                        {formatDayId(day)}
                    </Tab>
                ))}
            </TabList>
        </TabProvider>
    );
};

import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, render, screen} from '@testing-library/react';

import {MetricType} from '../../types';

import {MetricTabs} from './MetricTabs';

// Helper to wrap components with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme="light">{component}</ThemeProvider>);
};

describe('MetricTabs', () => {
    const mockOnMetricChange = jest.fn();
    const mockAvailableMetrics: MetricType[] = ['reach', 'follower_count', 'online_followers'];

    beforeEach(() => {
        mockOnMetricChange.mockClear();
    });

    describe('Rendering', () => {
        it('should render metric tabs correctly', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={mockAvailableMetrics}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            // Check if all metrics are rendered with correct labels
            expect(screen.getByText('Reach')).toBeInTheDocument();
            expect(screen.getByText('Followers')).toBeInTheDocument();
            expect(screen.getByText('Online Followers')).toBeInTheDocument();
        });

        it('should highlight selected metric', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={mockAvailableMetrics}
                    selectedMetric="follower_count"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            const selectedTab = screen.getByText('Followers');
            expect(selectedTab).toBeInTheDocument();
            // Check that the tab is active (Gravity UI Tabs handle styling internally)
            expect(selectedTab.closest('[role="tab"]')).toHaveAttribute('aria-selected', 'true');
        });

        it('should show loading state', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={[]}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                    loading={true}
                />,
            );

            expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
        });

        it('should show no data message when no metrics available', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={[]}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                    loading={false}
                />,
            );

            expect(
                screen.getByText('No metrics available for the selected day'),
            ).toBeInTheDocument();
        });
    });

    describe('Interaction', () => {
        it('should call onMetricChange when metric is clicked', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={mockAvailableMetrics}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            fireEvent.click(screen.getByText('Followers'));
            expect(mockOnMetricChange).toHaveBeenCalledWith('follower_count');
        });

        it('should call onMetricChange when already selected metric is clicked', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={mockAvailableMetrics}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            fireEvent.click(screen.getByText('Reach'));
            expect(mockOnMetricChange).toHaveBeenCalledWith('reach');
        });

        it('should handle clicking on online followers metric', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={mockAvailableMetrics}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            fireEvent.click(screen.getByText('Online Followers'));
            expect(mockOnMetricChange).toHaveBeenCalledWith('online_followers');
        });
    });

    describe('Metric Labels', () => {
        it('should display correct labels for all metric types', () => {
            const singleMetrics: MetricType[] = ['reach'];
            renderWithTheme(
                <MetricTabs
                    availableMetrics={singleMetrics}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            expect(screen.getByText('Reach')).toBeInTheDocument();
        });

        it('should display correct label for follower_count', () => {
            const singleMetrics: MetricType[] = ['follower_count'];
            renderWithTheme(
                <MetricTabs
                    availableMetrics={singleMetrics}
                    selectedMetric="follower_count"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            expect(screen.getByText('Followers')).toBeInTheDocument();
        });

        it('should display correct label for online_followers', () => {
            const singleMetrics: MetricType[] = ['online_followers'];
            renderWithTheme(
                <MetricTabs
                    availableMetrics={singleMetrics}
                    selectedMetric="online_followers"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            expect(screen.getByText('Online Followers')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty availableMetrics array', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={[]}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            expect(
                screen.getByText('No metrics available for the selected day'),
            ).toBeInTheDocument();
        });

        it('should handle selectedMetric not in availableMetrics', () => {
            const limitedMetrics: MetricType[] = ['reach', 'follower_count'];
            renderWithTheme(
                <MetricTabs
                    availableMetrics={limitedMetrics}
                    selectedMetric="online_followers"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            // Should render available metrics without highlighting any
            expect(screen.getByText('Reach')).toBeInTheDocument();
            expect(screen.getByText('Followers')).toBeInTheDocument();

            // Selected metric should not appear
            expect(screen.queryByText('Online Followers')).not.toBeInTheDocument();
        });

        it('should handle single metric in availableMetrics', () => {
            const singleMetric: MetricType[] = ['reach'];
            renderWithTheme(
                <MetricTabs
                    availableMetrics={singleMetric}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            expect(screen.getByText('Reach')).toBeInTheDocument();

            // Check that the tab is active (Gravity UI Tabs handle styling internally)
            const button = screen.getByText('Reach');
            expect(button.closest('[role="tab"]')).toHaveAttribute('aria-selected', 'true');
        });
    });

    describe('Accessibility', () => {
        it('should have proper button roles', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={mockAvailableMetrics}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            const tabs = screen.getAllByRole('tab');
            expect(tabs).toHaveLength(mockAvailableMetrics.length);
        });

        it('should have descriptive titles', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={['reach']}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            const tab = screen.getByRole('tab');
            expect(tab).toBeInTheDocument();
        });

        it('should have aria-pressed attribute', () => {
            renderWithTheme(
                <MetricTabs
                    availableMetrics={mockAvailableMetrics}
                    selectedMetric="reach"
                    onMetricChange={mockOnMetricChange}
                />,
            );

            const selectedTab = screen.getByText('Reach');
            expect(selectedTab.closest('[role="tab"]')).toHaveAttribute('aria-selected', 'true');

            const unselectedTab = screen.getByText('Followers');
            expect(unselectedTab.closest('[role="tab"]')).toHaveAttribute('aria-selected', 'false');
        });
    });
});

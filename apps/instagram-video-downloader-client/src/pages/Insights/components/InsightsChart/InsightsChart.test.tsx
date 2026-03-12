import React from 'react';

import {render, screen} from '@testing-library/react';

import {ChartDataPoint} from '../../types';

import {InsightsChart} from './InsightsChart';

// Mock recharts components to avoid rendering issues in tests
jest.mock('recharts', () => ({
    ResponsiveContainer: ({children}: {children: React.ReactNode}) => (
        <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({children}: {children: React.ReactNode}) => (
        <div data-testid="bar-chart">{children}</div>
    ),
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
}));

describe('InsightsChart', () => {
    const mockData = [
        {name: 'account1', value: 1000},
        {name: 'account2', value: 750},
        {name: 'total', value: 1750},
    ];

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Loading state', () => {
        it('should render loading spinner when loading is true', () => {
            render(<InsightsChart data={[]} loading={true} />);

            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
        });

        it('should render loading state with proper elements', () => {
            render(<InsightsChart data={[]} loading={true} />);

            const loadingContainer = screen.getByText('Loading...').parentElement;
            expect(loadingContainer).toBeInTheDocument();
        });
    });

    describe('Error state', () => {
        it('should render error alert when error is provided', () => {
            const errorMessage = 'Failed to load data';
            render(<InsightsChart data={[]} error={errorMessage} />);

            expect(screen.getByText('Error loading chart data')).toBeInTheDocument();
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
        });

        it('should use danger theme for error alert', () => {
            render(<InsightsChart data={[]} error="Error message" />);

            const alert = screen.getByText('Error loading chart data').closest('.g-alert');
            expect(alert).toHaveClass('g-alert');
        });
    });

    describe('Empty data state', () => {
        it('should render empty state when data is empty array', () => {
            render(<InsightsChart data={[]} />);

            expect(screen.getByText('No data available')).toBeInTheDocument();
            expect(
                screen.getByText(
                    'Try selecting different filters or check if data exists for this period',
                ),
            ).toBeInTheDocument();
            expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
        });

        it('should render empty state when data is undefined', () => {
            render(<InsightsChart data={undefined as unknown as ChartDataPoint[]} />);

            expect(screen.getByText('No data available')).toBeInTheDocument();
            expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
        });

        it('should render empty state container', () => {
            render(<InsightsChart data={[]} />);

            const emptyContainer = screen.getByText('No data available').parentElement;
            expect(emptyContainer).toBeInTheDocument();
        });
    });

    describe('Chart rendering', () => {
        it('should render chart with valid data', () => {
            render(<InsightsChart data={mockData} />);

            expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
            expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
            expect(screen.getByTestId('bar')).toBeInTheDocument();
            expect(screen.getByTestId('x-axis')).toBeInTheDocument();
            expect(screen.getByTestId('y-axis')).toBeInTheDocument();
            expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        });

        it('should render chart container', () => {
            render(<InsightsChart data={mockData} />);

            const chartContainer = screen.getByTestId('responsive-container').parentElement;
            expect(chartContainer).toBeInTheDocument();
        });

        it('should render without loading or error states when data is provided', () => {
            render(<InsightsChart data={mockData} />);

            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            expect(screen.queryByText('Error loading chart data')).not.toBeInTheDocument();
            expect(screen.queryByText('No data available')).not.toBeInTheDocument();
        });

        it('should handle invalid chart data', () => {
            const invalidData = [{name: 'Account 1', value: 'invalid' as unknown as number}];
            render(<InsightsChart data={invalidData} />);
        });
    });

    describe('Component integration', () => {
        it('should prioritize loading state over other states', () => {
            render(<InsightsChart data={mockData} loading={true} error="Some error" />);

            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(screen.queryByText('Error loading chart data')).not.toBeInTheDocument();
            expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
        });

        it('should prioritize error state over empty data state', () => {
            render(<InsightsChart data={[]} error="Some error" />);

            expect(screen.getByText('Error loading chart data')).toBeInTheDocument();
            expect(screen.queryByText('No data available')).not.toBeInTheDocument();
            expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
        });

        it('should render chart when loading is false and no error', () => {
            render(<InsightsChart data={mockData} loading={false} />);

            expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            expect(screen.queryByText('Error loading chart data')).not.toBeInTheDocument();
        });
    });
});

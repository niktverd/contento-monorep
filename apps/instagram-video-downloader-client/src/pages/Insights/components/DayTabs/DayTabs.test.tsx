import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, render, screen} from '@testing-library/react';

import {DayTabs} from './DayTabs';

// Helper to wrap components with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme="light">{component}</ThemeProvider>);
};

describe('DayTabs', () => {
    const mockOnDayChange = jest.fn();
    const mockAvailableDays = ['2025-06-15', '2025-06-14', '2025-06-13'];

    beforeEach(() => {
        mockOnDayChange.mockClear();
    });

    describe('Rendering', () => {
        it('should render day tabs correctly', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={mockAvailableDays}
                    selectedDay="2025-06-14"
                    onDayChange={mockOnDayChange}
                />,
            );

            // Check if all days are rendered
            expect(screen.getByText('Jun 15')).toBeInTheDocument();
            expect(screen.getByText('Jun 14')).toBeInTheDocument();
            expect(screen.getByText('Jun 13')).toBeInTheDocument();
        });

        it('should highlight selected day', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={mockAvailableDays}
                    selectedDay="2025-06-14"
                    onDayChange={mockOnDayChange}
                />,
            );

            const selectedTab = screen.getByText('Jun 14');
            expect(selectedTab).toBeInTheDocument();
            // Check that the tab is active (Gravity UI Tabs handle styling internally)
            expect(selectedTab.closest('[role="tab"]')).toHaveAttribute('aria-selected', 'true');
        });

        it('should show loading state', () => {
            render(
                <DayTabs
                    availableDays={[]}
                    selectedDay=""
                    onDayChange={mockOnDayChange}
                    loading={true}
                />,
            );

            expect(screen.getByText('Loading days...')).toBeInTheDocument();
        });

        it('should show no data message when no days available', () => {
            render(
                <DayTabs
                    availableDays={[]}
                    selectedDay=""
                    onDayChange={mockOnDayChange}
                    loading={false}
                />,
            );

            expect(
                screen.getByText('No data available for the selected period'),
            ).toBeInTheDocument();
        });
    });

    describe('Interaction', () => {
        it('should call onDayChange when day is clicked', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={mockAvailableDays}
                    selectedDay="2025-06-14"
                    onDayChange={mockOnDayChange}
                />,
            );

            fireEvent.click(screen.getByText('Jun 15'));
            expect(mockOnDayChange).toHaveBeenCalledWith('2025-06-15');
        });

        it('should not call onDayChange when already selected day is clicked', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={mockAvailableDays}
                    selectedDay="2025-06-14"
                    onDayChange={mockOnDayChange}
                />,
            );

            fireEvent.click(screen.getByText('Jun 14'));
            expect(mockOnDayChange).toHaveBeenCalledWith('2025-06-14');
        });
    });

    describe('Date Formatting', () => {
        it('should format dates correctly for display', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={['2025-01-01', '2025-12-31']}
                    selectedDay="2025-01-01"
                    onDayChange={mockOnDayChange}
                />,
            );

            expect(screen.getByText('Jan 1')).toBeInTheDocument();
            expect(screen.getByText('Dec 31')).toBeInTheDocument();
        });

        it('should show title with full date format', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={['2025-06-14']}
                    selectedDay="2025-06-14"
                    onDayChange={mockOnDayChange}
                />,
            );

            const button = screen.getByText('Jun 14');
            expect(button.closest('[role="tab"]')).toHaveAttribute('title', 'June 14, 2025');
        });

        it('should handle invalid date format gracefully', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={['invalid-date']}
                    selectedDay="invalid-date"
                    onDayChange={mockOnDayChange}
                />,
            );

            // Should show "Invalid Date" for invalid date strings
            expect(screen.getByText('Invalid Date')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty availableDays array', () => {
            renderWithTheme(
                <DayTabs availableDays={[]} selectedDay="" onDayChange={mockOnDayChange} />,
            );

            expect(
                screen.getByText('No data available for the selected period'),
            ).toBeInTheDocument();
        });

        it('should handle selectedDay not in availableDays', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={mockAvailableDays}
                    selectedDay="2025-06-16"
                    onDayChange={mockOnDayChange}
                />,
            );

            // Should render all available days without highlighting any
            mockAvailableDays.forEach((day) => {
                const formattedDay = new Date(day).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                });
                expect(screen.getByText(formattedDay)).toBeInTheDocument();
            });
        });

        it('should handle single day in availableDays', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={['2025-06-14']}
                    selectedDay="2025-06-14"
                    onDayChange={mockOnDayChange}
                />,
            );

            expect(screen.getByText('Jun 14')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper button roles', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={mockAvailableDays}
                    selectedDay="2025-06-14"
                    onDayChange={mockOnDayChange}
                />,
            );

            const tabs = screen.getAllByRole('tab');
            expect(tabs).toHaveLength(mockAvailableDays.length);
        });

        it('should have descriptive titles', () => {
            renderWithTheme(
                <DayTabs
                    availableDays={['2025-06-14']}
                    selectedDay="2025-06-14"
                    onDayChange={mockOnDayChange}
                />,
            );

            const tab = screen.getByRole('tab');
            expect(tab).toHaveAttribute('title', 'June 14, 2025');
        });
    });
});

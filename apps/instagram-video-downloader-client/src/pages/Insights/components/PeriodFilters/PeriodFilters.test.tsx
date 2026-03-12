import React from 'react';

import {fireEvent, render, screen} from '@testing-library/react';

import {PeriodFilters} from './PeriodFilters';

describe('PeriodFilters', () => {
    const mockOnYearChange = jest.fn();
    const mockOnMonthChange = jest.fn();

    const defaultProps = {
        selectedYear: 2025,
        selectedMonth: 6,
        onYearChange: mockOnYearChange,
        onMonthChange: mockOnMonthChange,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders year and month selectors', () => {
        render(<PeriodFilters {...defaultProps} />);

        expect(screen.getByText('Year')).toBeInTheDocument();
        expect(screen.getByText('Month')).toBeInTheDocument();
    });

    it('displays selected year correctly', () => {
        render(<PeriodFilters {...defaultProps} />);

        const yearRadio = screen.getByDisplayValue('2025');
        expect(yearRadio).toBeChecked();
    });

    it('displays selected month correctly', () => {
        render(<PeriodFilters {...defaultProps} />);

        const monthRadio = screen.getByDisplayValue('6');
        expect(monthRadio).toBeChecked();
    });

    it('generates year options from 2025 to current year', () => {
        const currentYear = new Date().getFullYear();
        render(<PeriodFilters {...defaultProps} />);

        // Check that 2025 option exists
        expect(screen.getByDisplayValue('2025')).toBeInTheDocument();

        // Check that current year option exists (if different from 2025)
        if (currentYear > 2025) {
            expect(screen.getByDisplayValue(currentYear.toString())).toBeInTheDocument();
        }
    });

    it('displays all 12 month options', () => {
        render(<PeriodFilters {...defaultProps} />);

        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];

        monthNames.forEach((monthName) => {
            expect(screen.getByText(monthName)).toBeInTheDocument();
        });
    });

    it('calls onYearChange when year is selected', () => {
        const currentYear = new Date().getFullYear();
        render(<PeriodFilters {...defaultProps} />);

        // If current year is different from selected year, click it
        if (currentYear !== defaultProps.selectedYear) {
            const yearRadio = screen.getByDisplayValue(currentYear.toString());
            fireEvent.click(yearRadio);

            expect(mockOnYearChange).toHaveBeenCalledWith(currentYear);
        }
    });

    it('calls onMonthChange when month is selected', () => {
        render(<PeriodFilters {...defaultProps} />);

        const januaryRadio = screen.getByDisplayValue('1');
        fireEvent.click(januaryRadio);

        expect(mockOnMonthChange).toHaveBeenCalledWith(1);
    });

    it('handles different selected year', () => {
        const currentYear = new Date().getFullYear();
        render(<PeriodFilters {...defaultProps} selectedYear={currentYear} />);

        const yearRadio = screen.getByDisplayValue(currentYear.toString());
        expect(yearRadio).toBeChecked();
    });

    it('handles different selected month', () => {
        render(<PeriodFilters {...defaultProps} selectedMonth={12} />);

        const decemberRadio = screen.getByDisplayValue('12');
        expect(decemberRadio).toBeChecked();
    });

    it('should handle edge case with single year (current year = 2025)', () => {
        // Mock current year to be 2025
        const originalDate = Date;
        const mockDate = jest.fn(() => ({
            getFullYear: () => 2025,
        }));
        global.Date = mockDate as unknown as typeof Date;

        render(<PeriodFilters {...defaultProps} />);

        // Should still render 2025 option
        expect(screen.getByDisplayValue('2025')).toBeInTheDocument();

        // Restore original Date
        global.Date = originalDate;
    });

    it('should handle change events properly', () => {
        const mockYearChange = jest.fn();
        const mockMonthChange = jest.fn();

        render(
            <PeriodFilters
                selectedYear={2025}
                selectedMonth={1}
                onYearChange={mockYearChange}
                onMonthChange={mockMonthChange}
            />,
        );

        // Test clicking on a different month
        const februaryRadio = screen.getByDisplayValue('2');
        fireEvent.click(februaryRadio);

        expect(mockMonthChange).toHaveBeenCalledWith(2);
    });
});

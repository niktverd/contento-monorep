import React from 'react';

import {Flex, RadioGroup, Text} from '@gravity-ui/uikit';

import {PeriodFiltersProps} from '../../types';

import styles from './PeriodFilters.module.css';

const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2025; year <= currentYear; year++) {
        years.push({
            value: year.toString(),
            content: year.toString(),
        });
    }
    return years;
};

const monthOptions = [
    {value: '1', content: 'January'},
    {value: '2', content: 'February'},
    {value: '3', content: 'March'},
    {value: '4', content: 'April'},
    {value: '5', content: 'May'},
    {value: '6', content: 'June'},
    {value: '7', content: 'July'},
    {value: '8', content: 'August'},
    {value: '9', content: 'September'},
    {value: '10', content: 'October'},
    {value: '11', content: 'November'},
    {value: '12', content: 'December'},
];

export const PeriodFilters: React.FC<PeriodFiltersProps> = ({
    selectedYear,
    selectedMonth,
    onYearChange,
    onMonthChange,
}) => {
    const yearOptions = generateYearOptions();

    const handleYearChange = (value: string) => {
        onYearChange(parseInt(value, 10));
    };

    const handleMonthChange = (value: string) => {
        onMonthChange(parseInt(value, 10));
    };

    return (
        <Flex direction="column" gap={4} className={styles.container}>
            <Flex direction="row" gap={6} className={styles.filtersRow}>
                <Flex direction="column" gap={2} className={styles.filterGroup}>
                    <Text variant="body-2" color="secondary" className={styles.label}>
                        Year
                    </Text>
                    <RadioGroup
                        value={selectedYear.toString()}
                        onUpdate={handleYearChange}
                        options={yearOptions}
                    />
                </Flex>

                <Flex direction="column" gap={2} className={styles.filterGroup}>
                    <Text variant="body-2" color="secondary" className={styles.label}>
                        Month
                    </Text>
                    <RadioGroup
                        value={selectedMonth.toString()}
                        onUpdate={handleMonthChange}
                        options={monthOptions}
                    />
                </Flex>
            </Flex>
        </Flex>
    );
};

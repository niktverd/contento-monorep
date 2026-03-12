import React, {useMemo} from 'react';

import {Alert, Button, Card, Container, Flex, Progress, Text} from '@gravity-ui/uikit';

import {AccountFilters} from './components/AccountFilters/AccountFilters';
import {DayTabs} from './components/DayTabs/DayTabs';
import {InsightsChart} from './components/InsightsChart/InsightsChart';
import {MetricTabs} from './components/MetricTabs/MetricTabs';
import {PeriodFilters} from './components/PeriodFilters/PeriodFilters';
import {useInsightsData} from './hooks/useInsightsData';
import {useUrlParams} from './hooks/useUrlParams';
import {MetricType} from './types';
import {
    getMostRecentDay,
    isValidDay,
    parseAvailableDays,
    parseAvailableMetrics,
    transformToChartData,
} from './utils/dataTransformers';

import styles from './Root.module.css';

export const Root = () => {
    const {params, updateParams} = useUrlParams();

    // Fetch insights data using the custom hook
    const {
        data: apiData,
        loading,
        error,
        refetch,
    } = useInsightsData(
        params.year ? parseInt(params.year, 10) : undefined,
        params.month ? parseInt(params.month, 10) : undefined,
    );

    const handleYearChange = (year: number) => {
        updateParams({year: year.toString()});
    };

    const handleMonthChange = (month: number) => {
        updateParams({month: month.toString()});
    };

    const handleDayChange = (day: string) => {
        updateParams({day});
    };

    const handleMetricChange = (metric: MetricType) => {
        updateParams({metric});
    };

    // Parse available days and metrics from API data
    const availableDays = useMemo(() => parseAvailableDays(apiData), [apiData]);
    const availableMetrics = useMemo(
        () =>
            parseAvailableMetrics(apiData, params.day).filter((metric): metric is MetricType =>
                ['reach', 'follower_count', 'online_followers'].includes(metric),
            ),
        [apiData, params.day],
    );

    // Get current day and metric for chart data
    const currentDay = useMemo(() => {
        if (!params.day || !isValidDay(availableDays, params.day)) {
            return getMostRecentDay(availableDays);
        }
        return params.day;
    }, [params.day, availableDays]);

    const currentMetric = useMemo(() => {
        if (!params.metric || !availableMetrics.includes(params.metric as MetricType)) {
            return availableMetrics[0] || 'reach';
        }
        return params.metric as MetricType;
    }, [params.metric, availableMetrics]);

    // Get chart data for current day and metric
    const chartData = useMemo(() => {
        if (!apiData || !currentDay || !currentMetric) {
            return [];
        }

        const dayData = apiData[currentDay];
        if (!dayData || !dayData[currentMetric]) {
            return [];
        }

        const selectedAccounts = params.accounts?.split(',').filter(Boolean) || ['total'];
        return transformToChartData(dayData[currentMetric], selectedAccounts);
    }, [apiData, currentDay, currentMetric, params.accounts]);

    // Get all available accounts for filters
    const allAccounts = useMemo(() => {
        if (!apiData || !currentDay || !currentMetric) {
            return [];
        }

        const dayData = apiData[currentDay];
        if (!dayData || !dayData[currentMetric]) {
            return [];
        }

        return Object.keys(dayData[currentMetric]);
    }, [apiData, currentDay, currentMetric]);

    // Handle account filter changes
    const handleAccountToggle = (account: string) => {
        const currentAccounts = params.accounts?.split(',').filter(Boolean) || [];
        const newAccounts = currentAccounts.includes(account)
            ? currentAccounts.filter((a) => a !== account)
            : [...currentAccounts, account];

        updateParams({accounts: newAccounts.join(',')});
    };

    const handleSearchChange = (search: string) => {
        updateParams({search});
    };

    // Show loading state
    if (loading) {
        return (
            <Container maxWidth="xl">
                <Card>
                    <div className={styles.loadingContainer}>
                        <Progress
                            text="Loading insights data..."
                            loading={true}
                            size="m"
                            value={50}
                        />
                    </div>
                </Card>
            </Container>
        );
    }

    // Show error state
    if (error) {
        return (
            <Container maxWidth="xl">
                <Card>
                    <Alert
                        theme="danger"
                        title="Error loading insights data"
                        message={error.message}
                    />
                    <Flex gap={2} className={styles.errorContainer}>
                        <Button onClick={refetch}>Retry</Button>
                    </Flex>
                </Card>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl">
            <Flex direction="column" gap={4}>
                <Text variant="header-1">Instagram Insights Report</Text>

                {/* Period Filters */}
                <PeriodFilters
                    selectedYear={parseInt(params.year || '0', 10)}
                    selectedMonth={parseInt(params.month || '0', 10)}
                    onYearChange={handleYearChange}
                    onMonthChange={handleMonthChange}
                />

                {/* Day and Metric Navigation */}
                <Flex gap={4} className={styles.navigationSection}>
                    <Flex direction="column" gap={2} className={styles.navigationColumn}>
                        <DayTabs
                            availableDays={availableDays}
                            selectedDay={currentDay}
                            onDayChange={handleDayChange}
                            loading={loading}
                        />
                        <MetricTabs
                            availableMetrics={availableMetrics}
                            selectedMetric={currentMetric}
                            onMetricChange={handleMetricChange}
                            loading={loading}
                        />
                    </Flex>
                </Flex>

                {/* Main Content */}
                <Flex gap={4} className={styles.mainContent}>
                    {/* Account Filters */}
                    <div className={styles.accountFiltersContainer}>
                        <AccountFilters
                            accounts={allAccounts}
                            selectedAccounts={
                                params.accounts?.split(',').filter(Boolean) || ['total']
                            }
                            searchQuery={params.search || ''}
                            onAccountToggle={handleAccountToggle}
                            onSearchChange={handleSearchChange}
                        />
                    </div>

                    {/* Chart */}
                    <div className={styles.chartContainer}>
                        <Text variant="header-2" className={styles.title}>
                            {currentMetric?.toUpperCase()}
                        </Text>
                        <InsightsChart data={chartData} loading={loading} error={error?.message} />
                    </div>
                </Flex>
            </Flex>
        </Container>
    );
};

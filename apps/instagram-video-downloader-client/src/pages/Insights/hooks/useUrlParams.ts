import {useCallback, useEffect, useMemo} from 'react';

import {useLocation, useNavigate} from 'react-router-dom';

import {InsightsUrlParams, MetricType, UseUrlParamsReturn} from '../types';

/**
 * Custom hook for managing URL parameters for insights page
 * Handles year, month, day, metric, accounts, and search parameters with validation and defaults
 * @returns Object containing current params and updateParams function
 */
export const useUrlParams = (): UseUrlParamsReturn => {
    const location = useLocation();
    const navigate = useNavigate();

    // Valid metrics for validation - memoized to prevent dependency changes
    const VALID_METRICS = useMemo(
        (): MetricType[] => ['reach', 'follower_count', 'online_followers'],
        [],
    );

    // Get default parameters
    const getDefaultParams = useCallback((): Required<
        Pick<InsightsUrlParams, 'year' | 'month'>
    > => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 0-based to 1-based

        return {
            year: currentYear.toString(),
            month: currentMonth.toString(),
        };
    }, []);

    // Parse current URL parameters
    const params = useMemo((): InsightsUrlParams => {
        const searchParams = new URLSearchParams(location.search);
        const defaults = getDefaultParams();

        // Parse and validate year
        const yearParam = searchParams.get('year');
        let year = yearParam || defaults.year;
        const yearNum = parseInt(year, 10);
        if (isNaN(yearNum) || yearNum < 2025 || yearNum > parseInt(defaults.year, 10)) {
            year = defaults.year;
        }

        // Parse and validate month
        const monthParam = searchParams.get('month');
        let month = monthParam || defaults.month;
        const monthNum = parseInt(month, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            month = defaults.month;
        }

        // Parse and validate day (optional)
        const dayParam = searchParams.get('day');
        let day: string | undefined;
        if (dayParam) {
            // Validate day format (YYYY-MM-DD)
            const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
            if (dayPattern.test(dayParam)) {
                const dayDate = new Date(dayParam);
                if (!isNaN(dayDate.getTime()) && dayParam === dayDate.toISOString().split('T')[0]) {
                    day = dayParam;
                }
            }
        }

        // Parse and validate metric (optional)
        const metricParam = searchParams.get('metric') as MetricType;
        let metric: string | undefined;
        if (metricParam && VALID_METRICS.includes(metricParam)) {
            metric = metricParam;
        }

        // Parse accounts (optional, comma-separated)
        const accountsParam = searchParams.get('accounts');
        const accounts = accountsParam || undefined;

        // Parse search query (optional)
        const searchParam = searchParams.get('search');
        const search = searchParam || undefined;

        return {year, month, day, metric, accounts, search};
    }, [location.search, getDefaultParams, VALID_METRICS]);

    // Helper function to update year parameter
    const updateYearParam = useCallback(
        (
            searchParams: URLSearchParams,
            year: string,
            defaults: ReturnType<typeof getDefaultParams>,
        ) => {
            const yearNum = parseInt(year, 10);
            if (!isNaN(yearNum) && yearNum >= 2025 && yearNum <= parseInt(defaults.year, 10)) {
                searchParams.set('year', year);
            }
        },
        [],
    );

    // Helper function to update month parameter
    const updateMonthParam = useCallback((searchParams: URLSearchParams, month: string) => {
        const monthNum = parseInt(month, 10);
        if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            searchParams.set('month', month);
        }
    }, []);

    // Helper function to update day parameter
    const updateDayParam = useCallback((searchParams: URLSearchParams, day: string | null) => {
        if (day === null || day === '') {
            searchParams.delete('day');
        } else {
            // Validate day format before setting
            const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
            if (dayPattern.test(day)) {
                const dayDate = new Date(day);
                const isValidDate =
                    !isNaN(dayDate.getTime()) && day === dayDate.toISOString().split('T')[0];
                if (isValidDate) {
                    searchParams.set('day', day);
                }
            }
        }
    }, []);

    // Helper function to update metric parameter
    const updateMetricParam = useCallback(
        (searchParams: URLSearchParams, metric: string | null) => {
            if (metric === null || metric === '') {
                searchParams.delete('metric');
            } else if (VALID_METRICS.includes(metric as MetricType)) {
                searchParams.set('metric', metric);
            }
        },
        [VALID_METRICS],
    );

    // Helper function to update accounts parameter
    const updateAccountsParam = useCallback(
        (searchParams: URLSearchParams, accounts: string | null) => {
            if (accounts === null || accounts === '') {
                searchParams.delete('accounts');
            } else {
                searchParams.set('accounts', accounts);
            }
        },
        [],
    );

    // Helper function to update search parameter
    const updateSearchParam = useCallback(
        (searchParams: URLSearchParams, search: string | null) => {
            if (search === null || search === '') {
                searchParams.delete('search');
            } else {
                searchParams.set('search', search);
            }
        },
        [],
    );

    // Update URL parameters
    const updateParams = useCallback(
        (newParams: Partial<InsightsUrlParams>) => {
            const searchParams = new URLSearchParams(location.search);
            const defaults = getDefaultParams();

            // Update each parameter type
            if (newParams.year !== undefined) {
                updateYearParam(searchParams, newParams.year, defaults);
            }
            if (newParams.month !== undefined) {
                updateMonthParam(searchParams, newParams.month);
            }
            if (newParams.day !== undefined) {
                updateDayParam(searchParams, newParams.day);
            }
            if (newParams.metric !== undefined) {
                updateMetricParam(searchParams, newParams.metric);
            }
            if (newParams.accounts !== undefined) {
                updateAccountsParam(searchParams, newParams.accounts);
            }
            if (newParams.search !== undefined) {
                updateSearchParam(searchParams, newParams.search);
            }

            // Navigate to updated URL
            navigate({
                pathname: location.pathname,
                search: searchParams.toString(),
            });
        },
        [
            location.pathname,
            location.search,
            navigate,
            getDefaultParams,
            updateYearParam,
            updateMonthParam,
            updateDayParam,
            updateMetricParam,
            updateAccountsParam,
            updateSearchParam,
        ],
    );

    // Initialize URL with default parameters if none are present
    useEffect(() => {
        const defaultParams = getDefaultParams();
        const hasParams = location.search.length > 0;

        // If no URL parameters are present, set defaults
        if (!hasParams) {
            updateParams({
                year: defaultParams.year,
                month: defaultParams.month,
            });
        }
    }, [location.search, getDefaultParams, updateParams]);

    return {params, updateParams};
};

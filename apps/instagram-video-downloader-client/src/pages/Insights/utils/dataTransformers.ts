import {UiGetInsightsInstagramReportResponse} from '../../../sharedTypes/types/instagramApi';

/**
 * Extract available days from API response
 * @param data - API response data
 * @returns Array of day strings in YYYY-MM-DD format, sorted chronologically
 */
export const parseAvailableDays = (
    data: UiGetInsightsInstagramReportResponse | undefined,
): string[] => {
    if (!data || typeof data !== 'object') {
        return [];
    }

    // Extract day keys from the response object
    const days = Object.keys(data);

    // Filter and validate day format (YYYY-MM-DD)
    const validDays = days.filter((day) => {
        // Check if day matches YYYY-MM-DD pattern
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(day)) {
            return false;
        }

        // Check if it's a valid date
        const date = new Date(day);
        return !isNaN(date.getTime()) && day === date.toISOString().split('T')[0];
    });

    // Sort days chronologically (newest first)
    return validDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
};

/**
 * Get available metrics for a specific day
 * @param data - API response data
 * @param day - Day string in YYYY-MM-DD format
 * @returns Array of available metrics for the day
 */
export const parseAvailableMetrics = (
    data: UiGetInsightsInstagramReportResponse | undefined,
    day: string,
): string[] => {
    if (!data || !day || !data[day]) {
        return [];
    }

    const dayData = data[day];
    if (typeof dayData !== 'object') {
        return [];
    }

    return Object.keys(dayData);
};

/**
 * Get account data for a specific day and metric
 * @param data - API response data
 * @param day - Day string in YYYY-MM-DD format
 * @param metric - Metric name
 * @returns Object with account names as keys and values as numbers
 */
export const parseAccountData = (
    data: UiGetInsightsInstagramReportResponse | undefined,
    day: string,
    metric: string,
): Record<string, number> => {
    if (!data || !day || !metric || !data[day] || !data[day][metric]) {
        return {};
    }

    const metricData = data[day][metric];
    if (typeof metricData !== 'object') {
        return {};
    }

    // Filter out non-numeric values and ensure we have valid account data
    const accountData: Record<string, number> = {};
    Object.entries(metricData).forEach(([account, value]) => {
        if (typeof value === 'number' && !isNaN(value)) {
            accountData[account] = value;
        }
    });

    return accountData;
};

/**
 * Get the most recent day from available days
 * @param days - Array of day strings
 * @returns Most recent day string or undefined if no days available
 */
export const getMostRecentDay = (days: string[]): string | undefined => {
    if (!days.length) {
        return undefined;
    }

    // Days should already be sorted by parseAvailableDays, but ensure newest first
    const sortedDays = [...days].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return sortedDays[0];
};

/**
 * Validate if a day exists in the available days
 * @param days - Array of available day strings
 * @param selectedDay - Day to validate
 * @returns True if day is valid and available
 */
export const isValidDay = (days: string[], selectedDay: string): boolean => {
    return days.includes(selectedDay);
};

/**
 * Transform account data to chart format for recharts
 * @param accountData - Object with account names as keys and values as numbers
 * @param selectedAccounts - Array of account names to include in chart
 * @returns Array of chart data points with name and value properties
 */
export const transformToChartData = (
    accountData: Record<string, number>,
    selectedAccounts: string[] = [],
): Array<{name: string; value: number}> => {
    if (!accountData || typeof accountData !== 'object') {
        return [];
    }

    // If no accounts selected, include all accounts
    const accountsToInclude =
        selectedAccounts.length > 0 ? selectedAccounts : Object.keys(accountData);

    return accountsToInclude
        .filter((account) => account in accountData)
        .map((account) => ({
            name: account,
            value: accountData[account],
        }))
        .sort((a, b) => b.value - a.value); // Sort by value descending
};

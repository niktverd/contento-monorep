import {UiGetInsightsInstagramReportResponse} from '../../sharedTypes/types/instagramApi';

// URL Parameters
export interface InsightsUrlParams {
    year?: string;
    month?: string;
    day?: string;
    metric?: string;
    accounts?: string;
    search?: string;
}

// Available metrics from API response
export type MetricType = 'reach' | 'follower_count' | 'online_followers';

// Period filter props
export interface PeriodFiltersProps {
    selectedYear: number;
    selectedMonth: number;
    onYearChange: (year: number) => void;
    onMonthChange: (month: number) => void;
}

// Day tabs props
export interface DayTabsProps {
    availableDays: string[];
    selectedDay: string;
    onDayChange: (day: string) => void;
    loading?: boolean;
}

// Metric tabs props
export interface MetricTabsProps {
    availableMetrics: MetricType[];
    selectedMetric: MetricType;
    onMetricChange: (metric: MetricType) => void;
    loading?: boolean;
}

// Chart data structure
export interface ChartDataPoint {
    name: string;
    value: number;
}

// Chart props
export interface InsightsChartProps {
    data: ChartDataPoint[];
    loading?: boolean;
    error?: string;
}

// Account filter props
export interface AccountFiltersProps {
    accounts: string[];
    selectedAccounts: string[];
    searchQuery: string;
    onAccountToggle: (account: string) => void;
    onSearchChange: (query: string) => void;
}

// Hook return types
export interface UseInsightsDataReturn {
    data: UiGetInsightsInstagramReportResponse | undefined;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

export interface UseUrlParamsReturn {
    params: InsightsUrlParams;
    updateParams: (newParams: Partial<InsightsUrlParams>) => void;
}

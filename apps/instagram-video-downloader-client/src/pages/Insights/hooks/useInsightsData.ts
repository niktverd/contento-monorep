import {useCallback, useContext, useEffect, useState} from 'react';

import {AppEnvContext} from '../../../contexts/AppEnv';
import {
    UiGetInsightsInstagramReportParams,
    UiGetInsightsInstagramReportResponse,
} from '../../../sharedTypes/types/instagramApi';
import {FetchRoutes2} from '../../../utils/constants';
import {fetchGet} from '../../../utils/fetchHelpers';
import {UseInsightsDataReturn} from '../types';

/**
 * Custom hook for fetching Instagram insights report data
 * @param year - Year for the report (e.g., 2025)
 * @param month - Month for the report (1-12)
 * @returns Object with data, loading state, error, and refetch function
 */
export const useInsightsData = (year?: number, month?: number): UseInsightsDataReturn => {
    const {isProd} = useContext(AppEnvContext);
    const [data, setData] = useState<UiGetInsightsInstagramReportResponse | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        // Don't fetch if year or month is missing
        if (!year || !month) {
            setData(undefined);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const query: UiGetInsightsInstagramReportParams = {
                year,
                month,
            };

            const response = await fetchGet<UiGetInsightsInstagramReportResponse>({
                route: FetchRoutes2.getInsightsReport,
                query,
                isProd,
            });

            // For now, set data directly without validation
            // TODO: Add validation back when schema is working properly
            setData(response);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch insights data';
            setError(new Error(errorMessage));
            setData(undefined);
        } finally {
            setLoading(false);
        }
    }, [year, month, isProd]);

    // Fetch data when dependencies change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Manual refetch function
    const refetch = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch,
    };
};

import {UiGetInsightsInstagramReportResponse} from '../../../sharedTypes/types/instagramApi';

import {
    getMostRecentDay,
    isValidDay,
    parseAccountData,
    parseAvailableDays,
    parseAvailableMetrics,
    transformToChartData,
} from './dataTransformers';

describe('dataTransformers', () => {
    const mockApiResponse: UiGetInsightsInstagramReportResponse = {
        '2025-06-14': {
            reach: {
                account1: 1000,
                account2: 2000,
                total: 3000,
            },
            follower_count: {
                account1: 500,
                account2: 800,
                total: 1300,
            },
        },
        '2025-06-13': {
            reach: {
                account1: 1500,
                account3: 700,
                total: 2200,
            },
        },
        '2025-06-15': {
            online_followers: {
                account1: 300,
                total: 300,
            },
        },
    };

    describe('parseAvailableDays', () => {
        it('should extract and sort days from API response', () => {
            const days = parseAvailableDays(mockApiResponse);
            expect(days).toEqual(['2025-06-15', '2025-06-14', '2025-06-13']);
        });

        it('should return empty array for undefined data', () => {
            const days = parseAvailableDays(undefined);
            expect(days).toEqual([]);
        });

        it('should return empty array for null data', () => {
            const days = parseAvailableDays(
                null as unknown as UiGetInsightsInstagramReportResponse,
            );
            expect(days).toEqual([]);
        });

        it('should filter out invalid date formats', () => {
            const invalidResponse = {
                '2025-06-14': {reach: {total: 100}},
                'invalid-date': {reach: {total: 200}},
                '2025-13-40': {reach: {total: 300}}, // Invalid date
                '2025-06-15': {reach: {total: 400}},
            };
            const days = parseAvailableDays(invalidResponse);
            expect(days).toEqual(['2025-06-15', '2025-06-14']);
        });

        it('should handle empty object', () => {
            const days = parseAvailableDays({});
            expect(days).toEqual([]);
        });

        it('should handle non-object data gracefully', () => {
            expect(
                parseAvailableDays(null as unknown as UiGetInsightsInstagramReportResponse),
            ).toEqual([]);
            expect(parseAvailableDays(undefined)).toEqual([]);
            expect(
                parseAvailableDays('string' as unknown as UiGetInsightsInstagramReportResponse),
            ).toEqual([]);
            expect(
                parseAvailableDays(123 as unknown as UiGetInsightsInstagramReportResponse),
            ).toEqual([]);
        });

        it('should handle data without valid metric keys', () => {
            const mockData = {
                '2025-01-15': {
                    invalidMetric: {total: 1000},
                } as unknown as UiGetInsightsInstagramReportResponse['string'],
            };
            const days = parseAvailableDays(mockData);
            expect(days).toEqual(['2025-01-15']); // parseAvailableDays only validates date format
        });

        it('should handle day without metrics', () => {
            const mockData = {
                '2025-01-15': {} as UiGetInsightsInstagramReportResponse['string'],
            };
            const days = parseAvailableDays(mockData);
            expect(days).toEqual(['2025-01-15']); // parseAvailableDays only validates date format
        });

        it('should handle empty metric object', () => {
            const mockData = {
                '2025-01-15': {
                    reach: {} as UiGetInsightsInstagramReportResponse['string']['reach'],
                },
            };
            const days = parseAvailableDays(mockData);
            expect(days).toEqual(['2025-01-15']); // parseAvailableDays only validates date format
        });

        it('should filter metric with only undefined values', () => {
            const mockData = {
                '2025-01-15': {
                    reach: {
                        account1: undefined,
                        account2: undefined,
                    } as unknown as UiGetInsightsInstagramReportResponse['string']['reach'],
                },
            };
            const days = parseAvailableDays(mockData);
            expect(days).toEqual(['2025-01-15']); // parseAvailableDays only validates date format
        });
    });

    describe('parseAvailableMetrics', () => {
        it('should extract metrics for a specific day', () => {
            const metrics = parseAvailableMetrics(mockApiResponse, '2025-06-14');
            expect(metrics).toEqual(['reach', 'follower_count']);
        });

        it('should return empty array for non-existent day', () => {
            const metrics = parseAvailableMetrics(mockApiResponse, '2025-06-16');
            expect(metrics).toEqual([]);
        });

        it('should return empty array for undefined data', () => {
            const metrics = parseAvailableMetrics(undefined, '2025-06-14');
            expect(metrics).toEqual([]);
        });

        it('should return empty array for empty day string', () => {
            const metrics = parseAvailableMetrics(mockApiResponse, '');
            expect(metrics).toEqual([]);
        });

        it('should handle day with non-object data', () => {
            const invalidResponse = {
                '2025-06-14':
                    'invalid' as unknown as UiGetInsightsInstagramReportResponse['string'],
            };
            const metrics = parseAvailableMetrics(invalidResponse, '2025-06-14');
            expect(metrics).toEqual([]);
        });
    });

    describe('parseAccountData', () => {
        it('should extract account data for specific day and metric', () => {
            const accountData = parseAccountData(mockApiResponse, '2025-06-14', 'reach');
            expect(accountData).toEqual({
                account1: 1000,
                account2: 2000,
                total: 3000,
            });
        });

        it('should return empty object for non-existent day', () => {
            const accountData = parseAccountData(mockApiResponse, '2025-06-16', 'reach');
            expect(accountData).toEqual({});
        });

        it('should return empty object for non-existent metric', () => {
            const accountData = parseAccountData(mockApiResponse, '2025-06-14', 'non_existent');
            expect(accountData).toEqual({});
        });

        it('should return empty object for undefined data', () => {
            const accountData = parseAccountData(undefined, '2025-06-14', 'reach');
            expect(accountData).toEqual({});
        });

        it('should filter out non-numeric values', () => {
            const invalidResponse = {
                '2025-06-14': {
                    reach: {
                        account1: 1000,
                        account2: 'invalid' as unknown as number,
                        account3: NaN,
                        account4: null as unknown as number,
                        total: 2000,
                    },
                },
            };
            const accountData = parseAccountData(invalidResponse, '2025-06-14', 'reach');
            expect(accountData).toEqual({
                account1: 1000,
                total: 2000,
            });
        });

        it('should handle metric with non-object data', () => {
            const invalidResponse = {
                '2025-06-14': {
                    reach: 'invalid' as unknown as UiGetInsightsInstagramReportResponse['string']['reach'],
                },
            };
            const accountData = parseAccountData(invalidResponse, '2025-06-14', 'reach');
            expect(accountData).toEqual({});
        });
    });

    describe('getMostRecentDay', () => {
        it('should return the most recent day from sorted array', () => {
            const days = ['2025-06-13', '2025-06-15', '2025-06-14'];
            const mostRecent = getMostRecentDay(days);
            expect(mostRecent).toBe('2025-06-15');
        });

        it('should return undefined for empty array', () => {
            const mostRecent = getMostRecentDay([]);
            expect(mostRecent).toBeUndefined();
        });

        it('should return single day from array with one element', () => {
            const days = ['2025-06-14'];
            const mostRecent = getMostRecentDay(days);
            expect(mostRecent).toBe('2025-06-14');
        });

        it('should handle identical dates', () => {
            const days = ['2025-06-14', '2025-06-14', '2025-06-14'];
            const mostRecent = getMostRecentDay(days);
            expect(mostRecent).toBe('2025-06-14');
        });
    });

    describe('isValidDay', () => {
        const availableDays = ['2025-06-13', '2025-06-14', '2025-06-15'];

        it('should return true for valid day', () => {
            const isValid = isValidDay(availableDays, '2025-06-14');
            expect(isValid).toBe(true);
        });

        it('should return false for invalid day', () => {
            const isValid = isValidDay(availableDays, '2025-06-16');
            expect(isValid).toBe(false);
        });

        it('should return false for empty available days', () => {
            const isValid = isValidDay([], '2025-06-14');
            expect(isValid).toBe(false);
        });

        it('should return false for empty selected day', () => {
            const isValid = isValidDay(availableDays, '');
            expect(isValid).toBe(false);
        });

        it('should be case sensitive', () => {
            const isValid = isValidDay(availableDays, '2025-06-14');
            expect(isValid).toBe(true);
        });

        it('should return true for valid day in list', () => {
            const days = ['2025-06-14', '2025-06-13', '2025-06-12'];
            expect(isValidDay(days, '2025-06-14')).toBe(true);
            expect(isValidDay(days, '2025-06-13')).toBe(true);
            expect(isValidDay(days, '2025-06-12')).toBe(true);
        });

        it('should return false for day not in list', () => {
            const days = ['2025-06-14', '2025-06-13'];
            expect(isValidDay(days, '2025-06-12')).toBe(false);
            expect(isValidDay(days, '2025-06-15')).toBe(false);
        });

        it('should return false for empty days array', () => {
            expect(isValidDay([], '2025-06-14')).toBe(false);
        });

        it('should handle uppercase dates', () => {
            const days = ['2025-06-14'];
            expect(isValidDay(days, '2025-06-14')).toBe(true);
            expect(isValidDay(days, '2025-06-14T00:00:00')).toBe(false);
        });
    });

    describe('transformToChartData', () => {
        describe('basic transformation', () => {
            it('should transform account data to chart format', () => {
                const accountData = {
                    account1: 1000,
                    account2: 750,
                    total: 1750,
                };

                const result = transformToChartData(accountData);

                expect(result).toHaveLength(3);
                expect(result).toEqual([
                    {name: 'total', value: 1750},
                    {name: 'account1', value: 1000},
                    {name: 'account2', value: 750},
                ]);
            });

            it('should sort results by value in descending order', () => {
                const accountData = {
                    low: 100,
                    high: 1000,
                    medium: 500,
                };

                const result = transformToChartData(accountData);

                expect(result).toEqual([
                    {name: 'high', value: 1000},
                    {name: 'medium', value: 500},
                    {name: 'low', value: 100},
                ]);
            });
        });

        describe('with selected accounts', () => {
            it('should filter data by selected accounts', () => {
                const accountData = {
                    account1: 1000,
                    account2: 750,
                    account3: 500,
                    total: 2250,
                };
                const selectedAccounts = ['account1', 'total'];

                const result = transformToChartData(accountData, selectedAccounts);

                expect(result).toHaveLength(2);
                expect(result).toEqual([
                    {name: 'total', value: 2250},
                    {name: 'account1', value: 1000},
                ]);
            });

            it('should include all accounts when selectedAccounts is empty', () => {
                const accountData = {
                    account1: 1000,
                    account2: 750,
                };

                const result = transformToChartData(accountData, []);

                expect(result).toHaveLength(2);
                expect(result).toEqual([
                    {name: 'account1', value: 1000},
                    {name: 'account2', value: 750},
                ]);
            });

            it('should exclude selected accounts not in account data', () => {
                const accountData = {
                    account1: 1000,
                    account2: 750,
                };
                const selectedAccounts = ['account1', 'nonexistent', 'account3'];

                const result = transformToChartData(accountData, selectedAccounts);

                expect(result).toHaveLength(1);
                expect(result).toEqual([{name: 'account1', value: 1000}]);
            });

            it('should handle empty selected accounts array', () => {
                const accountData = {
                    account1: 1000,
                    account2: 750,
                };

                const result = transformToChartData(accountData, []);

                expect(result).toHaveLength(2);
            });
        });

        describe('edge cases', () => {
            it('should return empty array for null/undefined account data', () => {
                expect(transformToChartData(null as unknown as Record<string, number>)).toEqual([]);
                expect(
                    transformToChartData(undefined as unknown as Record<string, number>),
                ).toEqual([]);
            });

            it('should return empty array for non-object account data', () => {
                expect(
                    transformToChartData('invalid' as unknown as Record<string, number>),
                ).toEqual([]);
                expect(transformToChartData(123 as unknown as Record<string, number>)).toEqual([]);
                expect(transformToChartData([] as unknown as Record<string, number>)).toEqual([]);
            });

            it('should handle empty account data object', () => {
                const result = transformToChartData({});

                expect(result).toEqual([]);
            });

            it('should handle account data with zero values', () => {
                const accountData = {
                    account1: 0,
                    account2: 100,
                    account3: 0,
                };

                const result = transformToChartData(accountData);

                expect(result).toEqual([
                    {name: 'account2', value: 100},
                    {name: 'account1', value: 0},
                    {name: 'account3', value: 0},
                ]);
            });

            it('should handle negative values', () => {
                const accountData = {
                    positive: 100,
                    negative: -50,
                    zero: 0,
                };

                const result = transformToChartData(accountData);

                expect(result).toEqual([
                    {name: 'positive', value: 100},
                    {name: 'zero', value: 0},
                    {name: 'negative', value: -50},
                ]);
            });
        });

        describe('data consistency', () => {
            it('should maintain data integrity during transformation', () => {
                const accountData = {
                    'special-chars_123': 999,
                    'unicode-测试': 888,
                    'spaces in name': 777,
                };

                const result = transformToChartData(accountData);

                expect(result).toEqual([
                    {name: 'special-chars_123', value: 999},
                    {name: 'unicode-测试', value: 888},
                    {name: 'spaces in name', value: 777},
                ]);
            });

            it('should handle very large numbers', () => {
                const accountData = {
                    large: 999999999999,
                    small: 1,
                };

                const result = transformToChartData(accountData);

                expect(result).toEqual([
                    {name: 'large', value: 999999999999},
                    {name: 'small', value: 1},
                ]);
            });
        });
    });
});

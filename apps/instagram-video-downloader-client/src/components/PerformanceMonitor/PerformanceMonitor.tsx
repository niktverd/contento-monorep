import React, {useEffect, useState} from 'react';

import {Magnifier} from '@gravity-ui/icons';
import {Button, Card, Text} from '@gravity-ui/uikit';

import styles from './PerformanceMonitor.module.css';

// Interface for performance data
interface PerformanceData {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
    timestamp: number;
}

// Format bytes to human-readable format (KB, MB, GB)
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Calculate memory usage percentage
const calculatePercentage = (used: number, total: number): number => {
    return Math.round((used / total) * 100);
};

export const PerformanceMonitor: React.FC = () => {
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    // Get current memory usage
    const getMemoryUsage = (): PerformanceData | null => {
        if (window.performance && 'memory' in window.performance) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const memory = (window.performance as any).memory;
            return {
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
                totalJSHeapSize: memory.totalJSHeapSize,
                usedJSHeapSize: memory.usedJSHeapSize,
                timestamp: Date.now(),
            };
        }
        return null;
    };

    // Start monitoring
    const startMonitoring = () => {
        if (isMonitoring) return;

        setIsMonitoring(true);
        setPerformanceData([]); // Reset data

        const id = setInterval(() => {
            const memoryData = getMemoryUsage();
            if (memoryData) {
                setPerformanceData((prev) => [...prev, memoryData]);
            }
        }, 1000); // Collect data every second

        setIntervalId(id);
    };

    // Stop monitoring
    const stopMonitoring = () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
        setIsMonitoring(false);
        setIntervalId(null);
    };

    // Get latest memory data
    const getLatestMemoryData = (): PerformanceData | null => {
        if (performanceData.length === 0) return null;
        return performanceData[performanceData.length - 1];
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId]);

    const latestData = getLatestMemoryData();

    return (
        <Card className={styles.monitorCard}>
            <Text variant="header-2">Memory Usage Monitor</Text>

            <div className={styles.controls}>
                <Button
                    view={isMonitoring ? 'normal' : 'action'}
                    onClick={startMonitoring}
                    disabled={isMonitoring}
                >
                    Start Monitoring
                </Button>
                <Button
                    view={isMonitoring ? 'action' : 'normal'}
                    onClick={stopMonitoring}
                    disabled={!isMonitoring}
                >
                    Stop Monitoring
                </Button>
            </div>

            {latestData && (
                <div className={styles.metricsContainer}>
                    <div className={styles.metric}>
                        <Text variant="body-1">Used Heap:</Text>
                        <Text variant="body-1" className={styles.value}>
                            {formatBytes(latestData.usedJSHeapSize)}
                        </Text>
                    </div>

                    <div className={styles.metric}>
                        <Text variant="body-1">Total Heap Size:</Text>
                        <Text variant="body-1" className={styles.value}>
                            {formatBytes(latestData.totalJSHeapSize)}
                        </Text>
                    </div>

                    <div className={styles.metric}>
                        <Text variant="body-1">Heap Limit:</Text>
                        <Text variant="body-1" className={styles.value}>
                            {formatBytes(latestData.jsHeapSizeLimit)}
                        </Text>
                    </div>

                    <div className={styles.metric}>
                        <Text variant="body-1">Memory Usage:</Text>
                        <Text
                            variant="body-1"
                            className={`${styles.value} ${
                                calculatePercentage(
                                    latestData.usedJSHeapSize,
                                    latestData.jsHeapSizeLimit,
                                ) > 80
                                    ? styles.warning
                                    : ''
                            }`}
                        >
                            {calculatePercentage(
                                latestData.usedJSHeapSize,
                                latestData.jsHeapSizeLimit,
                            )}
                            %
                        </Text>
                    </div>
                </div>
            )}

            {performanceData.length > 0 && (
                <div className={styles.statsContainer}>
                    <Text variant="body-1">Memory Samples: {performanceData.length}</Text>

                    <div className={styles.memoryGraph}>
                        {performanceData.map((data, index) => (
                            <div
                                key={index}
                                className={styles.graphBar}
                                style={{
                                    height: `${(data.usedJSHeapSize / data.jsHeapSizeLimit) * 100}%`,
                                    backgroundColor:
                                        data.usedJSHeapSize / data.jsHeapSizeLimit > 0.8
                                            ? 'var(--g-color-text-danger)'
                                            : 'var(--g-color-text-positive)',
                                }}
                                title={`${formatBytes(data.usedJSHeapSize)} at ${new Date(data.timestamp).toLocaleTimeString()}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {!latestData && !isMonitoring && (
                <div className={styles.emptyState}>
                    <Magnifier width={48} height={48} />
                    <Text variant="body-1">
                        Click &ldquo;Start Monitoring&quot; to begin tracking memory usage
                    </Text>
                </div>
            )}
        </Card>
    );
};

export default PerformanceMonitor;

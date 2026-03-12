// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportWebVitalsCallback = (metric: any) => void;

export const reportWebVitals = (onPerfEntry?: ReportWebVitalsCallback) => {
    if (onPerfEntry && typeof onPerfEntry === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        import('web-vitals').then((vitals: any) => {
            vitals.getCLS(onPerfEntry);
            vitals.getFID(onPerfEntry);
            vitals.getFCP(onPerfEntry);
            vitals.getLCP(onPerfEntry);
            vitals.getTTFB(onPerfEntry);
        });
    }
};

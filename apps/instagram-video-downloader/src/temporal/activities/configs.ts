import {downloadVideo} from './download.activity';
// import {createInstagramContainer, publishInstagramPost} from './instagram.activity';
import {processVideo} from './process.activity';

// Retry policy configurations based on operation types
export const ACTIVITY_RETRY_POLICIES = {
    // I/O operations (download, upload) - network can be flaky
    download: {
        maximumAttempts: 5,
        initialInterval: '10s',
        maximumInterval: '60s',
        backoffCoefficient: 2,
    },

    // File processing operations - can fail due to resource constraints
    process: {
        maximumAttempts: 3,
        initialInterval: '30s',
        maximumInterval: '300s',
        backoffCoefficient: 2,
    },

    // API calls to external services (Instagram) - rate limits and temporary failures
    instagram: {
        maximumAttempts: 4,
        initialInterval: '15s',
        maximumInterval: '120s',
        backoffCoefficient: 1.5,
    },

    // Default retry policy for any other activities
    default: {
        maximumAttempts: 3,
        initialInterval: '5s',
        maximumInterval: '60s',
        backoffCoefficient: 2,
    },
};

// Activity timeout configurations
export const ACTIVITY_TIMEOUTS = {
    download: {
        startToCloseTimeout: '300s', // 5 minutes for downloading
        scheduleToStartTimeout: '60s',
        scheduleToCloseTimeout: '360s',
        heartbeatTimeout: '30s',
    },

    process: {
        startToCloseTimeout: '1800s', // 30 minutes for video processing
        scheduleToStartTimeout: '60s',
        scheduleToCloseTimeout: '1860s',
        heartbeatTimeout: '60s', // Longer heartbeat for ffmpeg operations
    },

    instagram: {
        startToCloseTimeout: '900s', // 15 minutes (includes polling)
        scheduleToStartTimeout: '60s',
        scheduleToCloseTimeout: '960s',
        heartbeatTimeout: '30s',
    },

    default: {
        startToCloseTimeout: '300s',
        scheduleToStartTimeout: '60s',
        scheduleToCloseTimeout: '360s',
        heartbeatTimeout: '30s',
    },
};

// Activity registration helper for Worker
export const ALL_ACTIVITIES = {
    downloadVideo,
    processVideo,
    // createInstagramContainer,
    // publishInstagramPost,
};

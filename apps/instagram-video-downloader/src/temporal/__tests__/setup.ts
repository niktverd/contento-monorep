// Temporal Test Setup
// This file is executed before each test suite to set up common mocks and configurations

import {jest} from '@jest/globals';

// Mock Firebase Storage
jest.mock('#config/firebase', () => ({
    storage: {
        ref: jest.fn(),
        getDownloadURL: jest.fn(),
        uploadBytes: jest.fn(),
    },
}));

// Mock logging to avoid noise in tests
jest.mock('#src/utils/logging', () => ({
    log: jest.fn(),
    logError: jest.fn(),
}));

// Mock ThrownError to avoid logError issues
jest.mock('#src/utils/error', () => ({
    ThrownError: class ThrownError extends Error {
        code: number;
        constructor(message: string, code = 500) {
            super(message);
            this.code = code;
            this.name = 'ThrownError';
        }
    },
}));

// Mock fetch for network calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Setup environment variables for tests
process.env.TEMPORAL_ADDRESS = 'localhost:7233';
process.env.TEMPORAL_NAMESPACE = 'default';
process.env.TEMPORAL_TASK_QUEUE = 'test-video-processing';

// Increase timeout for all tests
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
});

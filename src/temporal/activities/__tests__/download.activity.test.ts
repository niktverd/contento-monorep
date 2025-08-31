// Download Activity Unit Tests
import {getDownloadURL, ref, uploadBytes} from 'firebase/storage';

import {downloadVideo} from '../download.activity';

import {storage} from '#config/firebase';
import {DownloadVideoActivityArgs} from '#src/types/temporal';
import {log} from '#src/utils/logging';

// Mock dependencies
jest.mock('#config/firebase');
jest.mock('#src/db');
jest.mock('#src/utils/logging');
jest.mock('firebase/storage');

// Mock Temporal Context
const mockHeartbeat = jest.fn();
jest.mock('@temporalio/activity', () => ({
    Context: {
        current: () => ({
            heartbeat: mockHeartbeat,
        }),
    },
}));

// Mock database functions
const mockGetDb = jest.fn();
const mockGetOneSource = jest.fn();
const mockUpdateSource = jest.fn();

jest.mock('#src/db', () => ({
    getDb: mockGetDb,
    getOneSource: mockGetOneSource,
    updateSource: mockUpdateSource,
}));

describe('downloadVideo Activity', () => {
    const mockInput: DownloadVideoActivityArgs = {
        sourceId: 123,
        // accountId: 456,
        // scenarioId: 789,
    };

    const mockSource = {
        id: 123,
        firebaseUrl: null,
        duration: 30,
        sources: {
            instagramReel: {
                url: 'https://example.com/video.mp4',
            },
        },
        organizationId: 123,
    };

    const mockDb = {};

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks
        mockGetDb.mockReturnValue(mockDb);
        mockGetOneSource.mockResolvedValue({result: mockSource});
        mockUpdateSource.mockResolvedValue({result: mockSource});

        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
            headers: new Headers({'content-type': 'video/mp4'}),
        } as Response);

        (ref as jest.Mock).mockReturnValue('mock-ref');
        (uploadBytes as jest.Mock).mockResolvedValue({});
        (getDownloadURL as jest.Mock).mockResolvedValue('https://firebase.com/uploaded-video.mp4');
    });

    describe('successful download scenarios', () => {
        it('should successfully download and upload video when firebaseUrl not provided', async () => {
            const result = await downloadVideo(mockInput, {organizationId: 123});

            expect(result.success).toBe(true);
            expect(result.source.firebaseUrl).toBe('https://firebase.com/uploaded-video.mp4');
            expect(result.source.duration).toBeUndefined(); // Duration determined later

            // Verify sequence of calls
            expect(mockGetDb).toHaveBeenCalled();
            expect(mockGetOneSource).toHaveBeenCalledWith({id: 123}, mockDb);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://example.com/video.mp4',
                expect.objectContaining({method: 'GET'}),
            );
            expect(uploadBytes).toHaveBeenCalled();
            expect(getDownloadURL).toHaveBeenCalled();
        });

        it('should use provided firebaseUrl directly when available', async () => {
            const inputWithUrl = {
                ...mockInput,
                firebaseUrl: 'https://firebase.com/existing-video.mp4',
            };

            const result = await downloadVideo(inputWithUrl, {organizationId: 123});

            expect(result.success).toBe(true);
            expect(result.source.firebaseUrl).toBe('https://firebase.com/existing-video.mp4');

            // Should not fetch source or download
            expect(mockGetOneSource).not.toHaveBeenCalled();
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should use existing firebaseUrl from source when available', async () => {
            const sourceWithUrl = {
                ...mockSource,
                firebaseUrl: 'https://firebase.com/source-video.mp4',
            };
            mockGetOneSource.mockResolvedValue({result: sourceWithUrl});

            const result = await downloadVideo(mockInput, {organizationId: 123});

            expect(result.success).toBe(true);
            expect(result.source.firebaseUrl).toBe('https://firebase.com/source-video.mp4');
            expect(result.source.duration).toBe(30);

            // Should not download
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should send heartbeats during long operations', async () => {
            await downloadVideo(mockInput, {organizationId: 123});

            expect(mockHeartbeat).toHaveBeenCalledWith('Fetching source data');
            expect(mockHeartbeat).toHaveBeenCalledWith('Downloading video from source URL');
            expect(mockHeartbeat).toHaveBeenCalledWith(
                'Video has been uploaded to Firebase Storage.',
            );
            expect(mockHeartbeat).toHaveBeenCalledWith('Duration of video is gained.');
        });
    });

    // describe('error handling scenarios', () => {
    //     it('should handle source not found', async () => {
    //         mockGetOneSource.mockResolvedValue({result: null});

    //         const result = await downloadVideo(mockInput);

    //         expect(result.success).toBe(false);
    //         expect(result.source.error).toContain('Source with id 123 not found');
    //     });

    //     it('should handle missing video URL in source', async () => {
    //         const sourceWithoutUrl = {
    //             ...mockSource,
    //             sources: {},
    //         };
    //         mockGetOneSource.mockResolvedValue({result: sourceWithoutUrl});

    //         const result = await downloadVideo(mockInput);

    //         expect(result.success).toBe(false);
    //         expect(result.source.error).toContain('source.sources.instagramReel.url is empty');
    //     });

    //     it('should handle network errors during download', async () => {
    //         (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
    //             ok: false,
    //             status: 404,
    //             statusText: 'Not Found',
    //         } as Response);

    //         const result = await downloadVideo(mockInput);

    //         expect(result.success).toBe(false);
    //         expect(result.source.error).toContain('Failed to download video: 404 Not Found');
    //     });

    //     it('should handle Firebase upload errors', async () => {
    //         (uploadBytes as jest.Mock).mockRejectedValue(new Error('Upload failed'));

    //         const result = await downloadVideo(mockInput);

    //         expect(result.success).toBe(false);
    //         expect(result.error).toContain('Upload failed');
    //     });

    //     it('should handle fetch timeout', async () => {
    //         (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
    //             new Error('Request timeout'),
    //         );

    //         const result = await downloadVideo(mockInput);

    //         expect(result.success).toBe(false);
    //         expect(result.source.error).toContain('Request timeout');
    //     });
    // });

    describe('edge cases', () => {
        it('should handle missing content-type header', async () => {
            (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
                headers: new Headers({}),
            } as Response);

            const result = await downloadVideo(mockInput, {organizationId: 123});

            expect(result.success).toBe(true);
            expect(uploadBytes).toHaveBeenCalledWith(
                'mock-ref',
                expect.any(ArrayBuffer),
                {contentType: 'video/mp4'}, // Default content type
            );
        });

        it('should generate unique filename for upload', async () => {
            await downloadVideo(mockInput, {organizationId: 123});

            expect(ref).toHaveBeenCalledWith(
                storage,
                expect.stringMatching(/^temporal-download-123-456-789-.+\.mp4$/),
            );
        });
    });

    describe('logging verification', () => {
        it('should log key operations', async () => {
            await downloadVideo(mockInput, {organizationId: 123});

            expect(log).toHaveBeenCalledWith('Starting downloadVideo activity', {
                sourceId: 123,
                accountId: 456,
                scenarioId: 789,
                firebaseUrl: undefined,
            });

            expect(log).toHaveBeenCalledWith('Source found', expect.any(Object));
            expect(log).toHaveBeenCalledWith(
                'Downloading video from source URL',
                expect.any(Object),
            );
            expect(log).toHaveBeenCalledWith(
                'Video successfully downloaded and uploaded',
                expect.any(Object),
            );
        });

        it('should log errors appropriately', async () => {
            mockGetOneSource.mockResolvedValue({result: null});

            await downloadVideo(mockInput, {organizationId: 123});

            expect(log).toHaveBeenCalledWith(
                'Error in downloadVideo activity',
                expect.objectContaining({
                    error: expect.any(Object),
                    sourceId: 123,
                    accountId: 456,
                    scenarioId: 789,
                }),
            );
        });
    });
});

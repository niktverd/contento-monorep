/* eslint-disable @typescript-eslint/no-explicit-any */
import {firebaseAuth} from '../configs/firebase';

import {getHeaders} from './fetchHelpers';

// Mock firebase auth
jest.mock('../configs/firebase', () => ({
    firebaseAuth: {
        currentUser: null,
    },
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('fetchHelpers', () => {
    beforeEach(() => {
        localStorageMock.clear();
        jest.clearAllMocks();
        // Reset firebase auth mock
        (firebaseAuth as any).currentUser = null;
    });

    describe('getHeaders', () => {
        it('should return basic headers without organization when no organization is set', async () => {
            const headers = await getHeaders();

            expect(headers).toEqual({
                'Content-Type': 'application/json',
                'x-user-token': '',
                Authorization: 'Bearer null',
            });
            expect(localStorageMock.getItem).toHaveBeenCalledWith('organizationId');
        });

        it('should include organization header when organization is set in localStorage', async () => {
            localStorageMock.getItem.mockImplementation((key: string) => {
                if (key === 'organizationId') return '123';
                return null;
            });

            const headers = await getHeaders();

            expect(headers).toEqual({
                'Content-Type': 'application/json',
                'x-user-token': '',
                'x-organization-id': '123',
                Authorization: 'Bearer null',
            });
        });

        it('should not include organization header when organizationId is empty string', async () => {
            localStorageMock.getItem.mockImplementation((key: string) => {
                if (key === 'organizationId') return '';
                return null;
            });

            const headers = await getHeaders();

            expect(headers).toEqual({
                'Content-Type': 'application/json',
                'x-user-token': '',
                Authorization: 'Bearer null',
            });
            expect(headers['x-organization-id']).toBeUndefined();
        });

        it('should handle user authentication when user is logged in', async () => {
            const mockUser = {
                uid: 'test-user-id',
                getIdToken: jest.fn().mockResolvedValue('test-token'),
            };
            (firebaseAuth as any).currentUser = mockUser;

            const headers = await getHeaders();

            expect(headers).toEqual({
                'Content-Type': 'application/json',
                'x-user-token': 'dGVzdC11c2VyLWlk', // base64 encoded 'test-user-id'
                Authorization: 'Bearer test-token',
            });
        });

        it('should handle user authentication with organization', async () => {
            const mockUser = {
                uid: 'test-user-id',
                getIdToken: jest.fn().mockResolvedValue('test-token'),
            };
            (firebaseAuth as any).currentUser = mockUser;
            localStorageMock.getItem.mockImplementation((key: string) => {
                if (key === 'organizationId') return '456';
                return null;
            });

            const headers = await getHeaders();

            expect(headers).toEqual({
                'Content-Type': 'application/json',
                'x-user-token': 'dGVzdC11c2VyLWlk',
                'x-organization-id': '456',
                Authorization: 'Bearer test-token',
            });
        });

        it('should handle token refresh errors gracefully', async () => {
            const mockUser = {
                uid: 'test-user-id',
                getIdToken: jest.fn().mockRejectedValue(new Error('Token refresh failed')),
            };
            (firebaseAuth as any).currentUser = mockUser;

            const headers = await getHeaders();

            expect(headers).toEqual({
                'Content-Type': 'application/json',
                'x-user-token': 'dGVzdC11c2VyLWlk',
                Authorization: 'Bearer null',
            });
        });
    });
});

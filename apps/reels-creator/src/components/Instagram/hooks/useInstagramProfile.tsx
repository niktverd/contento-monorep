import React from 'react';

import type {InstagramContent, InstagramProfile, MediaItem} from '../types';

interface UseInstagramProfileResult {
    hasToken: boolean;
    storedToken: string;
    instagramProfile: InstagramProfile | null;
    instagramContent: InstagramContent | null;
    loading: boolean;
    mediaLoading: boolean;
    errorMessage: string;
    checkInstagramToken: () => Promise<void>;
    fetchInstagramMedia: () => Promise<void>;
    setErrorMessage: (message: string) => void;
    setHasToken: (value: boolean) => void;
    setStoredToken: (value: string) => void;
    setInstagramProfile: (value: InstagramProfile | null) => void;
    setInstagramContent: (value: InstagramContent | null) => void;
}

export const useInstagramProfile = (): UseInstagramProfileResult => {
    const [storedToken, setStoredToken] = React.useState('');
    const [hasToken, setHasToken] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [mediaLoading, setMediaLoading] = React.useState(false);
    const [instagramProfile, setInstagramProfile] = React.useState<InstagramProfile | null>(null);
    const [instagramContent, setInstagramContent] = React.useState<InstagramContent | null>(null);

    const checkInstagramToken = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/user/instagram-token');
            const data = await response.json();
            if (data.ok && data.instagramToken) {
                setHasToken(true);
                setStoredToken(data.instagramToken);

                // Get profile data if token exists
                try {
                    const profileResponse = await fetch('/api/user/instagram-profile');
                    const profileData = await profileResponse.json();
                    if (profileData.ok && profileData.profile) {
                        setInstagramProfile(profileData.profile);
                    }
                } catch (profileError) {
                    // eslint-disable-next-line no-console
                    console.error('Error fetching Instagram profile:', profileError);
                }
            } else {
                setHasToken(false);
                setStoredToken('');
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error checking Instagram token:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchInstagramMedia = React.useCallback(async () => {
        if (!hasToken) return;
        try {
            setMediaLoading(true);
            const response = await fetch(`/api/instagram/media?accessToken=${storedToken}`);
            if (!response.ok) {
                throw new Error('Failed to fetch Instagram media');
            }
            const contentData = await response.json();

            // Add timestamps to media items if they don't already have them
            if (contentData && contentData.media && Array.isArray(contentData.media)) {
                contentData.media = contentData.media.map((item: MediaItem) => {
                    if (!item.timestamp) {
                        // Generate a random date within the last 30 days
                        const now = new Date();
                        const randomDaysAgo = Math.floor(Math.random() * 30);
                        const randomDate = new Date(
                            now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000,
                        );
                        return {
                            ...item,
                            timestamp: randomDate.toISOString(),
                        };
                    }
                    return item;
                });
            }

            setInstagramContent(contentData);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error fetching Instagram media:', error);
            setErrorMessage('Failed to load Instagram media.');
        } finally {
            setMediaLoading(false);
        }
    }, [hasToken, storedToken]);

    React.useEffect(() => {
        checkInstagramToken();
    }, [checkInstagramToken]);

    React.useEffect(() => {
        if (hasToken && storedToken) {
            fetchInstagramMedia();
        }
    }, [hasToken, storedToken, fetchInstagramMedia]);

    return {
        hasToken,
        storedToken,
        instagramProfile,
        instagramContent,
        loading,
        mediaLoading,
        errorMessage,
        checkInstagramToken,
        fetchInstagramMedia,
        setErrorMessage,
        setHasToken,
        setStoredToken,
        setInstagramProfile,
        setInstagramContent,
    };
};

import React from 'react';

export const useFavorites = () => {
    const [favorites, setFavorites] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Fetch favorites from the API
    const fetchFavorites = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/user/favorites');
            const data = await response.json();

            if (data.ok) {
                setFavorites(data.favorites || []);
            } else {
                setError(data.message || 'Failed to fetch favorites');
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error fetching favorites:', err);
            setError('An error occurred while fetching favorites');
        } finally {
            setLoading(false);
        }
    }, []);

    // Toggle a media item as favorite
    const toggleFavorite = React.useCallback(
        async (mediaId: string) => {
            const isFavorite = favorites.includes(mediaId);
            const action = isFavorite ? 'remove' : 'add';

            try {
                const response = await fetch('/api/user/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        mediaId,
                        action,
                    }),
                });

                const data = await response.json();

                if (data.ok) {
                    if (action === 'add') {
                        setFavorites((prev) => [...prev, mediaId]);
                    } else {
                        setFavorites((prev) => prev.filter((id) => id !== mediaId));
                    }
                } else {
                    setError(data.message || `Failed to ${action} favorite`);
                }

                return data.ok;
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(`Error ${action}ing favorite:`, err);
                setError(`An error occurred while ${action}ing favorite`);
                return false;
            }
        },
        [favorites],
    );

    // Check if a media item is a favorite
    const isFavorite = React.useCallback(
        (mediaId: string) => {
            return favorites.includes(mediaId);
        },
        [favorites],
    );

    // Load favorites when component mounts
    React.useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    return {
        favorites,
        loading,
        error,
        toggleFavorite,
        isFavorite,
        fetchFavorites,
    };
};

export default useFavorites;

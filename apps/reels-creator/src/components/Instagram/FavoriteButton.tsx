import React from 'react';

import useFavorites from './hooks/useFavorites';

import styles from '../../../styles/Account.module.css';

interface FavoriteButtonProps {
    mediaId: string;
}

export const FavoriteButton = ({mediaId}: FavoriteButtonProps) => {
    const {isFavorite, toggleFavorite} = useFavorites();
    const [isLoading, setIsLoading] = React.useState(false);

    const favorite = isFavorite(mediaId);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsLoading(true);
        await toggleFavorite(mediaId);
        setIsLoading(false);
    };

    return (
        <button
            className={`${styles.favoriteButton} ${favorite ? styles.favoriteActive : ''}`}
            onClick={handleToggleFavorite}
            disabled={isLoading}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            {isLoading ? (
                <span className={styles.loadingIndicator}>...</span>
            ) : (
                <span>{favorite ? '★' : '☆'}</span>
            )}
        </button>
    );
};

export default FavoriteButton;

import React from 'react';

import {Box, Tab, Tabs, Typography} from '@material-ui/core';

import {EmptyState} from './EmptyState';
import {LoadingState} from './LoadingState';
import {MediaGridItem} from './MediaGridItem';
import useFavorites from './hooks/useFavorites';
import type {MediaItem} from './types';

import styles from '../../../styles/Account.module.css';

interface InstagramMediaGridProps {
    media: MediaItem[];
    loading: boolean;
    onRefresh: () => void;
}

export const InstagramMediaGrid = ({media, loading, onRefresh}: InstagramMediaGridProps) => {
    const [tabValue, setTabValue] = React.useState(0);
    const {isFavorite} = useFavorites();

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
    };

    if (loading) {
        return <LoadingState />;
    }

    if (!media || media.length === 0) {
        return <EmptyState onRefresh={onRefresh} loading={loading} />;
    }

    const filteredMedia = tabValue === 0 ? media : media.filter((item) => isFavorite(item.id));
    const showEmptyFavorites = tabValue === 1 && filteredMedia.length === 0;

    return (
        <div style={{marginTop: 30}}>
            <Typography variant="h5" gutterBottom>
                Instagram Media
            </Typography>

            <Box mb={2}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="All Media" />
                    <Tab label="Favorites" />
                </Tabs>
            </Box>

            {showEmptyFavorites ? (
                <Typography variant="body1">You haven&apos;t favorited any media yet.</Typography>
            ) : (
                <div className={styles.mediaGrid}>
                    {filteredMedia.map((item: MediaItem) => (
                        <MediaGridItem key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
};

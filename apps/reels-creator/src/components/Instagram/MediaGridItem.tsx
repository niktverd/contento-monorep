import React from 'react';

import {FavoriteButton} from './FavoriteButton';
import {MediaCaption} from './MediaCaption';
import {MediaDate} from './MediaDate';
import {MediaStats} from './MediaStats';
import {MediaType} from './MediaType';
import {MediaVideo} from './MediaVideo';
import type {MediaItem} from './types';

import styles from '../../../styles/Account.module.css';

interface MediaGridItemProps {
    item: MediaItem;
}

export const MediaGridItem = ({item}: MediaGridItemProps) => {
    return (
        <div className={styles.mediaItem}>
            <div className={styles.mediaContent}>
                {item.media_type === 'VIDEO' && item.media_url ? (
                    <MediaVideo item={item} />
                ) : (
                    <img src={item.thumbnail_url} alt={item.caption || 'Instagram media'} />
                )}
            </div>
            <div className={styles.mediaDetails}>
                <div className={styles.favoriteRow}>
                    <MediaType mediaType={item.media_type} />
                    <FavoriteButton mediaId={item.id} />
                </div>
                <MediaCaption caption={item.caption} />
                <MediaDate timestamp={item.timestamp} />
                <MediaStats
                    likes={item.likes}
                    likeCount={item.like_count}
                    commentsCount={item.comments_count}
                    reach={item.reach}
                />
            </div>
        </div>
    );
};

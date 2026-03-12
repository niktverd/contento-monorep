import React from 'react';

import styles from '../../../styles/Account.module.css';

interface MediaTypeProps {
    mediaType?: string;
}

export const MediaType = ({mediaType}: MediaTypeProps) => {
    if (!mediaType) return null;

    return (
        <div className={styles.mediaType}>
            {(() => {
                switch (mediaType) {
                    case 'IMAGE':
                        return 'Photo';
                    case 'VIDEO':
                        return 'Video';
                    case 'CAROUSEL_ALBUM':
                        return 'Album';
                    default:
                        return mediaType;
                }
            })()}
        </div>
    );
};

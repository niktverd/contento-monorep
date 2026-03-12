import React from 'react';

import styles from '../../../styles/Account.module.css';

interface MediaStatsProps {
    likes?: number;
    likeCount?: number;
    commentsCount?: number;
    reach?: number;
}

export const MediaStats = ({likes, likeCount, commentsCount, reach}: MediaStatsProps) => {
    if (!(likes || likeCount || commentsCount || reach)) {
        return null;
    }

    const displayLikeCount = likes || likeCount || 0;

    return (
        <div className={styles.mediaStats}>
            {displayLikeCount > 0 && <span>❤️ {displayLikeCount}</span>}
            {commentsCount && commentsCount > 0 && <span>💬 {commentsCount}</span>}
            {reach && <span>👁️ {reach}</span>}
        </div>
    );
};

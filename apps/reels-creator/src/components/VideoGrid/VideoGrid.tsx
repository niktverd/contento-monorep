import React from 'react';

import Masonry from 'react-masonry-css';

import type {VideoType} from '../../types/video';
import {Video} from '../Video/Video';

import styles from './VideoGrid.module.css';

type VideoGridProps = {
    videos: VideoType[];
    hasInstagramToken?: boolean;
};

const breakpointColumnsObj = {
    default: 7,
    1100: 5,
    700: 3,
    500: 2,
};

export const VideoGrid = ({videos, hasInstagramToken = false}: VideoGridProps) => {
    return (
        <Masonry
            breakpointCols={breakpointColumnsObj}
            className={styles['my-masonry-grid']}
            columnClassName={styles['my-masonry-grid_column']}
        >
            {videos.map((item) => (
                <div key={item.url} className={styles['masonry-item']}>
                    <Video video={item} hasInstagramToken={hasInstagramToken} />
                </div>
            ))}
        </Masonry>
    );
};

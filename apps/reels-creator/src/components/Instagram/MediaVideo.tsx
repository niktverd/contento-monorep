import React from 'react';

import type {MediaItem} from './types';

import styles from '../../../styles/Account.module.css';

interface MediaVideoProps {
    item: MediaItem;
}

export const MediaVideo = ({item}: MediaVideoProps) => {
    const [videoPlaying, setVideoPlaying] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const toggleVideo = () => {
        if (videoPlaying) {
            setVideoPlaying(false);
        } else {
            setIsLoading(true);
            setVideoPlaying(true);
        }
    };

    const handleVideoLoaded = () => {
        setIsLoading(false);
        if (videoRef.current) {
            videoRef.current.play().catch(() => {
                // Handle autoplay rejection
                setIsLoading(false);
            });
        }
    };

    return (
        <div className={styles.videoContainer}>
            {!videoPlaying && (
                <div
                    className={styles.videoThumbnailContainer}
                    onClick={toggleVideo}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            toggleVideo();
                        }
                    }}
                    role="button"
                    tabIndex={0}
                >
                    <img
                        src={item.thumbnail_url}
                        alt={item.caption || 'Instagram video thumbnail'}
                        className={styles.videoThumbnail}
                    />
                    <button className={styles.playButton} aria-label="Play video">
                        ▶️
                    </button>
                </div>
            )}
            {videoPlaying && (
                <React.Fragment>
                    {isLoading && <div className={styles.videoLoading}>Loading...</div>}
                    <video
                        ref={videoRef}
                        src={item.media_url}
                        controls
                        className={styles.videoPlayer}
                        onLoadedData={handleVideoLoaded}
                        onEnded={() => setVideoPlaying(false)}
                    >
                        <track kind="captions" src="" label="English" />
                    </video>
                </React.Fragment>
            )}
        </div>
    );
};

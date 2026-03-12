/* eslint-disable no-console */
// eslint-disable-next-line no-restricted-syntax
import React, {useState} from 'react';

import type {VideoType} from '../../types/video';
import {useToast} from '../Toast/ToastContainer';

import {InstagramPublishDialog} from './InstagramPublishDialog';

import styles from './Video.module.css';

type VideoProps = {
    video: VideoType;
    hasInstagramToken?: boolean;
};

export const Video = ({video, hasInstagramToken = false}: VideoProps) => {
    const [isPublishing, setIsPublishing] = useState(false);
    const [published, setPublished] = useState(Boolean(video.publishedToInstagram));
    const [showDialog, setShowDialog] = useState(false);
    const {showToast} = useToast();

    const handlePublishToInstagram = async (caption: string) => {
        if (!hasInstagramToken || !video.id) return;

        try {
            setIsPublishing(true);
            const response = await fetch('/api/user/publish-to-instagram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoUrl: video.url,
                    videoId: video.id,
                    caption,
                }),
            });

            const result = await response.json();

            if (result.success || result.status === 'pending') {
                setPublished(true);
                showToast(result.message || 'Successfully published to Instagram!', 'success');
            } else {
                showToast(`Failed to publish: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error publishing to Instagram:', error);
            showToast('An error occurred while publishing to Instagram', 'error');
        } finally {
            setIsPublishing(false);
            setShowDialog(false);
        }
    };

    const handleDialogOpen = () => {
        setShowDialog(true);
    };

    const handleDialogClose = () => {
        setShowDialog(false);
    };

    return (
        <div className={styles.container}>
            <video width="100%" height="100%" controls={true} src={video.url} loop={true}>
                <track kind="captions" label={video.name} src={video.url} />
            </video>

            {hasInstagramToken && !published && (
                <button
                    className={styles.instagramButton}
                    onClick={handleDialogOpen}
                    disabled={isPublishing}
                >
                    {isPublishing ? 'Publishing...' : 'Publish to Instagram'}
                </button>
            )}

            {published && <div className={styles.publishedBadge}>Published to Instagram</div>}

            {showDialog && (
                <InstagramPublishDialog
                    video={video}
                    onPublish={handlePublishToInstagram}
                    onCancel={handleDialogClose}
                    isPublishing={isPublishing}
                />
            )}
        </div>
    );
};

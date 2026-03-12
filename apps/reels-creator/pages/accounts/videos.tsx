/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import {Button, CircularProgress} from '@material-ui/core';
import {Add, Refresh} from '@material-ui/icons';
import {useRouter} from 'next/router';

import {AccountLayout} from '../../src/components/AccountLayout/AccountLayout';
import {VideoGrid} from '../../src/components/VideoGrid/VideoGrid';
import type {VideoType} from '../../src/types/video';

import styles from '../../styles/Account.module.css';

const VideosPage = () => {
    const router = useRouter();
    const [videos, setVideos] = React.useState<VideoType[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [hasInstagramToken, setHasInstagramToken] = React.useState(false);

    const loadVideos = React.useCallback(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/user/list');
                const json = await response.json();
                setVideos(
                    json.data
                        .sort((a: {createdAt: any}, b: {createdAt: any}) => {
                            return b.createdAt?.seconds || 0 - a.createdAt?.seconds || 0;
                        })
                        .map((video: any) => ({
                            ...video,
                            id: video.id || video.name,
                        })),
                );
            } catch (error) {
                console.error('Error loading videos:', error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const checkInstagramToken = React.useCallback(async () => {
        try {
            const response = await fetch('/api/user/instagram-token');
            const data = await response.json();
            if (data.ok && data.instagramToken) {
                setHasInstagramToken(true);
            } else {
                setHasInstagramToken(false);
            }
        } catch (error) {
            console.error('Error checking Instagram token:', error);
            setHasInstagramToken(false);
        }
    }, []);

    const handleCreateNewVideo = () => {
        router.push('/app');
    };

    React.useEffect(() => {
        loadVideos();
        checkInstagramToken();
    }, [loadVideos, checkInstagramToken]);

    return (
        <AccountLayout>
            <div className={styles.headerContainer}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={handleCreateNewVideo}
                >
                    Create New Video
                </Button>
                <div className={styles.refreshContainer}>
                    <div className={styles.refreshText}>
                        Video generation can take time. Please be patient and refresh page in a few
                        minutes
                    </div>
                    <button className={styles.refreshButton} onClick={loadVideos}>
                        <Refresh />
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{textAlign: 'center', padding: '50px 0'}}>
                    <CircularProgress />
                </div>
            ) : (
                <VideoGrid videos={videos} hasInstagramToken={hasInstagramToken} />
            )}
        </AccountLayout>
    );
};

export default VideosPage;

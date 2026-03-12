/* eslint-disable import/no-extraneous-dependencies */
import React, {useCallback, useContext} from 'react';

import {Button, useToaster} from '@gravity-ui/uikit';

import {AppEnvContext} from '../../contexts/AppEnv';
import {MediaPostModel} from '../../types';
import {FetchRoutes2} from '../../utils/constants';
import {fetchPost} from '../../utils/fetchHelpers';

import cn from './MediaPostCard.module.css';

const actionAllowed = import.meta.env.VITE_ACTION_ALLOWED;

export const MediaPostCard = (props: MediaPostModel) => {
    const {sources, id} = props;
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);

    const handleSplit = useCallback(async () => {
        try {
            const json = await fetchPost({
                route: FetchRoutes2.splitVideoInTheMiddle,
                // query: {limit, lastDocumnetId, orderByField, orderDirection},
                body: {id},
                isProd,
            });

            if (json.status === 'ok') {
                add({
                    name: id + '-split',
                    title: 'Split is started',
                });
            } else {
                throw new Error('Split problem is on server');
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log(error);
            add({
                name: id + '-split-error',
                title: 'Split errro. Look at console',
                theme: 'danger',
            });
        }
    }, [add, id, isProd]);
    const handleTestGreen = useCallback(async () => {
        try {
            const json = await fetchPost({
                route: FetchRoutes2.testGreenScreen,
                // query: {limit, lastDocumnetId, orderByField, orderDirection},
                body: {id},
                isProd,
            });

            if (json.status === 'ok') {
                add({
                    name: id + '-split',
                    title: 'Test Green is started',
                });
            } else {
                throw new Error('Test Green problem is on server');
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log(error);
            add({
                name: id + '-split-error',
                title: 'Test green errro. Look at console',
                theme: 'danger',
            });
        }
    }, [add, id, isProd]);

    // Check if sources is available
    const hasInstagramReel = sources?.instagramReel !== undefined;
    const hasYoutubeShort = sources?.youtubeShort !== undefined;

    // Function to render the appropriate video source
    const renderVideoSource = () => {
        if (hasInstagramReel) {
            return <video className={cn.video} src={sources.instagramReel.url} controls={true} />;
        } else if (hasYoutubeShort) {
            return <video className={cn.video} src={sources.youtubeShort.url} controls={true} />;
        }
        return <div className={cn.noVideo}>No video source available</div>;
    };

    return (
        <div className={cn.container}>
            <div className={cn.sourceContainer}>
                <div className={cn.videoContainer}>{renderVideoSource()}</div>
                <div className={cn.users}>
                    <h2>users</h2>
                    <div className={cn.senderContainer}>
                        <h3>sender</h3>
                        {hasInstagramReel ? (
                            <>
                                senderId: {sources.instagramReel.senderId}
                                <br />
                                <br />
                                no data available about message sender, before app verification is
                                incomplete. we can only answer to him with thanks-message by id
                            </>
                        ) : (
                            <span>No sender information available</span>
                        )}
                    </div>
                    <div className={cn.ownerContainer}>
                        <h3>owner</h3>
                        {hasInstagramReel ? (
                            <>
                                no data available about author of the video, before app verification
                                is incomplete
                            </>
                        ) : (
                            <span>No owner information available</span>
                        )}
                    </div>
                </div>
                <div className={cn.data}>
                    <h2>video data</h2>
                    {hasInstagramReel && (
                        <>
                            <div className={cn.field}>
                                <strong>title: </strong>
                                {sources.instagramReel.title}
                            </div>
                            <div className={cn.field}>
                                <strong>hashtags: </strong>
                                {sources.instagramReel.originalHashtags?.join(' ') || 'No hashtags'}
                            </div>
                        </>
                    )}
                    {!hasInstagramReel && !hasYoutubeShort && (
                        <div className={cn.field}>
                            <strong>No video data available</strong>
                        </div>
                    )}
                    {actionAllowed ? (
                        <div className={cn.field}>
                            <h3>Actions</h3>
                            <Button onClick={handleSplit}>Split & Preproc</Button>
                            <Button onClick={handleTestGreen}>Test green</Button>
                        </div>
                    ) : null}
                </div>
                <div className={cn.sourceData}>
                    <h3>Source Data</h3>
                    <pre>{JSON.stringify(props.sources, null, 3)}</pre>
                </div>
            </div>
            <div>system data</div>
            {/* <pre>{JSON.stringify(props)}</pre> */}
        </div>
    );
};

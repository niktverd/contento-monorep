import React from 'react';

import {Card, CardContent, Typography} from '@material-ui/core';

import styles from '../../../styles/Account.module.css';

interface UserInfo {
    username: string;
    biography?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
    profile_picture_url?: string;
}

interface InstagramProfileProps {
    userInfo: UserInfo;
    userId: string;
    profilePicture?: string;
    fullName?: string;
}

export const InstagramProfile = ({
    userInfo,
    userId,
    profilePicture,
    fullName,
}: InstagramProfileProps) => {
    return (
        <Card>
            <CardContent>
                <div className={styles.instagramProfile}>
                    {userInfo?.profile_picture_url ? (
                        <img
                            src={userInfo.profile_picture_url}
                            alt={userInfo.username}
                            className={styles.profileAvatar}
                        />
                    ) : (
                        profilePicture && (
                            <img
                                src={profilePicture}
                                alt={userInfo.username}
                                className={styles.profileAvatar}
                            />
                        )
                    )}
                    <div className={styles.profileInfo}>
                        <Typography variant="h4">{userInfo?.username}</Typography>
                        <Typography variant="body1">
                            {userInfo?.biography || fullName || ''}
                        </Typography>
                        <div style={{marginTop: 10}}>
                            <Typography variant="body2">
                                <strong>Followers:</strong> {userInfo?.followers_count || 0}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Following:</strong> {userInfo?.follows_count || 0}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Posts:</strong> {userInfo?.media_count || 0}
                            </Typography>
                        </div>
                        <Typography variant="caption">User ID: {userId}</Typography>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import {Snackbar} from '@material-ui/core';
// import {useRouter} from 'next/router';

import {AccountLayout} from '../../src/components/AccountLayout/AccountLayout';
import {InstagramConnectButton} from '../../src/components/Instagram/InstagramConnectButton';
import {InstagramConnectDialog} from '../../src/components/Instagram/InstagramConnectDialog';
import {InstagramLoadingState} from '../../src/components/Instagram/InstagramLoadingState';
import {InstagramMediaGrid} from '../../src/components/Instagram/InstagramMediaGrid';
import {InstagramProfile} from '../../src/components/Instagram/InstagramProfile';
import {NoInstagramConnection} from '../../src/components/Instagram/NoInstagramConnection';
import {useErrorHandling} from '../../src/components/Instagram/hooks/useErrorHandling';
import {useInstagramConnection} from '../../src/components/Instagram/hooks/useInstagramConnection';
import {useInstagramProfile} from '../../src/components/Instagram/hooks/useInstagramProfile';

import styles from '../../styles/Account.module.css';

const InstagramPage = () => {
    // const router = useRouter();
    const {
        hasToken,
        storedToken,
        instagramProfile,
        instagramContent,
        loading,
        mediaLoading,
        fetchInstagramMedia,
        // setHasToken,
        // setStoredToken,
        setInstagramProfile,
        setInstagramContent,
    } = useInstagramProfile();

    const {errorMessage, snackbarOpen, setErrorMessage, setSnackbarOpen} = useErrorHandling();

    const setHasTokenFunc = (value: boolean) => {
        // Placeholder for the setHasToken function
        console.log('setHasToken called with', value);
    };

    const setStoredTokenFunc = (value: string) => {
        // Placeholder for the setStoredToken function
        console.log('setStoredToken called with', value);
    };

    const {
        dialogOpen,
        connecting,
        deleting,
        connectInstagram,
        handleOpenInstagramAuth,
        handleDeleteInstagramToken,
        handleCloseDialog,
        getMaskedToken,
    } = useInstagramConnection(
        storedToken,
        setHasTokenFunc,
        setStoredTokenFunc,
        setInstagramProfile,
        setInstagramContent,
        setErrorMessage,
        setSnackbarOpen,
    );

    if (loading) {
        return <InstagramLoadingState />;
    }

    return (
        <AccountLayout>
            <div className={styles.headerContainer}>
                <InstagramConnectButton hasToken={hasToken} onClick={connectInstagram} />
            </div>

            {hasToken && (instagramProfile || instagramContent) ? (
                <div>
                    <InstagramProfile
                        userInfo={instagramContent?.user_info || {username: ''}}
                        userId={instagramContent?.ig_user_id || instagramProfile?.id || ''}
                        profilePicture={instagramProfile?.profile_picture}
                        fullName={instagramProfile?.full_name}
                    />

                    <InstagramMediaGrid
                        media={instagramContent?.media || []}
                        loading={loading || mediaLoading}
                        onRefresh={fetchInstagramMedia}
                    />
                </div>
            ) : (
                <NoInstagramConnection />
            )}

            <InstagramConnectDialog
                open={dialogOpen}
                hasToken={hasToken}
                connecting={connecting}
                deleting={deleting}
                maskedToken={getMaskedToken()}
                onClose={handleCloseDialog}
                onConnect={handleOpenInstagramAuth}
                onDisconnect={handleDeleteInstagramToken}
            />

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={errorMessage}
            />
        </AccountLayout>
    );
};

export default InstagramPage;

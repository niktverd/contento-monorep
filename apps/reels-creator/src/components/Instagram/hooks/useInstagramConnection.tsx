import React from 'react';

import type {InstagramContent, InstagramProfile} from '../types';

interface UseInstagramConnectionResult {
    dialogOpen: boolean;
    connecting: boolean;
    deleting: boolean;
    connectInstagram: () => void;
    handleOpenInstagramAuth: () => void;
    handleDeleteInstagramToken: () => Promise<void>;
    handleCloseDialog: () => void;
    getMaskedToken: () => string;
}

export const useInstagramConnection = (
    storedToken: string,
    setHasToken: (value: boolean) => void,
    setStoredToken: (value: string) => void,
    setInstagramProfile: (value: InstagramProfile | null) => void,
    setInstagramContent: (value: InstagramContent | null) => void,
    setErrorMessage: (value: string) => void,
    setSnackbarOpen: (value: boolean) => void,
): UseInstagramConnectionResult => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [connecting, setConnecting] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    const connectInstagram = () => {
        setDialogOpen(true);
    };

    const handleOpenInstagramAuth = () => {
        setConnecting(true);
        window.location.href = `${process.env.NEXT_PUBLIC_INSTAGRAM_INTEGRATION_BACKEND}/api/instagram/login?redirectionUri=${process.env.NEXT_PUBLIC_HOST}/api/user/connect-instagram`;
    };

    const handleDeleteInstagramToken = async () => {
        try {
            setDeleting(true);
            const response = await fetch('/api/user/instagram-token', {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.ok) {
                setHasToken(false);
                setStoredToken('');
                setInstagramProfile(null);
                setInstagramContent(null);
                setErrorMessage('Instagram account disconnected successfully.');
                setSnackbarOpen(true);
                setDialogOpen(false);
                if (window) {
                    window.location.reload();
                }
            } else {
                setErrorMessage('Failed to disconnect Instagram account.');
                setSnackbarOpen(true);
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error deleting Instagram token:', error);
            setErrorMessage('An error occurred while disconnecting Instagram.');
            setSnackbarOpen(true);
        } finally {
            setDeleting(false);
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        if (window) {
            window.location.reload();
        }
    };

    // Create a masked version of the token for display
    const getMaskedToken = () => {
        if (!storedToken) return '';
        const firstFive = storedToken.substring(0, 5);
        return `${firstFive}${'*'.repeat(20)}`;
    };

    return {
        dialogOpen,
        connecting,
        deleting,
        connectInstagram,
        handleOpenInstagramAuth,
        handleDeleteInstagramToken,
        handleCloseDialog,
        getMaskedToken,
    };
};

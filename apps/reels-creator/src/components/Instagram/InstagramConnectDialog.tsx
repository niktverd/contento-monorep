import React from 'react';

import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@material-ui/core';
import Link from 'next/link';

interface InstagramConnectDialogProps {
    open: boolean;
    hasToken: boolean;
    connecting: boolean;
    deleting: boolean;
    maskedToken: string;
    onClose: () => void;
    onConnect: () => void;
    onDisconnect: () => void;
}

export const InstagramConnectDialog = ({
    open,
    hasToken,
    connecting,
    deleting,
    maskedToken,
    onClose,
    onConnect,
    onDisconnect,
}: InstagramConnectDialogProps) => {
    const buttonText = hasToken ? 'Reconnect Now' : 'Connect Now';
    const buttonContent = connecting ? <CircularProgress size={24} /> : buttonText;
    const deleteButtonContent = deleting ? <CircularProgress size={24} /> : 'Disconnect Instagram';

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {hasToken ? 'Instagram Already Connected' : 'Connect Instagram Account'}
            </DialogTitle>
            <DialogContent>
                {hasToken ? (
                    <div style={{marginBottom: '20px'}}>
                        <p>Your Instagram account is already connected.</p>
                        <p>
                            Current token: <strong>{maskedToken}</strong>
                        </p>
                        <p>
                            If you want to update your token, you can click the button below to
                            reconnect.
                        </p>
                    </div>
                ) : (
                    <div style={{marginBottom: '20px'}}>
                        <p>
                            To connect your Instagram account, click the button below. You will be
                            redirected to:
                        </p>
                        <ol style={{marginLeft: '20px', lineHeight: '1.6'}}>
                            <li>Log in to your Instagram account</li>
                            <li>Authorize this application</li>
                            <li>
                                After authorization, you&apos;ll be redirected back automatically
                            </li>
                        </ol>
                    </div>
                )}

                {hasToken && (
                    <div style={{marginTop: '20px'}}>
                        <p>
                            <strong>Note:</strong> If you reconnect, your existing token will be
                            replaced.
                        </p>
                    </div>
                )}

                <div
                    style={{
                        marginTop: '20px',
                        fontSize: '0.9em',
                        borderTop: '1px solid #eee',
                        paddingTop: '10px',
                    }}
                >
                    <p>
                        By connecting your Instagram account, you agree to our data handling
                        practices. Learn how to delete your data on our{' '}
                        <Link href="/data-deletion" color="primary">
                            Data Deletion page
                        </Link>
                        .
                    </p>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                {hasToken && (
                    <Button
                        onClick={onDisconnect}
                        color="secondary"
                        disabled={deleting}
                        style={{marginRight: 'auto'}}
                    >
                        {deleteButtonContent}
                    </Button>
                )}
                <Button onClick={onConnect} color="primary" disabled={connecting}>
                    {buttonContent}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

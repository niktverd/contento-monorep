import React, {useState} from 'react';

import {Button, Modal, TextInput} from '@gravity-ui/uikit';

import {useAuth} from '../../contexts/AuthContext';

interface InstagramConnectProps {
    accountId?: string;
    token?: string;
    slug?: string;
}

export const InstagramConnect: React.FC<InstagramConnectProps> = ({accountId, token, slug}) => {
    const {currentUser} = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmSlug, setConfirmSlug] = useState('');
    const [error, setError] = useState('');

    const handleInstagramLogin = () => {
        // Base URL is current origin
        const origin = window.location.origin;

        // Create callback URL for Instagram auth to redirect back to
        // Add accountId directly to the URL path if available
        const redirectUrl = accountId
            ? `${origin}/instagram-callback/${accountId}`
            : `${origin}/instagram-callback`;

        // Instagram integration backend URL from environment variables
        const integrationBackend =
            import.meta.env.VITE_API_ENDPOINT_PREPROD || import.meta.env.VITE_API_ENDPOINT_PROD;

        // API endpoint that will handle the Instagram authorization
        const instagramAuthUrl = `${integrationBackend}/api/instagram/login?redirectionUri=${encodeURIComponent(redirectUrl)}`;

        // Redirect to the Instagram login flow
        window.location.href = instagramAuthUrl;
    };

    const handleConfirmReconnect = () => {
        if (!slug || confirmSlug !== slug) {
            setError('Please enter the correct account slug to confirm reconnection');
            return;
        }

        handleInstagramLogin();
        setIsModalOpen(false);
    };

    const handleButtonClick = () => {
        if (token) {
            // If token exists, open confirmation modal
            setIsModalOpen(true);
            setConfirmSlug('');
            setError('');
        } else {
            // Otherwise proceed with login
            handleInstagramLogin();
        }
    };

    return (
        <>
            <Button
                view={token ? 'flat' : 'action'}
                onClick={handleButtonClick}
                disabled={!currentUser}
            >
                {token ? 'IG Connected' : 'Connect Instagram Account'}
            </Button>

            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                aria-labelledby="reconnect-instagram-title"
            >
                <div style={{padding: '20px', maxWidth: '500px'}}>
                    <h3 id="reconnect-instagram-title">Reconnect Instagram Account</h3>

                    <p style={{marginBottom: '20px'}}>
                        This account is already connected to Instagram. Reconnecting will replace
                        the existing connection. To confirm, please enter the account slug below
                        (slug: <span style={{fontWeight: 'bold', color: '#d71'}}>{slug}</span>
                        ):
                    </p>

                    <TextInput
                        value={confirmSlug}
                        onChange={(e) => setConfirmSlug(e.target.value)}
                        placeholder="Enter account slug to confirm"
                        error={error}
                        style={{width: '100%', marginBottom: '20px'}}
                    />

                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                        <Button view="flat" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button view="action" onClick={handleConfirmReconnect}>
                            Reconnect Account
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

import React, {useContext, useState} from 'react';

import {Button, TextInput, useToaster} from '@gravity-ui/uikit';
import {useLocation, useNavigate, useParams} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {useAuth} from '../../contexts/AuthContext';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchPatch} from '../../utils/fetchHelpers';

export const InstagramCallback = () => {
    const {search} = useLocation();
    const params = new URLSearchParams(search);
    const token = params.get('token');
    const userId = params.get('userId');
    // Get accountId from URL params first, then from query params as fallback
    const {accountId: urlAccountId} = useParams<{accountId: string}>();
    const queryAccountId = params.get('accountId');
    const accountId = urlAccountId || queryAccountId;

    const navigate = useNavigate();
    const {add} = useToaster();
    const {currentUser} = useAuth();
    const {isProd} = useContext(AppEnvContext);
    const [isSaving, setIsSaving] = useState(false);
    const [savedToAccount, setSavedToAccount] = useState(false);

    if (!token) {
        return (
            <div style={{textAlign: 'center', padding: '2rem'}}>
                <h2>Instagram Authentication Error</h2>
                <p>Instagram token is missing or invalid</p>
                <Button view="action" onClick={() => navigate('/accounts')}>
                    Back to Accounts
                </Button>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div style={{textAlign: 'center', padding: '2rem'}}>
                <h2>Authentication Required</h2>
                <p>Please log in to connect your Instagram account</p>
                <Button view="action" onClick={() => navigate('/auth')}>
                    Go to Login
                </Button>
            </div>
        );
    }

    const handleSaveToken = async () => {
        setIsSaving(true);
        try {
            // If accountId exists, update the account with Instagram token
            if (accountId) {
                await fetchPatch({
                    route: fetchRoutes.accounts.update,
                    body: {
                        id: accountId,
                        token,
                        userIdIG: userId,
                    },
                    isProd,
                });
            }

            add({
                name: 'instagram-success',
                title: 'Instagram account connected successfully',
                theme: 'success',
            });

            setSavedToAccount(true);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Instagram connection error:', error);
            add({
                name: 'instagram-error',
                title: 'Failed to connect Instagram account',
                theme: 'danger',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{padding: '2rem', maxWidth: '600px', margin: '0 auto'}}>
            <h2>Instagram Authentication Successful</h2>

            <div
                style={{
                    margin: '24px 0',
                    padding: '12px',
                    borderRadius: '4px',
                }}
            >
                <h3>Instagram Token</h3>
                <TextInput value={token} disabled style={{width: '100%', marginTop: '8px'}} />

                {userId && (
                    <div style={{marginTop: '16px'}}>
                        <h3>Instagram User ID</h3>
                        <TextInput
                            value={userId}
                            disabled
                            style={{width: '100%', marginTop: '8px'}}
                        />
                    </div>
                )}

                {accountId && (
                    <div style={{marginTop: '16px'}}>
                        <h3>Account ID</h3>
                        <TextInput
                            value={accountId}
                            disabled
                            style={{width: '100%', marginTop: '8px'}}
                        />
                    </div>
                )}
            </div>

            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                {savedToAccount ? (
                    <Button view="outlined" onClick={() => navigate('/accounts')}>
                        Back to Accounts
                    </Button>
                ) : (
                    <Button
                        view="action"
                        onClick={handleSaveToken}
                        loading={isSaving}
                        disabled={isSaving}
                    >
                        Save Token to Account
                    </Button>
                )}

                <Button
                    view="flat"
                    onClick={() => {
                        navigator.clipboard.writeText(token);
                        add({
                            name: 'copy-success',
                            title: 'Token copied to clipboard',
                            theme: 'success',
                        });
                    }}
                >
                    Copy Token
                </Button>
            </div>

            {savedToAccount && (
                <div
                    style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#e6f7e6',
                        borderRadius: '4px',
                        color: '#2e7d32',
                    }}
                >
                    <p style={{margin: 0}}>Token successfully saved to your account!</p>
                </div>
            )}
        </div>
    );
};

import React from 'react';

import {Button} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {doSignOut} from '../../auth/utils';
import {useAuth} from '../../contexts/AuthContext';

export const AuthButton = () => {
    const {userLoggedIn} = useAuth();
    const navigate = useNavigate();

    return (
        <Button
            view={userLoggedIn ? 'normal' : 'action'}
            onClick={() => {
                if (userLoggedIn) {
                    doSignOut();
                } else {
                    navigate('/auth');
                }
            }}
        >
            {userLoggedIn ? 'Sign Out' : 'Sign In'}
        </Button>
    );
};

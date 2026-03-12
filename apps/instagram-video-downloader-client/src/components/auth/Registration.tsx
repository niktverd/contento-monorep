import React, {useState} from 'react';

import {Button, TextInput} from '@gravity-ui/uikit';
import {Link, Navigate, useNavigate} from 'react-router-dom';

import {doCreateUserWithEmailAndPassword} from '../../auth/utils';
import {useAuth} from '../../contexts/AuthContext';

import cl from './Auth.module.css';

export const Registration = () => {
    const _navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setconfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [errorMessage, _setErrorMessage] = useState('');

    const {userLoggedIn} = useAuth();

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!isRegistering) {
            setIsRegistering(true);
            await doCreateUserWithEmailAndPassword(email, password);
        }
    };

    return (
        <>
            <Navigate to="#registration" />
            {userLoggedIn && <Navigate to={'/'} replace={true} />}

            <main className={cl.main}>
                <h3 className={cl.title}>Create a New Account</h3>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className={cl.inputs}>
                        <TextInput
                            disabled={isRegistering}
                            size="xl"
                            label="Email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                            }}
                            autoComplete="email"
                            type="email"
                            hasClear
                        />

                        <TextInput
                            disabled={isRegistering}
                            size="xl"
                            label="Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }}
                            autoComplete="new-password"
                            type="password"
                            hasClear
                        />

                        <TextInput
                            disabled={isRegistering}
                            size="xl"
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setconfirmPassword(e.target.value);
                            }}
                            autoComplete="off"
                            type="password"
                            hasClear
                        />
                    </div>

                    {errorMessage && <span className="text-red-600 font-bold">{errorMessage}</span>}
                    <Button
                        type="submit"
                        disabled={isRegistering}
                        view="action"
                        className={cl.submit}
                        size="xl"
                    >
                        {isRegistering ? 'Signing Up...' : 'Sign Up'}
                    </Button>
                    <div className="text-sm text-center">
                        Already have an account? {'   '}
                        <Link
                            to={'/auth#login'}
                            className="text-center text-sm hover:underline font-bold"
                        >
                            Continue
                        </Link>
                    </div>
                </form>
            </main>
        </>
    );
};

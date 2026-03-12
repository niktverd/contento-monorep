import React, {useState} from 'react';

import {Button, ButtonIcon, TextInput} from '@gravity-ui/uikit';
import {Link, Navigate} from 'react-router-dom';

import {doSignInWithEmailAndPassword, doSignInWithGoogle} from '../../auth/utils';
import {useAuth} from '../../contexts/AuthContext';

import {GoogleLogo} from './google.logo';

import cl from './Auth.module.css';

export const Login = () => {
    const {userLoggedIn} = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!isSigningIn) {
            setIsSigningIn(true);
            await doSignInWithEmailAndPassword(email, password);
            // doSendEmailVerification()
        }
    };

    const onGoogleSignIn = (e) => {
        e.preventDefault();
        if (!isSigningIn) {
            setIsSigningIn(true);
            doSignInWithGoogle().catch((err) => {
                setIsSigningIn(false);
                setErrorMessage(err.message || 'An error occurred during Google sign-in');
            });
        }
    };

    return (
        <div>
            <Navigate to="#login" />
            {userLoggedIn && <Navigate to={'/'} replace={true} />}

            <main className={cl.main}>
                <h3 className={cl.title}>Welcome Back</h3>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className={cl.inputs}>
                        <TextInput
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
                            size="xl"
                            label="Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }}
                            autoComplete="current-password"
                            type="password"
                            hasClear
                        />
                    </div>

                    {errorMessage && <span className="text-red-600 font-bold">{errorMessage}</span>}

                    <Button
                        type="submit"
                        disabled={isSigningIn}
                        view="action"
                        className={cl.submit}
                        size="xl"
                    >
                        {isSigningIn ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>
                <p className="text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <Link to={'/auth#registration'} className="hover:underline font-bold">
                        Sign up
                    </Link>
                </p>
                <div className={cl.devider}>
                    <div className={cl.deviderWing}></div>
                    <div>OR</div>
                    <div className={cl.deviderWing}></div>
                </div>
                <Button
                    disabled={isSigningIn}
                    onClick={(e) => {
                        onGoogleSignIn(e);
                    }}
                    size="xl"
                    className={cl.googleButton}
                >
                    <ButtonIcon>
                        <GoogleLogo size={14} />
                    </ButtonIcon>
                    <div>{isSigningIn ? 'Signing In...' : 'Continue with Google'}</div>
                </Button>
            </main>
        </div>
    );
};

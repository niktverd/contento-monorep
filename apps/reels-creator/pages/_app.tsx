import React from 'react';

import type {AppProps} from 'next/app';
import {SessionProvider} from 'next-auth/react';

import {ToastProvider} from '../src/components/Toast/ToastContainer';
import {FormatProvider} from '../src/contexts/formatContext';

import '../styles/globals.css';

function MyApp({Component, pageProps}: AppProps) {
    return (
        <ToastProvider>
            <FormatProvider>
                <SessionProvider>
                    <Component {...pageProps} />
                </SessionProvider>
            </FormatProvider>
        </ToastProvider>
    );
}

export default MyApp;

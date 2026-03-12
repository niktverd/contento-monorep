/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';

import {ThemeProvider, Toaster, ToasterComponent, ToasterProvider} from '@gravity-ui/uikit';
import ReactDOM from 'react-dom/client';

import App from './App';
import {reportWebVitals} from './utils/reportWebVitals';

import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
// eslint-disable-next-line import/order
import './index.css';

// Add error handler to suppress ResizeObserver errors
const silenceResizeObserverErrors = () => {
    // Original error handler
    const originalHandler = window.onerror;

    // Override the error handler to filter out ResizeObserver loop errors
    window.onerror = (message, source, lineno, colno, error) => {
        // Check if the error is a ResizeObserver loop error
        if (message && typeof message === 'string' && message.includes('ResizeObserver loop')) {
            // Suppress the error
            return true;
        }

        // Call the original handler for other errors
        if (typeof originalHandler === 'function') {
            return originalHandler(message, source, lineno, colno, error);
        }

        // Return false to let the error propagate
        return false;
    };
};

// Call the function to set up the error handler
silenceResizeObserverErrors();

export const toaster = new Toaster();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <ThemeProvider theme="dark">
        <React.StrictMode>
            <ToasterProvider toaster={toaster}>
                <App />
                <ToasterComponent />
            </ToasterProvider>
        </React.StrictMode>
    </ThemeProvider>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
reportWebVitals(); // Вызываем без аргумента или с функцией-обработчиком

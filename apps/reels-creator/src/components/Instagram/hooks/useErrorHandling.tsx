import React from 'react';

import {useRouter} from 'next/router';

interface UseErrorHandlingResult {
    errorMessage: string;
    snackbarOpen: boolean;
    setErrorMessage: (message: string) => void;
    setSnackbarOpen: (open: boolean) => void;
}

export const useErrorHandling = (): UseErrorHandlingResult => {
    const router = useRouter();
    const [errorMessage, setErrorMessage] = React.useState('');
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);

    // Check for error parameters in URL
    React.useEffect(() => {
        const {error} = router.query;
        if (error) {
            let message = '';
            switch (error) {
                case 'auth_failed':
                    message = 'Authentication failed. Please try again.';
                    break;
                case 'connection_failed':
                    message = 'Failed to connect Instagram. Please try again.';
                    break;
                default:
                    message = 'An error occurred during Instagram connection.';
            }
            setErrorMessage(message);
            setSnackbarOpen(true);

            // Remove the error parameter from URL
            const {pathname} = router;
            router.replace(pathname, undefined, {shallow: true});
        }
    }, [router]);

    return {
        errorMessage,
        snackbarOpen,
        setErrorMessage,
        setSnackbarOpen,
    };
};

import React from 'react';

import {Toast} from './Toast';

import styles from './ToastContainer.module.css';

type ToastItem = {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
};

type ToastContextType = {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({children}: {children: React.ReactNode}) => {
    const [toasts, setToasts] = React.useState<ToastItem[]>([]);

    const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prevToasts) => [...prevToasts, {id, message, type}]);
    }, []);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, []);

    const value = React.useMemo(() => ({showToast}), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className={styles.toastContainer}>
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

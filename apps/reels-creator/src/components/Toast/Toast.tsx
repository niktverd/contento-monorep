import React from 'react';

import styles from './Toast.module.css';

type ToastProps = {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
};

export const Toast = ({message, type, onClose}: ToastProps) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`${styles.toast} ${styles[type]}`}>
            <div className={styles.message}>{message}</div>
            <button className={styles.closeButton} onClick={onClose}>
                ×
            </button>
        </div>
    );
};

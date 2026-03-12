import React from 'react';

import styles from '../../../styles/Account.module.css';

interface InstagramConnectButtonProps {
    hasToken: boolean;
    onClick: () => void;
}

export const InstagramConnectButton = ({hasToken, onClick}: InstagramConnectButtonProps) => {
    return (
        <button onClick={onClick} className={styles.connectButton}>
            {hasToken ? 'Instagram Connected ✓' : 'Connect Instagram Account'}
        </button>
    );
};

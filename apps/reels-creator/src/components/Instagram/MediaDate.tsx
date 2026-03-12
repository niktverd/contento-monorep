import React from 'react';

import styles from '../../../styles/Account.module.css';

interface MediaDateProps {
    timestamp?: string;
}

export const MediaDate = ({timestamp}: MediaDateProps) => {
    if (!timestamp) return null;

    // Parse the timestamp and format it nicely
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <div className={styles.mediaDate}>
            <span>📅 {formattedDate}</span>
        </div>
    );
};

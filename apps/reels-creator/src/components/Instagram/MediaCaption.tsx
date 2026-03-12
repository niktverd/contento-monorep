import React from 'react';

import styles from '../../../styles/Account.module.css';

interface MediaCaptionProps {
    caption?: string;
}

export const MediaCaption = ({caption}: MediaCaptionProps) => {
    if (!caption) return null;

    return (
        <div className={styles.mediaCaption}>
            {caption.length > 100 ? `${caption.substring(0, 100)}...` : caption}
        </div>
    );
};

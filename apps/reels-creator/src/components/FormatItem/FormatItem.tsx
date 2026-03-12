import React from 'react';

import {Check} from '@gravity-ui/icons';

import {useFormatContext} from '../../contexts/formatContext';
import type {FormatType, View} from '../../types/common';

import styles from './FormatItem.module.css';

type FormatItemProps = {
    itemKey: string;
    format: FormatType;
    setView: React.Dispatch<React.SetStateAction<View>>;
};

export const FormatItem = ({itemKey, format, setView}: FormatItemProps) => {
    const {setSelectedFormat} = useFormatContext();

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <button
                    className={styles.button}
                    onClick={() => {
                        setSelectedFormat(format);
                        setView('files');
                    }}
                >
                    <Check />
                </button>
            </div>
            <div className={styles.alt}>{itemKey}</div>
        </div>
    );
};

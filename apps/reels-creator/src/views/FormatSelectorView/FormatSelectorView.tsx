import React from 'react';

import {FormatItem} from '../../components/FormatItem/FormatItem';
import {formats} from '../../constants/common';
import type {View} from '../../types/common';

import styles from './FormatSelectorView.module.css';

type FormatSelectorViewProps = {
    setView: React.Dispatch<React.SetStateAction<View>>;
};

export const FormatSelectorView = ({setView}: FormatSelectorViewProps) => {
    return (
        <div className={styles.formatContainer}>
            {formats.map((f, index) => {
                return (
                    <FormatItem
                        key={f.name + index}
                        itemKey={f.name}
                        format={f}
                        setView={setView}
                    />
                );
            })}
        </div>
    );
};

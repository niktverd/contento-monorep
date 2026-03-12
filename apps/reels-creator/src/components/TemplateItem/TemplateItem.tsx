import React from 'react';

import {Check} from '@gravity-ui/icons';

import type {TemplateData, View} from '../../types/common';

import styles from './TemplateItem.module.css';

type TemplateItemProps = {
    itemKey: string;
    template: TemplateData;
    setSelectedTemplate: React.Dispatch<React.SetStateAction<string | null>>;
    setView: React.Dispatch<React.SetStateAction<View>>;
};

export const TemplateItem = ({
    itemKey,
    template,
    setSelectedTemplate,
    setView,
}: TemplateItemProps) => {
    return (
        <div className={styles.container}>
            {template.preview ? (
                <video
                    width="100%"
                    height="100%"
                    controls={true}
                    src={template.preview}
                    loop={true}
                    className={styles.video}
                >
                    <track kind="captions" label={itemKey} src={template.preview} />
                </video>
            ) : null}
            <div className={styles.content}>
                <button
                    className={styles.button}
                    onClick={() => {
                        setSelectedTemplate(itemKey);
                        setView('format');
                    }}
                >
                    <Check />
                </button>
            </div>
            <div className={styles.alt}>{itemKey}</div>
        </div>
    );
};

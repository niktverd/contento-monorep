import React from 'react';

// import Link from 'next/link';

import {TemplateItem} from '../../components/TemplateItem/TemplateItem';
import type {TemplateData, View} from '../../types/common';

import styles from './TemplateSelectorView.module.css';

type TemplateSelectorViewProps = {
    templatesEntries: [string, TemplateData][];
    setSelectedTemplate: React.Dispatch<React.SetStateAction<string | null>>;
    setView: React.Dispatch<React.SetStateAction<View>>;
};

export const TemplateSelectorView = ({
    templatesEntries,
    setSelectedTemplate,
    setView,
}: TemplateSelectorViewProps) => {
    // const session = useSession();

    return (
        <div className={styles.formatContainer}>
            {templatesEntries.map(([key, template]) => {
                return (
                    <TemplateItem
                        key={key}
                        itemKey={key}
                        template={template}
                        setView={setView}
                        setSelectedTemplate={setSelectedTemplate}
                    />
                );
            })}
        </div>
    );
};

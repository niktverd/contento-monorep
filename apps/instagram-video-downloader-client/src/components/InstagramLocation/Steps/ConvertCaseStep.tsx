import React from 'react';

import {Button} from '@gravity-ui/uikit';

import {IInstagramLocation} from '../../../sharedTypes';

import styles from '../BulkForm.module.css';

interface ConvertCaseStepProps {
    parsedLocations: IInstagramLocation[];
    handleConvert: () => void;
    submitting: boolean;
}

const ConvertCaseStep: React.FC<ConvertCaseStepProps> = ({
    parsedLocations,
    handleConvert,
    submitting,
}) => {
    return (
        <div className={styles.container}>
            <div>
                <label className={styles.label}>Step 2: Convert Keys Format</label>
                <div className={styles.description}>
                    Do you want to convert snake_case keys (like external_id) to camelCase (like
                    externalId)?
                </div>
                <div>
                    <Button view="action" size="m" onClick={handleConvert} disabled={submitting}>
                        Yes, Convert to camelCase
                    </Button>
                </div>
            </div>
            <div className={styles.dataPreviewContainer}>
                <label className={styles.label}>Current Data Preview:</label>
                <pre className={styles.previewText}>{JSON.stringify(parsedLocations, null, 2)}</pre>
            </div>
        </div>
    );
};

export default ConvertCaseStep;

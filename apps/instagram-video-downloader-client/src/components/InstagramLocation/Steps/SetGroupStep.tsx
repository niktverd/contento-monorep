import React from 'react';

import {Button, TextInput} from '@gravity-ui/uikit';

import {IInstagramLocation} from '../../../sharedTypes';

import styles from '../BulkForm.module.css';

interface SetGroupStepProps {
    parsedLocations: IInstagramLocation[];
    commonGroup: string;
    setCommonGroup: (value: string) => void;
    handleSetGroup: () => void;
    submitting: boolean;
}

const SetGroupStep: React.FC<SetGroupStepProps> = ({
    parsedLocations,
    commonGroup,
    setCommonGroup,
    handleSetGroup,
    submitting,
}) => {
    return (
        <div className={styles.container}>
            <div>
                <label className={styles.label}>Step 4: Set Common Group (Optional)</label>
                <div className={styles.description}>
                    Enter a group name to apply to all locations that don&apos;t already have a
                    group.
                </div>
                <TextInput
                    value={commonGroup}
                    onUpdate={setCommonGroup}
                    placeholder="Enter common group"
                    size="l"
                    className={styles.marginBottom}
                />
                <Button view="action" size="m" onClick={handleSetGroup} disabled={submitting}>
                    Apply Group
                </Button>
            </div>
            <div className={styles.dataPreviewContainer}>
                <label className={styles.label}>Current Data Preview:</label>
                <pre className={styles.previewText}>{JSON.stringify(parsedLocations, null, 2)}</pre>
            </div>
        </div>
    );
};

export default SetGroupStep;

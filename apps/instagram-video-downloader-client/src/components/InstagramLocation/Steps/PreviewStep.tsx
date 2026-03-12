import React from 'react';

import {Button} from '@gravity-ui/uikit';

import {IInstagramLocation} from '../../../sharedTypes';

import styles from '../BulkForm.module.css';

interface PreviewStepProps {
    parsedLocations: IInstagramLocation[];
    handleSubmit: () => void;
    submitting: boolean;
}

const PreviewStep: React.FC<PreviewStepProps> = ({parsedLocations, handleSubmit, submitting}) => {
    return (
        <div className={styles.container}>
            <div>
                <label className={styles.label}>Step 5: Preview and Confirm</label>
                <div className={styles.description}>
                    Review the data before submitting. {parsedLocations.length} locations will be
                    created.
                </div>
            </div>
            <div>
                <pre className={styles.largePreviewText}>
                    {JSON.stringify(parsedLocations, null, 2)}
                </pre>
            </div>
            <div>
                <Button
                    view="action"
                    size="l"
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={submitting}
                >
                    Submit
                </Button>
            </div>
        </div>
    );
};

export default PreviewStep;

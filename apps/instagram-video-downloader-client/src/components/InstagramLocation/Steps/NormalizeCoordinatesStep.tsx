import React from 'react';

import {Button} from '@gravity-ui/uikit';

import {IInstagramLocation} from '../../../sharedTypes';

import styles from '../BulkForm.module.css';

interface NormalizeCoordinatesStepProps {
    parsedLocations: IInstagramLocation[];
    handleNormalize: () => void;
    submitting: boolean;
}

const NormalizeCoordinatesStep: React.FC<NormalizeCoordinatesStepProps> = ({
    parsedLocations,
    handleNormalize,
    submitting,
}) => {
    return (
        <div className={styles.container}>
            <div>
                <label className={styles.label}>Step 3: Normalize Coordinate Values</label>
                <div className={styles.description}>
                    This will convert any invalid lat/lng values (objects or NaN) to 0.
                </div>
                <div>
                    <Button view="action" size="m" onClick={handleNormalize} disabled={submitting}>
                        Normalize Coordinates
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

export default NormalizeCoordinatesStep;

import React from 'react';

import {TextArea} from '@gravity-ui/uikit';

import styles from '../BulkForm.module.css';

interface InputStepProps {
    bulkData: string;
    setBulkData: (value: string) => void;
    bulkError: string | null;
}

const InputStep: React.FC<InputStepProps> = ({bulkData, setBulkData, bulkError}) => {
    return (
        <div className={styles.container}>
            <div>
                <label className={styles.label}>Step 1: Enter JSON Data (Array of locations)</label>
                <TextArea
                    value={bulkData}
                    onUpdate={setBulkData}
                    placeholder={`[
  {
    "external_id": "123456789",
    "external_id_source": "instagram",
    "name": "Example Location",
    "address": "123 Main St",
    "lat": 40.7128,
    "lng": -74.0060,
    "group": "NYC"
  },
  {
    "external_id": "987654321",
    "external_id_source": "instagram",
    "name": "Another Location",
    "address": "456 Broadway",
    "lat": 40.7580,
    "lng": -73.9855
  }
]`}
                    size="l"
                    rows={15}
                />
                {bulkError && <div className={styles.errorMessage}>{bulkError}</div>}
            </div>
        </div>
    );
};

export default InputStep;

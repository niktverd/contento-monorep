import React, {useState} from 'react';

import {Button, useToaster} from '@gravity-ui/uikit';

import {IInstagramLocation} from '../../sharedTypes';
import {FetchRoutes2} from '../../utils/constants';
import {fetchPost} from '../../utils/fetchHelpers';
import {deepOmit} from '../../utils/helpers/objectHelpers';

import {
    ConvertCaseStep,
    InputStep,
    NormalizeCoordinatesStep,
    PreviewStep,
    SetGroupStep,
} from './Steps';
import {BulkFormStep} from './types';

import styles from './BulkForm.module.css';

// Helper function to convert snake_case to camelCase
const snakeToCamel = (str: string): string => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Helper function to convert object keys from snake_case to camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertKeysToCamelCase = (obj: Record<string, any>): Record<string, any> => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => convertKeysToCamelCase(item));
    }

    return Object.keys(obj).reduce(
        (acc, key) => {
            const camelKey = snakeToCamel(key);
            // eslint-disable-next-line no-param-reassign
            acc[camelKey] =
                typeof obj[key] === 'object' && obj[key] !== null
                    ? convertKeysToCamelCase(obj[key])
                    : obj[key];
            return acc;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as Record<string, any>,
    );
};

// Helper function to normalize coordinate values
const normalizeCoordinates = (locations: IInstagramLocation[]): IInstagramLocation[] => {
    return locations.map((location) => {
        const newLocation = {...location};

        // If lat/lng are objects or invalid values, set them to 0
        if (typeof newLocation.lat === 'object' || isNaN(Number(newLocation.lat))) {
            newLocation.lat = 0;
        }

        if (typeof newLocation.lng === 'object' || isNaN(Number(newLocation.lng))) {
            newLocation.lng = 0;
        }

        return newLocation;
    });
};

interface BulkFormProps {
    isProd: boolean;
    onSuccess: () => void;
}

const BulkForm: React.FC<BulkFormProps> = ({isProd, onSuccess}) => {
    const {add} = useToaster();
    const [bulkData, setBulkData] = useState<string>('');
    const [bulkError, setBulkError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Multi-step form state
    const [currentStep, setCurrentStep] = useState<BulkFormStep>('input');
    const [parsedLocations, setParsedLocations] = useState<IInstagramLocation[]>([]);
    const [commonGroup, setCommonGroup] = useState<string>('');

    const handleConvertToCamelCase = () => {
        try {
            // We need to cast the result to the correct type
            const converted = convertKeysToCamelCase(
                parsedLocations,
            ) as unknown as IInstagramLocation[];
            setParsedLocations(converted);

            add({
                name: 'convert-success',
                title: 'Successfully converted to camelCase',
                theme: 'success',
            });

            // Move to next step
            setCurrentStep('normalizeCoords');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            add({
                name: 'convert-error',
                title: 'Failed to convert keys to camelCase',
                theme: 'danger',
            });
        }
    };

    const handleNormalizeCoordinates = () => {
        try {
            const normalized = normalizeCoordinates(parsedLocations);
            setParsedLocations(normalized);

            add({
                name: 'normalize-success',
                title: 'Successfully normalized coordinate values',
                theme: 'success',
            });

            // Move to next step
            setCurrentStep('setGroup');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            add({
                name: 'normalize-error',
                title: 'Failed to normalize coordinates',
                theme: 'danger',
            });
        }
    };

    const handleSetCommonGroup = () => {
        if (commonGroup) {
            const withGroup = parsedLocations.map((location) => ({
                ...location,
                group: location.group || commonGroup,
            }));

            setParsedLocations(withGroup);

            add({
                name: 'group-success',
                title: 'Successfully applied group to locations',
                theme: 'success',
            });
        }

        // Move to next step
        setCurrentStep('preview');
    };

    const handleSubmit = async () => {
        if (submitting) return;

        // Bulk mode - submit from preview
        setSubmitting(true);
        try {
            for (const location of parsedLocations) {
                // Clean each location before sending
                const cleanedLocation = deepOmit(location, ['createdAt', 'updatedAt']);

                await fetchPost({
                    route: FetchRoutes2.createInstagramLocation,
                    body: cleanedLocation,
                    isProd,
                });
            }

            add({
                name: 'bulk-success',
                title: `${parsedLocations.length} locations imported successfully`,
                theme: 'success',
            });

            onSuccess();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            add({
                name: 'bulk-error',
                title: err.message || 'Failed to import locations',
                theme: 'danger',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleNextStep = () => {
        if (currentStep === 'input') {
            try {
                // First validate JSON format
                let parsed;
                try {
                    parsed = JSON.parse(bulkData);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error(error);
                    setBulkError('Invalid JSON format. Please check your input.');
                    return;
                }

                // Then validate array and required fields
                if (!Array.isArray(parsed)) {
                    setBulkError('Input must be a JSON array');
                    return;
                }

                // Validate each item
                for (const item of parsed) {
                    // Check for either snake_case or camelCase ID fields
                    if (!item.externalId && !item.external_id) {
                        setBulkError('Each location must have an externalId or external_id field');
                        return;
                    }
                }

                // If validation passes, set the parsed data and move to next step
                setParsedLocations(parsed as IInstagramLocation[]);
                setCurrentStep('convertCase');
                setBulkError(null);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
                setBulkError('Error processing input data');
            }
        }
    };

    const handlePrevStep = () => {
        switch (currentStep) {
            case 'convertCase':
                setCurrentStep('input');
                break;
            case 'normalizeCoords':
                setCurrentStep('convertCase');
                break;
            case 'setGroup':
                setCurrentStep('normalizeCoords');
                break;
            case 'preview':
                setCurrentStep('setGroup');
                break;
            default:
                break;
        }
    };

    const handleSkipStep = () => {
        switch (currentStep) {
            case 'convertCase':
                setCurrentStep('normalizeCoords');
                break;
            case 'normalizeCoords':
                setCurrentStep('setGroup');
                break;
            case 'setGroup':
                setCurrentStep('preview');
                break;
            default:
                break;
        }
    };

    // Render the appropriate step content for bulk mode
    const renderBulkStepContent = () => {
        switch (currentStep) {
            case 'input':
                return (
                    <InputStep
                        bulkData={bulkData}
                        setBulkData={setBulkData}
                        bulkError={bulkError}
                    />
                );

            case 'convertCase':
                return (
                    <ConvertCaseStep
                        parsedLocations={parsedLocations}
                        handleConvert={handleConvertToCamelCase}
                        submitting={submitting}
                    />
                );

            case 'normalizeCoords':
                return (
                    <NormalizeCoordinatesStep
                        parsedLocations={parsedLocations}
                        handleNormalize={handleNormalizeCoordinates}
                        submitting={submitting}
                    />
                );

            case 'setGroup':
                return (
                    <SetGroupStep
                        parsedLocations={parsedLocations}
                        commonGroup={commonGroup}
                        setCommonGroup={setCommonGroup}
                        handleSetGroup={handleSetCommonGroup}
                        submitting={submitting}
                    />
                );

            case 'preview':
                return (
                    <PreviewStep
                        parsedLocations={parsedLocations}
                        handleSubmit={handleSubmit}
                        submitting={submitting}
                    />
                );

            default:
                return null;
        }
    };

    // Navigation buttons for multi-step form
    const renderStepNavigation = () => {
        if (currentStep === 'preview') {
            return (
                <div className={styles.navigationContainer}>
                    <Button view="normal" size="m" onClick={handlePrevStep} disabled={submitting}>
                        Back
                    </Button>
                </div>
            );
        }

        if (currentStep === 'input') {
            return (
                <div className={styles.navigationContainer}>
                    <Button view="action" size="m" onClick={handleNextStep} disabled={submitting}>
                        Next
                    </Button>
                </div>
            );
        }

        return (
            <div className={styles.navigationContainer}>
                <Button view="normal" size="m" onClick={handlePrevStep} disabled={submitting}>
                    Back
                </Button>
                <Button view="normal" size="m" onClick={handleSkipStep} disabled={submitting}>
                    Skip
                </Button>
            </div>
        );
    };

    return (
        <>
            {renderBulkStepContent()}
            {renderStepNavigation()}
        </>
    );
};

export default BulkForm;

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {Fragment, useEffect} from 'react';

import {IInstagramLocation} from '../../../sharedTypes';
import {InstagramLocationSource, ScenarioType} from '../../../sharedTypes/types/enums';
import {CustomField} from '../../CustomField/CustomField';
import {InstagramLocationSelector} from '../../InstagramLocationSelector/InstagramLocationSelector';

import {ScenarioTexts} from './components/ScenarioTexts';

type ScenarioFormCommonProps = {
    values: any;
    updateOnly?: boolean;
    setType?: any;
    setFieldValue?: (field: string, value: any) => void;
};

export const ScenarioFormCommon = ({
    values,
    updateOnly = false,
    setType,
    setFieldValue,
}: ScenarioFormCommonProps) => {
    useEffect(() => {
        setType(values.type);
    }, [setType, values.type]);

    // Handle Instagram location selection changes
    const handleInstagramLocationChange = (locations: IInstagramLocation[]) => {
        if (setFieldValue) {
            setFieldValue('instagramLocations', locations);
        }
    };

    return (
        <Fragment>
            <div style={{backgroundColor: 'rgb(0 0 0 / 0.5)', padding: 10, marginBlock: 20}}>
                <CustomField name="slug" placeholder="Slug" type="text" disabled={updateOnly} />
                <CustomField name="type" placeholder="Type" as="select" disabled={updateOnly}>
                    {Object.entries(ScenarioType).map(([key, value]) => {
                        return (
                            <option key={key} value={value}>
                                {key}
                            </option>
                        );
                    })}
                </CustomField>
                <CustomField name="enabled" type="checkbox" />
                <CustomField name="onlyOnce" type="checkbox" label="Use the scenario only once" />
                <ScenarioTexts values={values} />

                {/* Instagram Location Source Selector */}
                <div style={{marginTop: 20, marginBottom: 10}}>
                    <h3>Instagram Location Source</h3>
                    <div style={{marginTop: 10}}>
                        <CustomField
                            name="instagramLocationSource"
                            as="select"
                            label="Where to fetch Instagram locations from"
                        >
                            {Object.entries(InstagramLocationSource).map(([key, value]) => (
                                <option key={key} value={value}>
                                    {key}
                                </option>
                            ))}
                        </CustomField>
                    </div>
                </div>

                {/* Instagram Locations Selector */}
                <InstagramLocationSelector
                    selectedLocations={values.instagramLocations || []}
                    onSelectionChange={handleInstagramLocationChange}
                    title="Instagram Locations"
                />
            </div>
        </Fragment>
    );
};

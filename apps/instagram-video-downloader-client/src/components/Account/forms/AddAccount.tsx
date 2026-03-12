/* eslint-disable import/no-extraneous-dependencies */
import React, {useContext, useEffect, useState} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, ButtonIcon} from '@gravity-ui/uikit';
import {Form, Formik} from 'formik';

import {AppEnvContext} from '../../../contexts/AppEnv';
import {GetAllScenariosResponse, IInstagramLocation, IScenario} from '../../../sharedTypes';
import {fetchRoutes} from '../../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../../utils/fetchHelpers';
import {deepOmit} from '../../../utils/helpers/objectHelpers';
import {CustomField} from '../../CustomField/CustomField';
import {InstagramLocationSelector} from '../../InstagramLocationSelector';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AddAccount = ({initialValues, onSubmit}: any) => {
    const [scenarios, setScenarios] = useState<IScenario[]>([]);
    const {isProd} = useContext(AppEnvContext);

    useEffect(() => {
        const fetchData = async () => {
            // Get scenarios
            const scenariosData = await fetchGet<GetAllScenariosResponse>({
                route: fetchRoutes.scenarios.list,
                query: {},
                isProd,
            });
            setScenarios(scenariosData);
        };

        fetchData();
    }, [isProd]);

    // Prepare initial form values with default arrays
    const defaultValues = {
        slug: '',
        enabled: true,
        token: '',
        availableScenarios: [],
        instagramLocations: [],
    };

    // Ensure that initial values have the required arrays
    const preparedInitialValues = initialValues
        ? {
              ...defaultValues,
              ...initialValues,
              availableScenarios: initialValues.availableScenarios || [],
              instagramLocations: initialValues.instagramLocations || [],
          }
        : defaultValues;

    // Transform form data before submitting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = (values: any) => {
        // Remove createdAt and updatedAt fields from all objects recursively
        const cleanedValues = deepOmit(values, ['createdAt', 'updatedAt']);
        onSubmit?.(cleanedValues);
    };

    return (
        <div>
            <h1>Account Form</h1>
            <Formik initialValues={preparedInitialValues} onSubmit={handleSubmit}>
                {({values, setFieldValue}) => {
                    // Handle Instagram location selection changes
                    const handleInstagramLocationChange = (locations: IInstagramLocation[]) => {
                        setFieldValue('instagramLocations', locations);
                    };

                    return (
                        <Form>
                            <CustomField type="text" name="slug" label="Slug" />
                            <CustomField type="checkbox" name="enabled" label="Enabled" />
                            <CustomField type="text" name="token" label="Token" />

                            {/* Scenarios Section */}
                            <div style={{backgroundColor: '#111', padding: 20, marginBlockEnd: 20}}>
                                <h2>Scenarios</h2>
                                <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
                                    <select
                                        onChange={(e) => {
                                            const scenarioId = parseInt(e.target.value, 10);
                                            if (
                                                scenarioId &&
                                                !values.availableScenarios.some(
                                                    (s) => s.id === scenarioId,
                                                )
                                            ) {
                                                const scenarioToAdd = scenarios.find(
                                                    (s) => s.id === scenarioId,
                                                );
                                                if (scenarioToAdd) {
                                                    setFieldValue('availableScenarios', [
                                                        ...values.availableScenarios,
                                                        {
                                                            id: scenarioToAdd.id,
                                                            slug: scenarioToAdd.slug,
                                                            type: scenarioToAdd.type,
                                                        },
                                                    ]);
                                                }
                                            }
                                            // eslint-disable-next-line no-param-reassign
                                            e.target.value = '';
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            Select Scenario
                                        </option>
                                        {scenarios
                                            .filter(
                                                (opt) =>
                                                    !values.availableScenarios.some(
                                                        (s) => s.id === opt.id,
                                                    ),
                                            )
                                            .map((opt) => (
                                                <option key={opt.id} value={opt.id}>
                                                    {opt.slug} ({opt.id})
                                                </option>
                                            ))}
                                    </select>
                                    {values.availableScenarios.map((scenarioRef, index) => {
                                        const scenario = scenarios.find(
                                            (s) => s.id === scenarioRef.id,
                                        );
                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    border: '2px solid #f70',
                                                    padding: 12,
                                                    borderRadius: 18,
                                                    display: 'inline-flex',
                                                    gap: 10,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {scenario ? scenario.slug : scenarioRef.id}
                                                <Button
                                                    onClick={() => {
                                                        const newScenarios = [
                                                            ...values.availableScenarios,
                                                        ];
                                                        newScenarios.splice(index, 1);
                                                        setFieldValue(
                                                            'availableScenarios',
                                                            newScenarios,
                                                        );
                                                    }}
                                                >
                                                    <ButtonIcon>
                                                        <Xmark />
                                                    </ButtonIcon>
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Instagram Locations Section */}
                            <div style={{backgroundColor: '#111', padding: 20, marginBlockEnd: 20}}>
                                <InstagramLocationSelector
                                    selectedLocations={values.instagramLocations || []}
                                    onSelectionChange={handleInstagramLocationChange}
                                    title="Instagram Locations"
                                />
                            </div>

                            <Button type="submit" view="action" size="xl">
                                Submit
                            </Button>
                        </Form>
                    );
                }}
            </Formik>
        </div>
    );
};

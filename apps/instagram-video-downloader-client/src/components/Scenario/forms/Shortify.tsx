import React from 'react';

import {Plus} from '@gravity-ui/icons';
import {Button, ButtonIcon} from '@gravity-ui/uikit';
import {FieldArray, Form, Formik} from 'formik';

import {InstagramLocationSource, ScenarioType} from '../../../sharedTypes/types/enums';
import {CustomField} from '../../CustomField/CustomField';

import {ScenarioFormCommon} from './ScenarioFormCommon';
import {DeleteFromArrayButton} from './components/DeleteFromArrayButton';
import {TEXT_CATEGORIES_DEFAUTL_VALUES} from './constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Shortify = ({initialValues, onSubmit, setType}: any) => {
    const updateOnly = Boolean(initialValues);
    return (
        <div>
            <h1>Shortify</h1>
            <Formik
                initialValues={
                    initialValues
                        ? initialValues
                        : {
                              slug: '',
                              type: ScenarioType.ScenarioShortifyUnique,
                              texts: TEXT_CATEGORIES_DEFAUTL_VALUES,
                              enabled: true,
                              onlyOnce: false,
                              instagramLocations: [],
                              instagramLocationSource: InstagramLocationSource.Scenario,
                              options: {
                                  minDuration: 3,
                                  maxDuration: 7,
                                  extraBannerUrls: [],
                              },
                          }
                }
                onSubmit={(values) => {
                    // same shape as initial values
                    onSubmit?.(values);
                }}
            >
                {({values, setFieldValue}) => (
                    <Form>
                        <ScenarioFormCommon
                            values={values}
                            updateOnly={updateOnly}
                            setType={setType}
                            setFieldValue={setFieldValue}
                        />
                        <CustomField type="text" name="options.finalBanner" label="FinalBanner" />
                        <CustomField
                            type="number"
                            name="options.minDuration"
                            label="Min Duration (sec)"
                        />
                        <CustomField
                            type="number"
                            name="options.maxDuration"
                            label="Max Duration (sec)"
                        />
                        <div style={{backgroundColor: '#111', padding: 20, marginBlockEnd: 20}}>
                            <h2>Extra banner urls</h2>
                            <FieldArray name="options.extraBannerUrls">
                                {({remove, push}) => (
                                    <div>
                                        {values.options?.extraBannerUrls.length > 0 &&
                                            values.options.extraBannerUrls.map((url, index) => (
                                                <div style={{display: 'flex'}} key={index}>
                                                    <DeleteFromArrayButton
                                                        onClick={() => remove(index)}
                                                    />
                                                    <CustomField
                                                        name={`options.extraBannerUrls.${index}`}
                                                        placeholder="url"
                                                        type="text"
                                                        label={index.toString()}
                                                    />
                                                </div>
                                            ))}
                                        <Button onClick={() => push('')} view="outlined">
                                            <ButtonIcon>
                                                <Plus />
                                            </ButtonIcon>
                                        </Button>
                                    </div>
                                )}
                            </FieldArray>
                        </div>
                        <Button type="submit" view="action" size="xl">
                            Submit
                        </Button>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

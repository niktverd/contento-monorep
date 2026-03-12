import React from 'react';

import {Plus} from '@gravity-ui/icons';
import {Button, ButtonIcon} from '@gravity-ui/uikit';
import {FieldArray, Form, Formik} from 'formik';

import {InstagramLocationSource, ScenarioType} from '../../../sharedTypes';
import {CustomField} from '../../CustomField/CustomField';

import {ScenarioFormCommon} from './ScenarioFormCommon';
import {DeleteFromArrayButton} from './components/DeleteFromArrayButton';
import {TEXT_CATEGORIES_DEFAUTL_VALUES} from './constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CoverWithGreen = ({initialValues, onSubmit, setType}: any) => {
    const updateOnly = Boolean(initialValues);
    return (
        <div>
            <h1>Cover with green</h1>
            <Formik
                initialValues={
                    initialValues
                        ? initialValues
                        : {
                              slug: '',
                              type: ScenarioType.ScenarioCoverWithGreenUnique,
                              texts: TEXT_CATEGORIES_DEFAUTL_VALUES,
                              enabled: true,
                              onlyOnce: false,
                              instagramLocations: [],
                              instagramLocationSource: InstagramLocationSource.Scenario,
                              options: {
                                  greenVideoUrls: [],
                                  whereToPutGreen: 'start',
                                  loopGreen: 'once',
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
                        <CustomField
                            name="options.whereToPutGreen"
                            placeholder="Where to put green"
                            as="select"
                        >
                            {['start', 'middle', 'end'].map((value) => {
                                return (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                );
                            })}
                        </CustomField>
                        <CustomField name="options.loopGreen" placeholder="Loop green" as="select">
                            {['once', 'loop', 'random'].map((value) => {
                                return (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                );
                            })}
                        </CustomField>
                        <div style={{backgroundColor: '#111', padding: 20, marginBlockEnd: 20}}>
                            <h2>Extra banner urls</h2>
                            <FieldArray name="options.greenVideoUrls">
                                {({remove, push}) => (
                                    <div>
                                        {values.options?.greenVideoUrls.length > 0 &&
                                            values.options.greenVideoUrls.map((url, index) => (
                                                <div style={{display: 'flex'}} key={index}>
                                                    <DeleteFromArrayButton
                                                        onClick={() => remove(index)}
                                                    />
                                                    <CustomField
                                                        name={`options.greenVideoUrls.${index}`}
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

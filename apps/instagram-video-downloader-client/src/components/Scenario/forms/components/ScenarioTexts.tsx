import React from 'react';

import {Plus} from '@gravity-ui/icons';
import {Button, ButtonIcon} from '@gravity-ui/uikit';
import {FieldArray} from 'formik';

import {CustomField} from '../../../CustomField/CustomField';
import {TEXT_CATEGORIES_DEFAUTL_VALUES} from '../constants';

import {DeleteFromArrayButton} from './DeleteFromArrayButton';

type ScenarioTextsProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: any;
    path?: string;
};

export const ScenarioTexts = ({values, path = 'texts'}: ScenarioTextsProps) => {
    return (
        <div>
            <h2>{path}</h2>
            {Object.keys(TEXT_CATEGORIES_DEFAUTL_VALUES).map((category) => (
                <FieldArray name={`${path}.${category}`} key={category}>
                    {({remove, push}) => (
                        <div style={{padding: 8, marginBlock: 8, backgroundColor: '#111'}}>
                            <h3>{category}</h3>
                            {values?.[path]?.[category]?.length > 0 &&
                                values[path][category].map((_text, index) => (
                                    <div style={{display: 'flex'}} key={index}>
                                        <DeleteFromArrayButton onClick={() => remove(index)} />
                                        <CustomField
                                            name={`${path}.${category}.${index}`}
                                            placeholder="Some text"
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
            ))}
        </div>
    );
};

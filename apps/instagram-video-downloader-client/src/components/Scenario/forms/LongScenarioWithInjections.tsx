/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import React, {useState} from 'react';

import {Button} from '@gravity-ui/uikit';

// import {ScenarioFormCommon} from './ScenarioFormCommon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LongScenarioWithInjections = ({initialValues, onSubmit, setType}: any) => {
    console.log({setType});
    const [values, setValues] = useState(initialValues || {});

    const onSubmitLocal: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        onSubmit?.(values);
    };

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        const name = event.target.name;
        setValues({
            ...values,
            [name]: name === 'limit' ? Number(event.target.value) : event.target.value,
        });
    };

    const handleChangeInjection =
        (index: number): React.ChangeEventHandler<HTMLInputElement> =>
        (event) => {
            const injections = [...(values.injections || [])];
            injections[index] = event.target.value;

            setValues({
                ...values,
                injections,
            });
        };

    const handleAddInjectionClick = () => {
        const injections = [...(values.injections || [])];
        injections.push('');

        setValues({
            ...values,
            injections,
        });
    };

    return (
        <form onSubmit={onSubmitLocal}>
            {/* <ScenarioFormCommon values={values} setValues={setValues} setType={setType} /> */}
            <div>
                <label htmlFor="adsBannerUrl">adsBannerUrl</label>
                <input
                    name="adsBannerUrl"
                    type="text"
                    value={values['adsBannerUrl']}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="startBannerUrl">startBannerUrl</label>
                <input
                    name="startBannerUrl"
                    type="text"
                    value={values['startBannerUrl']}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="limit">limit</label>
                <input
                    name="limit"
                    type="number"
                    value={values['limit']}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <h4>Injections</h4>
                <div>
                    <Button onClick={handleAddInjectionClick}>add</Button>
                </div>
                <div>
                    {(values.injections || []).map((injectionUrl: string, index) => {
                        return (
                            <div key={injectionUrl + index}>
                                <input
                                    value={injectionUrl || ''}
                                    onChange={handleChangeInjection(index)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <input type="submit" />
        </form>
    );
};

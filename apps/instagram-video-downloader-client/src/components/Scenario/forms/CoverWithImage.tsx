/* eslint-disable import/no-extraneous-dependencies */
import React, {useState} from 'react';

// import {ScenarioFormCommon} from './ScenarioFormCommon';

const numberFields = [
    'imageTop',
    'imageLeft',
    'imageWidth',
    'imageHeight',
    'videoTop',
    'videoLeft',
    'videoWidth',
    'videoHeight',
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CoverWithImage = ({initialValues, onSubmit, setType}: any) => {
    // eslint-disable-next-line no-console
    console.log({initialValues, onSubmit, setType});
    const [values, setValues] = useState(initialValues || {});

    const onSubmitLocal: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        onSubmit?.(values);
    };

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        const name = event.target.name;
        setValues({
            ...values,
            [name]: numberFields.includes(name) ? Number(event.target.value) : event.target.value,
        });
    };

    return (
        <form onSubmit={onSubmitLocal}>
            {/* <ScenarioFormCommon values={values} setValues={setValues} setType={setType} /> */}
            <div>
                <label htmlFor="imageUrl">imageUrl</label>
                <input
                    name="imageUrl"
                    type="text"
                    value={values['imageUrl']}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="imageTop">imageTop, %</label>
                <input
                    name="imageTop"
                    type="number"
                    value={values['imageTop'] || 0}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="imageLeft">imageLeft, %</label>
                <input
                    name="imageLeft"
                    type="number"
                    value={values['imageLeft'] || 0}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="imageWidth">imageWidth, %</label>
                <input
                    name="imageWidth"
                    type="number"
                    value={values['imageWidth'] || 100}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="imageHeihgt">imageHeihgt, %</label>
                <input
                    name="imageHeihgt"
                    type="number"
                    value={values['imageHeihgt'] || 100}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="videoTop">videoTop, %</label>
                <input
                    name="videoTop"
                    type="number"
                    value={values['videoTop'] || 0}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="videoLeft">videoLeft, %</label>
                <input
                    name="videoLeft"
                    type="number"
                    value={values['videoLeft'] || 0}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="videoWidth">videoWidth, %</label>
                <input
                    name="videoWidth"
                    type="number"
                    value={values['videoWidth'] || 100}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="videoHeihgt">videoHeihgt, %</label>
                <input
                    name="videoHeihgt"
                    type="number"
                    value={values['videoHeihgt'] || 100}
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>

            <input type="submit" />
        </form>
    );
};

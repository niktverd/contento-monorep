/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useState} from 'react';

// import {CoverWithImage} from './CoverWithImage';
// import {LongScenarioWithInjections} from './LongScenarioWithInjections';
// import {Shortify} from './Shortify';

import {ScenarioType} from '../../../sharedTypes';

import {AddBannerInTheEnd} from './AddBannerInTheEnd';
import {CoverWithGreen} from './CoverWithGreen';
import {Shortify} from './Shortify';

type ScenarioRouterArgs = {
    initialValues?: any;
    onSubmit: any;
};

export const ScenarioRouter = ({initialValues, onSubmit}: ScenarioRouterArgs) => {
    const [type, setType] = useState<null | ScenarioType>(
        initialValues?.type || ScenarioType.ScenarioShortifyUnique,
    );

    if (
        // (type as ScenarioType) === ScenarioType.ScenarioAddBannerAtTheEndType ||
        (type as ScenarioType) === ScenarioType.ScenarioAddBannerAtTheEndUnique
    ) {
        return (
            <AddBannerInTheEnd
                initialValues={initialValues}
                onSubmit={onSubmit}
                setType={setType}
            />
        );
    }
    // if ((type as ScenarioType) === ScenarioType.ScenarioLongVideoWithInjectionsType) {
    //     return (
    //         <LongScenarioWithInjections
    //             initialValues={initialValues}
    //             onSubmit={onSubmit}
    //             setType={setType}
    //         />
    //     );
    // }

    if (
        // (type as ScenarioType) === ScenarioType.ScenarioShortifyType ||
        (type as ScenarioType) === ScenarioType.ScenarioShortifyUnique
    ) {
        return <Shortify initialValues={initialValues} onSubmit={onSubmit} setType={setType} />;
        // return <Shortify initialValues={initialValues} onSubmit={onSubmit} setType={setType} />;
    }

    // if ((type as ScenarioType) === ScenarioType.ScenarioCoverWithImageType) {
    //     return (
    //         <CoverWithImage initialValues={initialValues} onSubmit={onSubmit} setType={setType} />
    //     );
    // }

    if ((type as ScenarioType) === ScenarioType.ScenarioCoverWithGreenUnique) {
        return (
            <CoverWithGreen initialValues={initialValues} onSubmit={onSubmit} setType={setType} />
        );
    }

    return (
        <div>
            <h1>There is no form for selected type</h1>
            <h2>{type}</h2>

            {initialValues ? null : (
                <div>
                    <select onChange={(event) => setType(event.target.value as ScenarioType)}>
                        {Object.entries(ScenarioType).map(([key, value]) => {
                            return (
                                <option key={key} value={value}>
                                    {key}
                                </option>
                            );
                        })}
                    </select>
                </div>
            )}
        </div>
    );
};

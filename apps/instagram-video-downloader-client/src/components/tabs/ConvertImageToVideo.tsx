/* eslint-disable import/no-extraneous-dependencies */
import React, {useContext, useState} from 'react';

import {Button} from '@gravity-ui/uikit';

import {AppEnvContext} from '../../contexts/AppEnv';
import {FetchRoutes2} from '../../utils/constants';
import {fetchPost} from '../../utils/fetchHelpers';

export const ConvertImageToVideo = () => {
    const [imageUrl, setImageUrl] = useState('');
    const [pathToSave, setPathToSave] = useState('assets/');
    const [duration, setDuration] = useState(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [response, setResponse] = useState<any>(null);
    const {isProd} = useContext(AppEnvContext);

    const handleGetOwnerByMediaIdClick = async () => {
        setResponse(null);
        // eslint-disable-next-line no-nested-ternary
        const localPathToSave = pathToSave
            ? pathToSave.endsWith('/')
                ? pathToSave
                : `${pathToSave}/`
            : '';
        const json = await fetchPost({
            route: FetchRoutes2.convertImageToVideo,
            body: {imageUrl, duration, pathToSave: localPathToSave},
            isProd,
        });

        setResponse(json);
    };

    return (
        <div>
            <h2>Convert Image into Video</h2>
            <div>
                <div>
                    <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
                </div>
                <div>
                    <input
                        type="number"
                        value={duration}
                        onChange={(event) => setDuration(Number(event.target.value))}
                    />
                </div>
                <div>
                    <input
                        value={pathToSave}
                        onChange={(event) => setPathToSave(event.target.value)}
                    />
                </div>
                <Button onClick={handleGetOwnerByMediaIdClick}>Convert</Button>

                {response && (
                    <div>
                        <pre>{JSON.stringify(response, null, 2)}</pre>
                        <Button href={response.path}>open</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

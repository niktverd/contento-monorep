/* eslint-disable import/no-extraneous-dependencies */
import React, {useContext} from 'react';

import {Button} from '@gravity-ui/uikit';

import {AppEnvContext} from '../../contexts/AppEnv';
import {FetchRoutes2} from '../../utils/constants';
import {fetchPost} from '../../utils/fetchHelpers';

export const Temporal = () => {
    const {isProd} = useContext(AppEnvContext);

    const runVideoProcessing = async () => {
        const response = await fetchPost({
            route: FetchRoutes2.startVideoDownloadingWorkflow,
            body: {sourceId: 1063, accountId: 34, scenarioId: 100},
            isProd,
        });

        // eslint-disable-next-line no-console
        console.log(response);
    };

    return (
        <div>
            <h2>Temporal</h2>
            <Button onClick={runVideoProcessing}>Run Video Processing</Button>
        </div>
    );
};

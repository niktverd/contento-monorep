/* eslint-disable import/no-extraneous-dependencies */
import React, {Fragment, useContext} from 'react';

import {Button, useToaster} from '@gravity-ui/uikit';

import {AppEnvContext} from '../../contexts/AppEnv';
import {FetchRoutes2} from '../../utils/constants';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from './Cron.module.css';

export const CronTest = () => {
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);

    const handleDownloadVideoClick = async () => {
        const json = await fetchGet({
            route: FetchRoutes2.downloadVideoFromSourceV3,
            query: {},
            isProd,
        });

        add({
            name: Math.random() + '-create-video',
            title: JSON.stringify(json),
            theme: 'info',
        });
    };

    const handleCreateVideoByScenarioClick = async () => {
        const json = await fetchGet({
            route: FetchRoutes2.createVideoByScenario,
            query: {},
            isProd,
        });

        add({
            name: Math.random() + '-create-video',
            title: JSON.stringify(json),
            theme: 'info',
        });
    };

    const handleCreateVideoByInjectScenarioClick = async () => {
        const json = await fetchGet({
            route: FetchRoutes2.createInjectVideoByScenario,
            query: {},
            isProd,
        });

        add({
            name: Math.random() + '-create-video',
            title: JSON.stringify(json),
            theme: 'info',
        });
    };

    return (
        <Fragment>
            <h3>Cron</h3>
            <div className={cn.container}>
                <div>
                    <Button view="outlined-action" onClick={handleDownloadVideoClick}>
                        Download Video
                    </Button>
                </div>
                <div>
                    <Button view="outlined-action" onClick={handleCreateVideoByScenarioClick}>
                        Concat video
                    </Button>
                </div>
                <div>
                    <Button view="outlined-action" onClick={handleCreateVideoByInjectScenarioClick}>
                        Inject Scenario
                    </Button>
                </div>
            </div>
        </Fragment>
    );
};

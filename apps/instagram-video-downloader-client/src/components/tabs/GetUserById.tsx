/* eslint-disable import/no-extraneous-dependencies */
import React, {useContext, useState} from 'react';

import {Button} from '@gravity-ui/uikit';

import {AppEnvContext} from '../../contexts/AppEnv';
import {FetchRoutes2} from '../../utils/constants';
import {fetchGet} from '../../utils/fetchHelpers';

export const GetUserById = () => {
    const {isProd} = useContext(AppEnvContext);
    const [userId, setUserId] = useState('');
    const [mediaId, setMediaId] = useState('');

    const handleGetUserByIdClick = async () => {
        await fetchGet({
            route: FetchRoutes2.getUserById,
            query: {id: 'carcar.kz', userId},
            isProd,
        });
    };

    const handleGetOwnerByMediaIdClick = async () => {
        await fetchGet({
            route: FetchRoutes2.getOwnerByMediaId,
            query: {id: 'carcar.kz', reelVideoId: mediaId},
            isProd,
        });
    };

    return (
        <div>
            <div>
                <h2>Get user by userId</h2>
                <input value={userId} onChange={(event) => setUserId(event.target.value)} />
                <Button onClick={handleGetUserByIdClick}>Get user By id</Button>
            </div>
            <div>
                <h2>Get user by userId</h2>
                <input value={mediaId} onChange={(event) => setMediaId(event.target.value)} />
                <Button onClick={handleGetOwnerByMediaIdClick}>Get owner By media id</Button>
            </div>
        </div>
    );
};

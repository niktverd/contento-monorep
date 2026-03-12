import {Express} from 'express';
import request from 'supertest';

import {
    CreateInstagramLocationParams,
    DeleteInstagramLocationParams,
    UpdateInstagramLocationParams,
} from '../../types';
import {fullRoutes as instagramLocationRoutes} from '../../types/routes/instagramLocation';

import {getOrgHeader, getUserTokenHeader, prepareRoute} from './common';

export const createLocationHelper = async (
    params: CreateInstagramLocationParams | undefined,
    testApp: Express,
) => {
    const paramsLocal: CreateInstagramLocationParams = params
        ? params
        : {
              externalId: 'test',
              externalIdSource: 'test',
              name: 'test',
              address: 'test',
              lat: 1,
              lng: 1,
              group: 'test',
          };

    return request(testApp)
        .post(prepareRoute(instagramLocationRoutes.create))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(paramsLocal);
};

export const getAllLocationsHelper = (testApp: Express) => {
    return request(testApp)
        .get(prepareRoute(instagramLocationRoutes.list))
        .set(getUserTokenHeader())
        .set(getOrgHeader());
};

export const updateLocationHelper = (
    params: Partial<UpdateInstagramLocationParams>,
    testApp: Express,
) => {
    return request(testApp)
        .patch(prepareRoute(instagramLocationRoutes.update))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(params);
};

export const deleteLocationHelper = (params: DeleteInstagramLocationParams, testApp: Express) => {
    return request(testApp)
        .delete(prepareRoute(instagramLocationRoutes.delete))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(params);
};

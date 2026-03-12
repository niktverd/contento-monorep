import request from 'supertest';

import testApp from '../../app';

import {getUserTokenHeader, prepareRoute} from './utils/common';

import {db as knex} from '#src/db/utils';
import {fullRoutes} from '#src/types/routes/user';
import {IUser} from '#types';

const {list} = fullRoutes;

describe('User Management API (SuperAdmin without org header)', () => {
    afterEach(async () => {
        await knex('users').del();
    });

    it('should list users without x-organization-id when authorized as SuperAdmin', async () => {
        // Seed two users
        const [u1] = await knex('users')
            .insert({email: 'a@example.com', name: 'User A', uid: 'uid-a'})
            .returning('*');
        const [u2] = await knex('users')
            .insert({email: 'b@example.com', name: 'User B', uid: 'uid-b'})
            .returning('*');

        const res = await request(testApp).get(prepareRoute(list)).set(getUserTokenHeader());

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        const emails = (res.body as IUser[]).map((u) => u.email);
        expect(emails).toEqual(expect.arrayContaining([u1.email, u2.email]));
    });
});

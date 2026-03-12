import request from 'supertest';

import testApp from '../../app';

import {getUserTokenHeader, prepareRoute} from './utils/common';
import {createRoleHelper} from './utils/role';

import {db as knex} from '#src/db/utils';
import {fullRoutes} from '#src/types/routes/role';
import {IRole} from '#types';

const {get, create, list, update, delete: deleteRoute} = fullRoutes;
// Mock authentication middleware for testing
// jest.mock('#src/middleware/auth');

describe('Role Management API', () => {
    // let systemAdminAuthSpy: jest.SpyInstance;

    beforeEach(() => {
        // Spy on the actual middleware and mock its implementation for each test
        // systemAdminAuthSpy = jest
        //     .spyOn(authMiddleware, 'systemAdminAuth')
        //     .mockImplementation((req: any, _res: any, next: any) => {
        //         // Default mock: assume system_admin for most tests
        //         req.user = {id: 'test-admin-id', role: 'system_admin'};
        //         next();
        //         return undefined; // Explicitly return undefined to match middleware signature
        //     });
    });

    afterEach(async () => {
        // Clean up roles table after each test
        await knex('roles').del();
        // systemAdminAuthSpy.mockRestore(); // Restore the original implementation after each test
    });

    it('should create a new role', async () => {
        const res = await request(testApp)
            .post(prepareRoute(create))
            .set(getUserTokenHeader())
            .send({name: 'Test Role', description: '', permissions: []});

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toEqual('Test Role');
    });

    it('should get all roles', async () => {
        await createRoleHelper({name: 'Role A'}, testApp);
        await createRoleHelper({name: 'Role B'}, testApp);

        const res = await request(testApp).get(prepareRoute(list)).set(getUserTokenHeader());

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].name).toEqual('Role A');
        expect(res.body[1].name).toEqual('Role B');
    });

    it('should get an role by ID', async () => {
        const org = await createRoleHelper({name: 'Role C'}, testApp);

        const res = await request(testApp)
            .get(`${prepareRoute(get)}?id=${(org.body as IRole).id}`)
            .set(getUserTokenHeader());

        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Role C');
    });

    it('should update an role', async () => {
        const org = await createRoleHelper({name: 'Role D'}, testApp);

        const res = await request(testApp)
            .patch(prepareRoute(update))
            .set(getUserTokenHeader())
            .send({
                id: (org.body as IRole).id,
                name: 'Updated Role D',
                description: 'updated description', // это не правильно
                permissions: [], // это не правильно
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Updated Role D');
    });

    it('should delete an role', async () => {
        const org = await createRoleHelper({name: 'Role E'}, testApp);
        const res = await request(testApp)
            .delete(`${prepareRoute(deleteRoute)}/?id=${(org.body as IRole).id}`)
            .set(getUserTokenHeader());

        expect(res.statusCode).toEqual(204);

        const res2 = await request(testApp)
            .get(`${prepareRoute(get)}?id=${(org.body as IRole).id}`)
            .set(getUserTokenHeader());
        expect(res2.statusCode).toEqual(404);
        expect(res2.body.error).toEqual('Role not found');
    });

    it('should return 477 if name is missing for create', async () => {
        const res = await request(testApp)
            .post(prepareRoute(create))
            .send({})
            .set(getUserTokenHeader());

        expect(res.statusCode).toEqual(477);
        expect(res.body.error.includes('Validation failed')).toBe(true);
    });

    it('should return 477 if name is missing for update', async () => {
        const org = await createRoleHelper({name: 'Role F'}, testApp);
        const res = await request(testApp)
            .patch(prepareRoute(update))
            .send({id: (org as unknown as IRole).id})
            .set(getUserTokenHeader());

        expect(res.statusCode).toEqual(477);
        expect(res.body.error.includes('Validation failed')).toBe(true);
    });

    it('should return 404 if role not found for get by ID', async () => {
        const res = await request(testApp)
            .get(`${prepareRoute(get)}?id=999`)
            .set(getUserTokenHeader());

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toEqual('Role not found');
    });

    it('should return 477 if role not found for update', async () => {
        const res = await request(testApp)
            .patch(prepareRoute(update))
            .send({name: 'Updated role'})
            .set(getUserTokenHeader());
        expect(res.statusCode).toEqual(477);
        expect(res.body.error.includes('Validation failed')).toBe(true);
    });

    it('should return 404 if role not found for delete', async () => {
        const res = await request(testApp)
            .delete(`${prepareRoute(deleteRoute)}?id=999`)
            .set(getUserTokenHeader());
        expect(res.statusCode).toEqual(404);
    });

    // Authorization tests
    // it('should return 403 if user is not system_admin', async () => {
    //     // Temporarily override the mock to simulate a non-admin user
    //     systemAdminAuthSpy.mockImplementationOnce((req: any, res: any, _next: any) => {
    //         req.user = {id: 'test-user-id', role: 'user'};
    //         res.status(403).json({error: 'Forbidden: Insufficient permissions.'});
    //     });

    //     const res = await request(testApp)
    //         .post('/api/admin/roles')
    //         .send({name: 'Unauthorized Role'});

    //     expect(res.statusCode).toEqual(403);
    //     expect(res.body.error).toEqual('Forbidden: Insufficient permissions.');
    // });
});

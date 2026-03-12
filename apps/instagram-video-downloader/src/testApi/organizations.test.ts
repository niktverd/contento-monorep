import request from 'supertest';

import testApp from '../../app';

import {getUserTokenHeader, prepareRoute} from './utils/common';
import {createOrganizationHelper} from './utils/organization';

import {db as knex} from '#src/db/utils';
import {fullRoutes} from '#src/types/routes/organization';
import {IOrganization} from '#types';

// Mock Firebase authentication for testing
jest.mock('#config/firebase', () => ({
    admin: {
        auth: () => ({
            verifyIdToken: jest.fn().mockResolvedValue({
                uid: 'test-uid-123',
                email: 'test@example.com',
                email_verified: true,
                name: 'Test User',
            }),
        }),
    },
}));

const {get, create, list, update, delete: deleteRoute, listByUid} = fullRoutes;
// Mock authentication middleware for testing
// jest.mock('#src/middleware/auth');

describe('Organization Management API', () => {
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
        // Clean up organizations table after each test
        await knex('organizations').del();
        // systemAdminAuthSpy.mockRestore(); // Restore the original implementation after each test
    });

    it('should create a new organization', async () => {
        const res = await request(testApp)
            .post(prepareRoute(create))
            .set(getUserTokenHeader())
            .send({name: 'Test Organization'});

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toEqual('Test Organization');
    });

    it('should get all organizations', async () => {
        await createOrganizationHelper({name: 'Org A'}, testApp);
        await createOrganizationHelper({name: 'Org B'}, testApp);

        const res = await request(testApp).get(prepareRoute(list)).set(getUserTokenHeader());

        expect(res.statusCode).toEqual(200);
        const names = res.body.map((o: IOrganization) => o.name);
        expect(names).toEqual(expect.arrayContaining(['Org A', 'Org B']));
    });

    it('should get an organization by ID', async () => {
        const org = await createOrganizationHelper({name: 'Org C'}, testApp);

        const res = await request(testApp)
            .get(`${prepareRoute(get)}?id=${(org.body as IOrganization).id}`)
            .set(getUserTokenHeader());

        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Org C');
    });

    it('should update an organization', async () => {
        const org = await createOrganizationHelper({name: 'Org D'}, testApp);

        const res = await request(testApp)
            .patch(prepareRoute(update))
            .set(getUserTokenHeader())
            .send({
                id: (org.body as IOrganization).id,
                name: 'Updated Org D',
                userId: 1, // это не правильно
                roleIds: [], // это не правильно
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Updated Org D');
    });

    it('should delete an organization', async () => {
        const org = await createOrganizationHelper({name: 'Org E'}, testApp);
        const res = await request(testApp)
            .delete(`${prepareRoute(deleteRoute)}/?id=${(org.body as IOrganization).id}`)
            .set(getUserTokenHeader());

        expect(res.statusCode).toEqual(204);

        const res2 = await request(testApp)
            .get(`${prepareRoute(get)}?id=${(org.body as IOrganization).id}`)
            .set(getUserTokenHeader());
        expect(res2.statusCode).toEqual(404);
        expect(res2.body.error).toEqual('Organization not found');
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
        const org = await createOrganizationHelper({name: 'Org F'}, testApp);
        const res = await request(testApp)
            .patch(prepareRoute(update))
            .send({id: (org as unknown as IOrganization).id})
            .set(getUserTokenHeader());

        expect(res.statusCode).toEqual(477);
        expect(res.body.error.includes('Validation failed')).toBe(true);
    });

    it('should return 404 if organization not found for get by ID', async () => {
        const res = await request(testApp)
            .get(`${prepareRoute(get)}?id=999`)
            .set(getUserTokenHeader());
        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toEqual('Organization not found');
    });

    it('should return 477 if organization not found for update', async () => {
        const res = await request(testApp)
            .patch(prepareRoute(update))
            .send({name: 'Updated organization'})
            .set(getUserTokenHeader());
        expect(res.statusCode).toEqual(477);
        expect(res.body.error.includes('Validation failed')).toBe(true);
    });

    it('should return 404 if organization not found for delete', async () => {
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
    //         .post('/api/admin/organizations')
    //         .send({name: 'Unauthorized Org'});

    //     expect(res.statusCode).toEqual(403);
    //     expect(res.body.error).toEqual('Forbidden: Insufficient permissions.');
    // });
});

describe('GET /organization/list-by-uid', () => {
    beforeEach(async () => {
        // Clean up all related tables after each test
        await knex('userOrganizationRoles').del();
        await knex('organizations').del();
        await knex('users').del();
        await knex('roles').del();
    });

    it('should return organizations for a user with valid UID', async () => {
        // Create a test role first
        const testRole = await knex('roles')
            .insert({
                name: 'Test Role',
                description: 'Test role for testing',
                permissions: [],
            })
            .returning('*');

        // Create test user
        const testUser = await knex('users')
            .insert({
                email: 'test@example.com',
                name: 'Test User',
                uid: 'test-uid-123',
            })
            .returning('*');

        // Create test organizations
        const org1 = await knex('organizations')
            .insert({
                name: 'Test Org 1',
            })
            .returning('*');

        const org2 = await knex('organizations')
            .insert({
                name: 'Test Org 2',
            })
            .returning('*');

        // Link user to organizations through userOrganizationRoles
        await knex('userOrganizationRoles').insert([
            {userId: testUser[0].id, organizationId: org1[0].id, roleId: testRole[0].id},
            {userId: testUser[0].id, organizationId: org2[0].id, roleId: testRole[0].id},
        ]);

        const res = await request(testApp)
            .get(`${prepareRoute(listByUid)}?uid=test-uid-123`)
            .set('Authorization', 'Bearer test-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].name).toEqual('Test Org 1');
        expect(res.body[1].name).toEqual('Test Org 2');
    });

    it('should return empty array for user with no organizations', async () => {
        // Create test user with no organizations
        await knex('users').insert({
            email: 'test@example.com',
            name: 'Test User',
            uid: 'test-uid-no-orgs',
        });

        const res = await request(testApp)
            .get(`${prepareRoute(listByUid)}?uid=test-uid-no-orgs`)
            .set('Authorization', 'Bearer test-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveLength(0);
    });

    it('should return 404 for non-existent UID', async () => {
        const res = await request(testApp)
            .get(`${prepareRoute(listByUid)}?uid=non-existent-uid`)
            .set('Authorization', 'Bearer test-token');

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toEqual('User not found');
    });

    it('should return 401/403 for unauthenticated request', async () => {
        const res = await request(testApp).get(`${prepareRoute(listByUid)}?uid=test-uid-123`);

        expect(res.statusCode).toEqual(401);
    });
});

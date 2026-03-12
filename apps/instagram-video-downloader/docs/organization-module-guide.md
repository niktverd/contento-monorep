## Organization Module — Golden Structure Guide

### Purpose

- **Goal**: Single-source reference for how a feature module should be structured (files, helpers, permissions, types, models, utils) and how requests flow end-to-end.
- **Scope**: Organization CRUD, membership, listing by UID; serves as a pattern to split large modules into small focused parts.

### High-level Flow

- **Request** → `middleware` (`isSuperAdmin?`, `authMiddleware`, `checkPermissions`) → `controller` (thin wrapper via `wrapper`) → `db service` (business logic) → `models` (Objection ORM) → Response

### File Map (what/where/why)

- `src/sections/organization/routes.ts`
  - Express router; wires endpoints to controller handlers.
  - Declares `OrganizationPermissions` enum and applies middlewares per route.
  - Uses typed route fragments from `src/types/routes/organization.ts`.
- `src/sections/organization/organizations.controller.ts`
  - Exports thin handlers using `wrapper<TReq, TRes>(service, zodSchema, method)`.
  - No business logic; only validation + service delegation.
- `src/db/organization.ts`
  - DB/service layer functions (the only place with business logic + data access):
    - `createOrganization(params)` → {code: 200, result: IOrganization}
    - `getOrganizationById({id})` → {code: 200, result: IOrganization & {users}}
    - `getAllOrganizations()` → {code: 200, result: IOrganization[]}
    - `updateOrganization({id, name})` → {code: 200, result: IOrganization}
    - `deleteOrganization({id})` → {code: 204, result: number}
    - `addUserWithRoleToOrganization({organizationId, userId, roleIds})` → {code: 200, result: IOrganization}
    - `deleteUserFromOrganization({organizationId, userId})` → {code: 200, result: IOrganization}
    - `getOrganizationsByUserUid({uid})` → {code: 200, result: IOrganization[]}
  - Helpers used: `ThrownError` for 4xx, Objection models, `uniqBy` for dedupe.
- `src/db/models/Organization.ts`
  - Objection model `Organization` with table `organizations` and ManyToMany relation `users` via `userOrganizationRoles`.
- `src/db/models/User.ts`
  - Objection model `User` with `organizations` and `roles` ManyToMany via `userOrganizationRoles` and direct `userOrganizationRoles` HasMany.
- `src/db/models/Role.ts`
  - Objection model `Role`; `permissions` is JSONB (`jsonAttributes`).
- `src/db/models/UserOrganizationRole.ts`
  - Join model for `userId`, `organizationId`, `roleId` over table `userOrganizationRoles`.
- `src/types/schemas/models/organization.ts`
  - `OrganizationSchema` via `createEntitySchema({ name: z.string() })`.
  - `IOrganization` type inferred.
- `src/types/schemas/handlers/organization.ts`
  - Zod request schemas and response types:
    - Create, GetById, Update, Delete, ListAll, ListByUid
    - Membership: AddUserWithRoleToOrganization, DeleteUserFromOrganization
  - `OrganizationRelationSchema` defines related shapes (currently `users`).
- `src/types/routes/base.ts`
  - Shared route fragments: `{create, get, list, update, delete}`.
- `src/types/routes/organization.ts`
  - `rootName = '/organization'`; composes module routes: `addUserWithRolesToOrganization`, `deletUserFromOrganization` (typo), `listByUid`.
  - `fullRoutes = getFullRoutes({rootName, routes})` provides prefixed routes for tests/clients.
- `src/types/routes/utils.ts`
  - `getFullRoutes` utility that prefixes route fragments with the root.
- `src/middleware.ts`
  - `authMiddleware`: verifies Firebase token; populates `res.locals.user` basic fields.
  - `isSuperAdmin`: compares base64 `x-user-token` with `SUPER_ADMIN_SECRET`; sets `isSuperAdmin`.
  - `checkPermissions(requiredPermission)`: resolves user + org, loads roles, computes permissions set, enforces `requiredPermission`.
  - `requireOrganizationHeader`: enforces and parses `x-organization-id` header.
- `src/db/utils.ts`
  - `getDb()`, `initializeDb()`; HTTP handler `wrapper` for validation+errors; org helpers: `scopeByOrg`, `assertSameOrg`.
- Migrations
  - `src/db/migrations/20250729063412_create_organizations_table.js`
    - Creates `organizations (id, name unique, createdAt, updatedAt)`.
  - `src/db/migrations/20250807210853_migrate_tables_to_organization.js`
    - Adds `organizationId` to many tables, sets FK+indexes, seeds `Internal` org, enforces non-null.

### Endpoints Reference (paths, permissions, handlers)

- POST `'/organization/create'`
  - Middlewares: `isSuperAdmin`, `authMiddleware`, `checkPermissions(EditOrganization)`
  - Handler: `createOrganizationPost` → `createOrganization`
- POST `'/organization/add-user-with-roles-to-organization'`
  - Middlewares: `isSuperAdmin`, `authMiddleware`, `checkPermissions(EditOrganization)`
  - Handler: `addUserWithRoleToOrganizationPost` → `addUserWithRoleToOrganization`
- GET `'/organization/list'`
  - Middlewares: `isSuperAdmin`, `authMiddleware`, `checkPermissions(GetOrganizations)`
  - Handler: `getOrganizationsGet` → `getAllOrganizations`
- GET `"/organization/get"`
  - Middlewares: `isSuperAdmin`, `authMiddleware`, `checkPermissions(GetOrganizations)`
  - Handler: `getOrganizationByIdGet` → `getOrganizationById`
- PATCH `"/organization/update"`
  - Middlewares: `isSuperAdmin`, `authMiddleware`, `checkPermissions(EditOrganization)`
  - Handler: `updateOrganizationPatch` → `updateOrganization`
- DELETE `"/organization/delete"`
  - Middlewares: `isSuperAdmin`, `authMiddleware`, `checkPermissions(EditOrganization)`
  - Handler: `deleteOrganizationDelete` → `deleteOrganization`
- DELETE `"/organization/delete-user-from-organization"` (note typo key in routes: `deletUserFromOrganization`)
  - Middlewares: `isSuperAdmin`, `authMiddleware`, `checkPermissions(EditOrganization)`
  - Handler: `deleteUserFromOrganizationDelete` → `deleteUserFromOrganization`
- GET `"/organization/list-by-uid"`
  - Middlewares: `authMiddleware`
  - Handler: `getOrganizationsByUserUidGet` → `getOrganizationsByUserUid`

### Permissions Model

- Enum (local): `OrganizationPermissions` with values:
  - `organizations.edit`
  - `organizations.get`
- Enforcement: `checkPermissions(requiredPermission)`:
  - If `isSuperAdmin`: bypass.
  - Else: obtain `organizationId` from `x-organization-id`; fetch or create user; ensure user belongs to org; aggregate `role.permissions` into a set; check inclusion.
- Data source: `roles.permissions` JSONB array in `roles` table.

### Controller Pattern (thin, typed)

- Use `wrapper<Req, Res>(serviceFn, zodSchema, method)` per endpoint.
- `wrapper` responsibilities:
  - Validate `req.body` for POST/PATCH and `req.query` for GET/DELETE using Zod schema.
  - Coerce `id` query param to number.
  - Pass `user` and `organizationId` from `res.locals` into the service context.
  - Map `{code, result}` to `res.status(code).json(result)`; handles `ThrownError` → `code` and message.

### Service Layer Pattern

- Signature: `ApiFunctionPrototype<RequestArgs, ResponseArgs>` → `(params, db, ctx?) => { code, result }`.
- Only place to write business logic and DB transactions.
- Prefer small, focused functions; compose via internal helpers if needed.
- Throw `new ThrownError(message, code)` for domain/client errors (404/400/etc.).

### Models & Relations (Objection)

- `Organization` — `tableName = 'organizations'`; relations:
  - `users`: ManyToMany via `userOrganizationRoles` (through: `organizationId`/`userId`).
- `User` — relations:
  - `userOrganizationRoles`: HasMany.
  - `organizations`: ManyToMany via `userOrganizationRoles` (through: `userId` → `organizationId`).
  - `roles`: ManyToMany via `userOrganizationRoles` (through: `userId` → `roleId`).
- `Role` — JSONB `permissions`, HasMany `userOrganizationRoles`.
- `UserOrganizationRole` — join entity with `userId`, `organizationId`, `roleId`.

### Types & Schemas (Zod + TS)

- Models: `OrganizationSchema` extends `BaseEntitySchema` (`id`, timestamps) with `name`.
- Handlers: strict request schemas for each endpoint; response types inferred from schemas.
- Route constants: `baseRoutes` + module `routes` + `getFullRoutes` to generate path strings for tests/clients.

### Utilities (DB helpers)

- `wrapper` for controllers (validation, method gate, error handling).
- `scopeByOrg(query, organizationId)` — injects `where('organizationId', organizationId)` chain.
- `assertSameOrg(dbOrTrx, organizationId, {entityName, id})` — guards cross-org access.

### Testing Hooks

- Tests use `fullRoutes` and test helpers (`testApi/utils/common`, `testApi/utils/organization`):
  - Mock Firebase in tests; call endpoints via `prepareRoute(fullRoutes.*)`.
  - Example test file: `src/testApi/organizations.test.ts` (CRUD, validations, listByUid flows).

### Splitting Big Modules — Recommended Structure

- Controllers (keep thin): `src/sections/<feature>/*.controller.ts`
- Routes: `src/sections/<feature>/routes.ts`
- Services (split by concern):
  - `src/db/<feature>/organization.crud.ts` — create/get/list/update/delete
  - `src/db/<feature>/organization.membership.ts` — add/remove users/roles
  - `src/db/<feature>/organization.queries.ts` — cross-entity queries (e.g., listByUid)
  - Index barrel `src/db/organization.ts` re-exports public API to preserve imports
- Schemas: `src/types/schemas/handlers/<feature>.ts` (group by endpoint)
- Models: `src/db/models/*.ts` (shared across modules)
- Permissions: colocate enums next to `routes.ts` or hoist shared perms into `src/types/routes/role.ts` if reused
- Route constants: `src/types/routes/<feature>.ts`

### Conventions & Notes

- Prefer consistent `{code, result}` in service returns. Normalize any `{status}` keys to `code`.
- Keep controllers free of business logic; all domain decisions live in services.
- Always validate inputs with Zod and keep schemas strict.
- Use `x-organization-id` header for org-scoped endpoints unless `isSuperAdmin`.
- Naming: fix typos like `deletUserFromOrganization` when performing refactors (keep route backward-compat if public).
- Transactions: keep write ops inside `db.transaction(async trx => ...)`.
- Relations: fetch with `withGraphFetched('users.[roles]')` sparingly; add modifiers if N+1/perf becomes an issue.

### Minimal Template to Add a New Feature Module

- `src/types/routes/<feature>.ts` — rootName + route fragments + `fullRoutes`
- `src/types/schemas/handlers/<feature>.ts` — zod schemas + types
- `src/sections/<feature>/<feature>.controller.ts` — `wrapper`-based handlers
- `src/sections/<feature>/routes.ts` — express router + middlewares + permissions enum
- `src/db/<feature>.ts` — service functions (or split by concern + index re-export)
- Models in `src/db/models/*.ts` if new tables are needed; add migrations
- Tests in `src/testApi/*.test.ts` using `fullRoutes`

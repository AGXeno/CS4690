# Student Logs — Multi-Tenant Web App

A role-based, multi-tenant student-logs system for **UVU** and **UofU**. Each
tenant gets its own catalog, branding, and isolated data; users are scoped to a
single school by an enum on their record (per the practicum spec).

## Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Auth**: JWT (bcrypt-hashed passwords, 8h tokens, cross-tenant guard)
- **Frontend**: TypeScript → vanilla JS, jQuery, Bootstrap 5.3
- **Tests**: Mocha + supertest (13 tests covering auth, RBAC, tenant isolation)

## Quick start

```bash
npm install
echo "MONGO_URI=mongodb://localhost:27017/student_logs" > .env
echo "JWT_SECRET=dev-secret-change-me" >> .env
npm run seed       # populates both tenants with users, courses, sample logs
npm run server     # http://localhost:3000
```

Open one of:

- UVU  → <http://localhost:3000/uvu/login>
- UofU → <http://localhost:3000/uofu/login>

## Test credentials

All passwords are deliberately memorable for grading.

| Tenant | Role    | Username       | Password |
| ------ | ------- | -------------- | -------- |
| UVU    | admin   | `root_uvu`     | `willy`  |
| UVU    | teacher | `prof_uvu`     | `teach`  |
| UVU    | student | `student_uvu`  | `learn`  |
| UofU   | admin   | `root_uofu`    | `swoopy` |
| UofU   | teacher | `prof_uofu`    | `teach`  |
| UofU   | student | `student_uofu` | `learn`  |

## Multi-tenancy at a glance

The professor's spec calls for a User collection with `role` and `tenant`
enums. Both live on `models/User.js`:

```js
role:   { enum: ['admin', 'teacher', 'student'], required: true }
tenant: { enum: ['uvu', 'uofu'],                 required: true }
```

The tenant is also part of every URL — pages at `/:tenant/{login,admin,teacher,student}`,
APIs at `/api/:tenant/{auth,users,courses,logs}`. Middleware enforces that a
JWT's `tenant` claim matches the URL tenant on every protected request, so a
UVU token can never read UofU data.

The two schools intentionally render their course catalogs differently —
UVU uses its published catalog format ("CS 3380. JavaScript Software Development. (3 Credits)"),
UofU uses its requirements-page format with "Required Requisite(s):", "Semesters
Typically Offered:", and so on. Multi-tenancy isn't just a CSS swap.

## Repo layout

```
models/         Mongoose schemas (User, Course, Log)
routes/         Express routers — auth, users, courses, logs
repositories/   Tenant-scoped data accessors
middleware/     auth.js (tenant + JWT), rbac.js (role gating)
server.js       Wires routes, validates :tenant, serves /public
seed.js         Drops + re-seeds both catalogs and the test users above
src/ts/         TypeScript source for the dashboards
public/         HTML, CSS, compiled JS, tenant logos
test/           Mocha integration tests (auth, RBAC, tenant isolation)
```

## Running the tests

```bash
npm test
```

13 tests across three suites: `Authentication`, `Tenant Isolation`, `RBAC`.
Each suite spins up its own MongoDB connection and tears down after.

## Security model (short)

- Passwords hashed with bcrypt (cost 10); never returned in JSON.
- JWT carries `userId`, `username`, `role`, `tenant`. The token's `tenant`
  must match the URL tenant on every API call — enforced in `middleware/auth.js`.
- Role-based access is enforced server-side via `requireRole(...)` on each
  route. Failed attempts return 403 with `forceLogout: true`, which the client
  uses to redirect to login.
- Self-signup is restricted to `student` and `teacher`. Admins are created
  only by other admins.

## Notes for the grader

- Per the prof's clarification, JWT and OAuth2 are not strictly required for
  the final project. JWT is used here because it was already wired and gives a
  cleaner cross-tenant story than session cookies.
- The UofU catalog is the live requirements export from the Kahlert School
  of Computing, with course titles filled in only where cross-listings made
  them unambiguous. UVU's catalog is the official course listings.

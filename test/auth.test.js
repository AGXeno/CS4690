const assert = require('assert');
const supertest = require('supertest');
const app = require('../server');
const { setupTestDb, teardownTestDb } = require('./setup');

let request;

describe('Authentication', function () {
  before(async function () {
    await setupTestDb();
    request = supertest(app);
  });

  after(async function () {
    await teardownTestDb();
  });

  describe('POST /api/:tenant/auth/login', function () {
    it('should login with valid credentials', async function () {
      const res = await request
        .post('/api/uvu/auth/login')
        .send({ username: 'root_uvu', password: 'willy' });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.username, 'root_uvu');
      assert.strictEqual(res.body.user.role, 'admin');
      assert.strictEqual(res.body.user.tenant, 'uvu');
    });

    it('should reject invalid password', async function () {
      const res = await request
        .post('/api/uvu/auth/login')
        .send({ username: 'root_uvu', password: 'wrong' });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'Invalid credentials');
    });

    it('should reject non-existent user', async function () {
      const res = await request
        .post('/api/uvu/auth/login')
        .send({ username: 'nobody', password: 'test' });

      assert.strictEqual(res.status, 401);
    });

    it('should not allow UVU admin to login on UofU tenant', async function () {
      const res = await request
        .post('/api/uofu/auth/login')
        .send({ username: 'root_uvu', password: 'willy' });

      assert.strictEqual(res.status, 401);
    });
  });

  describe('POST /api/:tenant/auth/signup', function () {
    it('should create a new student account', async function () {
      const res = await request
        .post('/api/uvu/auth/signup')
        .send({ username: 'teststudent', password: 'pass123', role: 'student' });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.role, 'student');
      assert.strictEqual(res.body.user.tenant, 'uvu');
    });

    it('should reject admin self-registration', async function () {
      const res = await request
        .post('/api/uvu/auth/signup')
        .send({ username: 'hacker', password: 'pass', role: 'admin' });

      assert.strictEqual(res.status, 403);
    });

    it('should reject duplicate username in same tenant', async function () {
      const res = await request
        .post('/api/uvu/auth/signup')
        .send({ username: 'teststudent', password: 'pass', role: 'student' });

      assert.strictEqual(res.status, 409);
    });
  });
});

describe('Tenant Isolation', function () {
  let uvuToken;

  before(async function () {
    await setupTestDb();
    request = supertest(app);

    const res = await request
      .post('/api/uvu/auth/login')
      .send({ username: 'root_uvu', password: 'willy' });
    uvuToken = res.body.token;
  });

  after(async function () {
    await teardownTestDb();
  });

  it('should allow UVU token to access UVU courses', async function () {
    const res = await request
      .get('/api/uvu/courses')
      .set('Authorization', `Bearer ${uvuToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it('should block UVU token from accessing UofU courses', async function () {
    const res = await request
      .get('/api/uofu/courses')
      .set('Authorization', `Bearer ${uvuToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.forceLogin, true);
  });

  it('should reject requests with no token', async function () {
    const res = await request.get('/api/uvu/courses');

    assert.strictEqual(res.status, 401);
  });
});

describe('RBAC', function () {
  let studentToken;

  before(async function () {
    await setupTestDb();
    request = supertest(app);

    // Create a student
    const res = await request
      .post('/api/uvu/auth/signup')
      .send({ username: 'rbacstudent', password: 'pass', role: 'student' });
    studentToken = res.body.token;
  });

  after(async function () {
    await teardownTestDb();
  });

  it('should block student from creating courses', async function () {
    const res = await request
      .post('/api/uvu/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ id: 'cs9999', display: 'Hacked Course' });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.forceLogout, true);
  });

  it('should block student from viewing users list', async function () {
    const res = await request
      .get('/api/uvu/users')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 403);
  });

  it('should block student from creating users', async function () {
    const res = await request
      .post('/api/uvu/users')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ username: 'evil', password: 'pass', role: 'admin' });

    assert.strictEqual(res.status, 403);
  });
});

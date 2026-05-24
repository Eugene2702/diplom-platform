/**
 * Functional tests — Authentication & Authorization (6 кейсов, таблица 4.1 ВКР).
 *
 *   TC-01  Login with correct credentials → 200 + JWT
 *   TC-02  Login with wrong password     → 401
 *   TC-03  Protected endpoint without JWT → 401
 *   TC-04  Student tries to create a project → 403 (RBAC)
 *   TC-05  Deactivated user cannot log in → 403
 *   TC-06  Admin creates a user → 201 + record in DB
 */
const request = require('supertest');
const app = require('../src/app');
const { resetDb, closeDb } = require('./helpers/db');
const { makeUser, makeUserWithToken, PASSWORD } = require('./helpers/factory');
const { User } = require('../src/models');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

describe('TC-01 Login with correct credentials', () => {
  it('returns 200 and a JWT token', async () => {
    const user = await makeUser({ email: 'tc01@test.local', role: 'admin' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: user.email, role: 'admin' });
    expect(res.body.user.password).toBeUndefined();
  });
});

describe('TC-02 Login with wrong password', () => {
  it('returns 401 and an error message', async () => {
    await makeUser({ email: 'tc02@test.local' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tc02@test.local', password: 'WRONG_PASSWORD' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/неверн/i);
  });
});

describe('TC-03 Protected endpoint without JWT', () => {
  it('returns 401 for /api/auth/me when token is missing', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 for /api/projects when token is missing', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});

describe('TC-04 Student attempts to create a project', () => {
  it('returns 403 Forbidden (RBAC blocks non-supervisors)', async () => {
    const { token } = await makeUserWithToken({ role: 'student' });
    const supervisor = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Попытка создать',
        studentId: student.id,
        supervisorId: supervisor.id,
      });

    expect(res.status).toBe(403);
  });
});

describe('TC-06 Admin creates a user', () => {
  it('returns 201 and persists the user in DB', async () => {
    const { token } = await makeUserWithToken({ role: 'admin' });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'new_student@test.local',
        password: 'newpass123',
        firstName: 'Новый',
        lastName: 'Студент',
        role: 'student',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: 'new_student@test.local',
      role: 'student',
    });

    const persisted = await User.findOne({ where: { email: 'new_student@test.local' } });
    expect(persisted).not.toBeNull();
    expect(persisted.role).toBe('student');
  });
});

describe('TC-05 Deactivated user cannot log in', () => {
  it('blocks login when isActive=false', async () => {
    await makeUser({ email: 'deactivated@test.local', isActive: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'deactivated@test.local', password: PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/деактивир/i);
  });
});

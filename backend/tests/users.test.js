/**
 * Functional tests — Users management (4 кейса, таблица 4.1 ВКР).
 *
 *   TC-07  Admin lists users with role filter
 *   TC-08  Admin updates user (firstName/role change)
 *   TC-09  Admin deactivates user → DELETE behaves as soft-delete (isActive=false)
 *   TC-10  /users endpoints require admin role (supervisor & student → 403)
 */
const request = require('supertest');
const app = require('../src/app');
const { resetDb, closeDb } = require('./helpers/db');
const { makeUser, makeUserWithToken } = require('./helpers/factory');
const { User } = require('../src/models');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

describe('TC-07 Admin lists users with role filter', () => {
  it('returns paginated list and filters by role', async () => {
    const { token } = await makeUserWithToken({ role: 'admin' });
    await makeUser({ role: 'student' });
    await makeUser({ role: 'student' });
    await makeUser({ role: 'supervisor' });

    const all = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(all.status).toBe(200);
    expect(all.body.users.length).toBeGreaterThanOrEqual(4);

    const studentsOnly = await request(app)
      .get('/api/users?role=student')
      .set('Authorization', `Bearer ${token}`);
    expect(studentsOnly.status).toBe(200);
    expect(studentsOnly.body.users.every((u) => u.role === 'student')).toBe(true);
    expect(studentsOnly.body.users.length).toBe(2);
  });
});

describe('TC-08 Admin updates user', () => {
  it('changes firstName and role', async () => {
    const { token } = await makeUserWithToken({ role: 'admin' });
    const target = await makeUser({ role: 'student', firstName: 'Старое' });

    const res = await request(app)
      .put(`/api/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Новое', role: 'supervisor' });

    expect(res.status).toBe(200);
    expect(res.body.user.firstName).toBe('Новое');
    expect(res.body.user.role).toBe('supervisor');
  });
});

describe('TC-09 Admin deactivates a user via DELETE (soft-delete)', () => {
  it('sets isActive=false and blocks subsequent login', async () => {
    const { token } = await makeUserWithToken({ role: 'admin' });
    const target = await makeUser({ email: 'softdel@test.local', role: 'student' });

    const del = await request(app)
      .delete(`/api/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const reloaded = await User.findByPk(target.id);
    expect(reloaded.isActive).toBe(false);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: target.email, password: 'test123456' });
    expect(login.status).toBe(403);
  });
});

describe('TC-10 Non-admin cannot manage users', () => {
  it('returns 403 for supervisor and student', async () => {
    const { token: supToken } = await makeUserWithToken({ role: 'supervisor' });
    const { token: stuToken } = await makeUserWithToken({ role: 'student' });

    const a = await request(app).get('/api/users').set('Authorization', `Bearer ${supToken}`);
    const b = await request(app).get('/api/users').set('Authorization', `Bearer ${stuToken}`);

    expect(a.status).toBe(403);
    expect(b.status).toBe(403);
  });
});

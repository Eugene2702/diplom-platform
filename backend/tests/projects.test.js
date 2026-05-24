/**
 * Functional tests — Projects (5 кейсов, таблица 4.1 ВКР).
 *
 *   TC-11  Supervisor creates project bound to a student → 201
 *   TC-12  Student sees ONLY own projects in /api/projects
 *   TC-13  Student gets 403 when opening someone else's project
 *   TC-14  Supervisor updates project status to 'completed'
 *   TC-15  /api/projects/stats returns counts scoped to caller's role
 */
const request = require('supertest');
const app = require('../src/app');
const { resetDb, closeDb } = require('./helpers/db');
const {
  makeUser,
  makeUserWithToken,
  makeProject,
  tokenFor,
} = require('./helpers/factory');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

describe('TC-11 Supervisor creates a project bound to a student', () => {
  it('returns 201 and persists studentId/supervisorId', async () => {
    const { user: supervisor, token } = await makeUserWithToken({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Платформа управления ВКР',
        shortDescription: 'Краткое описание',
        studentId: student.id,
        supervisorId: supervisor.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.project).toMatchObject({
      title: 'Платформа управления ВКР',
      studentId: student.id,
      supervisorId: supervisor.id,
      status: 'active',
    });
  });
});

describe('TC-12 Student sees only own projects', () => {
  it('filters the listing to studentId = req.user.id', async () => {
    const supervisor = await makeUser({ role: 'supervisor' });
    const ownStudent = await makeUser({ role: 'student' });
    const otherStudent = await makeUser({ role: 'student' });

    await makeProject({ student: ownStudent, supervisor, title: 'Мой' });
    await makeProject({ student: otherStudent, supervisor, title: 'Чужой' });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenFor(ownStudent)}`);

    expect(res.status).toBe(200);
    expect(res.body.projects.length).toBe(1);
    expect(res.body.projects[0].title).toBe('Мой');
  });
});

describe('TC-13 Student cannot open someone else\'s project', () => {
  it('returns 403 when project.studentId !== req.user.id', async () => {
    const supervisor = await makeUser({ role: 'supervisor' });
    const owner = await makeUser({ role: 'student' });
    const intruder = await makeUser({ role: 'student' });
    const { project } = await makeProject({ student: owner, supervisor });

    const res = await request(app)
      .get(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${tokenFor(intruder)}`);

    expect(res.status).toBe(403);
  });
});

describe('TC-14 Supervisor updates project status', () => {
  it('changes status to completed', async () => {
    const supervisor = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });
    const { project } = await makeProject({ student, supervisor });

    const res = await request(app)
      .put(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.project.status).toBe('completed');
  });
});

describe('TC-15 Stats endpoint returns role-scoped counts', () => {
  it('counts only own projects for supervisor', async () => {
    const supervisorA = await makeUser({ role: 'supervisor' });
    const supervisorB = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });

    await makeProject({ student, supervisor: supervisorA, title: 'A1' });
    await makeProject({ student, supervisor: supervisorA, title: 'A2', status: 'completed' });
    await makeProject({ student, supervisor: supervisorB, title: 'B1' });

    const res = await request(app)
      .get('/api/projects/stats')
      .set('Authorization', `Bearer ${tokenFor(supervisorA)}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.active).toBe(1);
    expect(res.body.completed).toBe(1);
  });
});

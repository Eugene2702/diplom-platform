/**
 * Functional tests — Stages (5 кейсов, таблица 4.1 ВКР).
 *
 *   TC-16  Supervisor creates a stage with deadline → 201
 *   TC-17  Status change creates a notification for the student
 *   TC-18  POST /stages/check-overdue marks past stages as 'overdue'
 *   TC-19  Completed stage stays 'completed' after check-overdue
 *   TC-20  Stages are returned ordered by orderIndex ASC
 */
const request = require('supertest');
const app = require('../src/app');
const { resetDb, closeDb } = require('./helpers/db');
const {
  makeUser,
  makeUserWithToken,
  makeProject,
  makeStage,
  tokenFor,
} = require('./helpers/factory');
const { Notification, Stage } = require('../src/models');

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

describe('TC-16 Supervisor creates a stage', () => {
  it('returns 201 and persists the deadline', async () => {
    const supervisor = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });
    const { project } = await makeProject({ student, supervisor });

    const res = await request(app)
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`)
      .send({
        title: 'Анализ предметной области',
        deadline: '2026-03-01',
        orderIndex: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.stage).toMatchObject({
      title: 'Анализ предметной области',
      deadline: '2026-03-01',
      status: 'not_started',
      orderIndex: 1,
    });
  });
});

describe('TC-17 Status change creates a notification', () => {
  it('inserts a Notification row for the project student', async () => {
    const supervisor = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });
    const { project } = await makeProject({ student, supervisor });
    const stage = await makeStage(project.id, { status: 'not_started' });

    const before = await Notification.count();

    const res = await request(app)
      .put(`/api/stages/${stage.id}`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.stage.status).toBe('in_progress');

    const notifs = await Notification.findAll({ where: { userId: student.id } });
    expect(notifs.length).toBe(before + 1);
    expect(notifs[notifs.length - 1].type).toBe('status_changed');
    expect(notifs[notifs.length - 1].projectId).toBe(project.id);
  });
});

describe('TC-18 check-overdue updates past-deadline stages', () => {
  it('marks not_started/in_progress stages with past deadlines as overdue', async () => {
    const supervisor = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });
    const { token } = await makeUserWithToken({ role: 'admin' });
    const { project } = await makeProject({ student, supervisor });

    const pastStage = await makeStage(project.id, {
      title: 'Просроченный',
      deadline: '2024-01-01',
      status: 'in_progress',
    });
    const futureStage = await makeStage(project.id, {
      title: 'Будущий',
      deadline: '2099-01-01',
      status: 'not_started',
      orderIndex: 2,
    });

    const res = await request(app)
      .post('/api/stages/check-overdue')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.updated).toBeGreaterThanOrEqual(1);

    const reloaded = await Stage.findByPk(pastStage.id);
    expect(reloaded.status).toBe('overdue');

    const future = await Stage.findByPk(futureStage.id);
    expect(future.status).toBe('not_started');
  });
});

describe('TC-19 Completed stage is not touched by check-overdue', () => {
  it('keeps status=completed even if deadline is in the past', async () => {
    const supervisor = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });
    const { token } = await makeUserWithToken({ role: 'admin' });
    const { project } = await makeProject({ student, supervisor });

    const completed = await makeStage(project.id, {
      title: 'Сдан в срок',
      deadline: '2024-01-01',
      status: 'completed',
    });

    await request(app)
      .post('/api/stages/check-overdue')
      .set('Authorization', `Bearer ${token}`);

    const reloaded = await Stage.findByPk(completed.id);
    expect(reloaded.status).toBe('completed');
  });
});

describe('TC-20 Stages list is ordered by orderIndex ASC', () => {
  it('returns stages in ascending orderIndex', async () => {
    const supervisor = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });
    const { project } = await makeProject({ student, supervisor });

    await makeStage(project.id, { title: 'Третий', orderIndex: 3, deadline: '2026-06-01' });
    await makeStage(project.id, { title: 'Первый', orderIndex: 1, deadline: '2026-03-01' });
    await makeStage(project.id, { title: 'Второй', orderIndex: 2, deadline: '2026-04-01' });

    const res = await request(app)
      .get(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`);

    expect(res.status).toBe(200);
    expect(res.body.stages.map((s) => s.title)).toEqual(['Первый', 'Второй', 'Третий']);
  });
});

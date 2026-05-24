/**
 * Test-data factories: create users, projects, stages and obtain JWTs for them.
 */
const jwt = require('jsonwebtoken');
const { User, Project, Stage, AcademicYear } = require('../../src/models');

const PASSWORD = 'test123456';

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function makeUser(overrides = {}) {
  const suffix = Math.random().toString(36).slice(2, 10);
  const user = await User.create({
    email: overrides.email || `user_${suffix}@test.local`,
    password: overrides.password || PASSWORD,
    firstName: overrides.firstName || 'Имя',
    lastName: overrides.lastName || 'Фамилия',
    patronymic: overrides.patronymic,
    role: overrides.role || 'student',
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
  return user;
}

async function makeUserWithToken(overrides = {}) {
  const user = await makeUser(overrides);
  return { user, token: tokenFor(user) };
}

async function makeAcademicYear(overrides = {}) {
  return AcademicYear.create({
    name: overrides.name || '2025-2026',
    startDate: overrides.startDate || '2025-09-01',
    endDate: overrides.endDate || '2026-06-30',
    isCurrent: overrides.isCurrent ?? true,
  });
}

async function makeProject(overrides = {}) {
  const student = overrides.student || (await makeUser({ role: 'student' }));
  const supervisor = overrides.supervisor || (await makeUser({ role: 'supervisor' }));
  const project = await Project.create({
    title: overrides.title || 'Тестовый проект',
    shortDescription: overrides.shortDescription,
    studentId: student.id,
    supervisorId: supervisor.id,
    academicYearId: overrides.academicYearId,
    status: overrides.status || 'active',
    gitRepoUrl: overrides.gitRepoUrl,
    gitProvider: overrides.gitProvider,
  });
  return { project, student, supervisor };
}

async function makeStage(projectId, overrides = {}) {
  return Stage.create({
    projectId,
    title: overrides.title || 'Этап 1',
    deadline: overrides.deadline || '2026-12-31',
    status: overrides.status || 'not_started',
    orderIndex: overrides.orderIndex ?? 1,
    description: overrides.description,
  });
}

module.exports = {
  PASSWORD,
  tokenFor,
  makeUser,
  makeUserWithToken,
  makeAcademicYear,
  makeProject,
  makeStage,
};

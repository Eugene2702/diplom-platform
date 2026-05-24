/**
 * Load-test data seeder.
 *
 * Creates / re-uses a dedicated supervisor + project + 200 fake commits in
 * the development database, prints the resulting LOAD_TOKEN, LOAD_PROJECT_ID
 * and LOAD_EMAIL/LOAD_PASSWORD which Artillery picks up via env vars.
 *
 * Usage (inside the backend container):
 *   npm run load:seed
 *
 * The script is idempotent — running it twice does NOT duplicate data.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const {
  sequelize,
  User,
  Project,
  Commit,
  AcademicYear,
} = require('../src/models');

const SUPERVISOR_EMAIL = 'load_supervisor@diploma.local';
const SUPERVISOR_PASSWORD = 'loadtest123';
const STUDENT_EMAIL = 'load_student@diploma.local';
const PROJECT_TITLE = 'Load-test project';

async function ensureUser(defaults) {
  const [user] = await User.findOrCreate({
    where: { email: defaults.email },
    defaults,
  });
  return user;
}

async function main() {
  await sequelize.authenticate();
  await sequelize.sync();

  const supervisor = await ensureUser({
    email: SUPERVISOR_EMAIL,
    password: SUPERVISOR_PASSWORD,
    firstName: 'Load',
    lastName: 'Supervisor',
    role: 'supervisor',
  });

  const student = await ensureUser({
    email: STUDENT_EMAIL,
    password: 'studentload123',
    firstName: 'Load',
    lastName: 'Student',
    role: 'student',
  });

  const [year] = await AcademicYear.findOrCreate({
    where: { name: 'LOAD-TEST-YEAR' },
    defaults: {
      name: 'LOAD-TEST-YEAR',
      startDate: '2025-09-01',
      endDate: '2026-06-30',
      isCurrent: false,
    },
  });

  const [project] = await Project.findOrCreate({
    where: { title: PROJECT_TITLE },
    defaults: {
      title: PROJECT_TITLE,
      studentId: student.id,
      supervisorId: supervisor.id,
      academicYearId: year.id,
      gitRepoUrl: 'https://github.com/octocat/Hello-World',
      gitProvider: 'github',
      status: 'active',
    },
  });

  // Pre-populate commits so /git/stats has data to aggregate and
  // /git/sync stays cheap (lastCommit.since cuts off most history).
  const existing = await Commit.count({ where: { projectId: project.id } });
  if (existing < 200) {
    const batch = [];
    for (let i = existing; i < 200; i++) {
      batch.push({
        projectId: project.id,
        sha: `load-${i.toString(16).padStart(8, '0')}`,
        message: `Load commit #${i}`,
        authorName: 'Load Bot',
        authorEmail: 'bot@diploma.local',
        committedAt: new Date(Date.now() - i * 3600 * 1000),
        additions: 10,
        deletions: 2,
      });
    }
    await Commit.bulkCreate(batch, { ignoreDuplicates: true });
  }

  const token = jwt.sign(
    { id: supervisor.id, email: supervisor.email, role: supervisor.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  const envPath = path.join(__dirname, '.env');
  const envContent =
    `LOAD_TOKEN=${token}\n` +
    `LOAD_PROJECT_ID=${project.id}\n` +
    `LOAD_EMAIL=${SUPERVISOR_EMAIL}\n` +
    `LOAD_PASSWORD=${SUPERVISOR_PASSWORD}\n`;
  fs.writeFileSync(envPath, envContent);

  console.log('✓ Load-test data ready');
  console.log(`  supervisor id : ${supervisor.id}`);
  console.log(`  project id    : ${project.id}`);
  console.log(`  commits       : ${await Commit.count({ where: { projectId: project.id } })}`);
  console.log(`  env file      : ${envPath}`);

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

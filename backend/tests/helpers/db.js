/**
 * Per-test DB helpers: truncate tables between suites/tests so cases stay isolated.
 */
const {
  sequelize,
  User,
  AcademicYear,
  Project,
  Stage,
  Commit,
  Attachment,
  Notification,
  ActivityLog,
} = require('../../src/models');

const ALL_MODELS = [
  ActivityLog,
  Notification,
  Attachment,
  Commit,
  Stage,
  Project,
  AcademicYear,
  User,
];

async function resetDb() {
  // TRUNCATE ... RESTART IDENTITY CASCADE is the fastest way to wipe everything
  // while keeping the schema intact (FK constraints are deferred via CASCADE).
  const tableNames = ALL_MODELS.map((m) => `"${m.getTableName()}"`).join(', ');
  await sequelize.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE`);
}

async function closeDb() {
  await sequelize.close();
}

module.exports = { resetDb, closeDb, sequelize };

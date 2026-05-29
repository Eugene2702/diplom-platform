// Точка входа DiplomaHub backend.
//
// Переменные окружения:
//   OVERDUE_CRON — cron-выражение для фоновой проверки просроченных этапов.
//                  По умолчанию "0 * * * *" (каждый час в начале часа).
//                  Задача вызывает markOverdueStages() из services/overdue.service.js
//                  и переводит этапы со статусом != completed/overdue и просроченным
//                  дедлайном в статус "overdue". При NODE_ENV=test cron не стартует.
require('dotenv').config();

const cron = require('node-cron');
const app = require('./app');
const { sequelize, User } = require('./models');
const { markOverdueStages } = require('./services/overdue.service');

const PORT = process.env.PORT || 5000;
const OVERDUE_CRON = process.env.OVERDUE_CRON || '0 * * * *';

async function seedAdmin() {
  const admin = await User.findOne({ where: { email: 'admin@diploma.local' } });
  if (!admin) {
    await User.create({
      email: 'admin@diploma.local',
      password: 'admin123',
      firstName: 'Администратор',
      lastName: 'Системы',
      role: 'admin',
    });
    console.log('✓ Default admin created: admin@diploma.local / admin123');
  }

  const supervisor = await User.findOne({ where: { email: 'supervisor@diploma.local' } });
  if (!supervisor) {
    await User.create({
      email: 'supervisor@diploma.local',
      password: 'super123',
      firstName: 'Иван',
      lastName: 'Петров',
      patronymic: 'Сергеевич',
      role: 'supervisor',
    });
    console.log('✓ Demo supervisor created: supervisor@diploma.local / super123');
  }

  const student = await User.findOne({ where: { email: 'student@diploma.local' } });
  if (!student) {
    await User.create({
      email: 'student@diploma.local',
      password: 'student123',
      firstName: 'Алексей',
      lastName: 'Сидоров',
      patronymic: 'Дмитриевич',
      role: 'student',
    });
    console.log('✓ Demo student created: student@diploma.local / student123');
  }
}

function scheduleOverdueCron() {
  if (process.env.NODE_ENV === 'test') return;

  cron.schedule(OVERDUE_CRON, async () => {
    const startedAt = new Date();
    const t0 = Date.now();
    try {
      const updated = await markOverdueStages();
      const elapsed = Date.now() - t0;
      console.log(
        `[overdue-cron] ${startedAt.toISOString()} updated=${updated} elapsedMs=${elapsed}`
      );
    } catch (err) {
      console.error(
        `[overdue-cron] ${startedAt.toISOString()} failed:`,
        err && err.message ? err.message : err
      );
    }
  });

  console.log(`✓ Overdue cron scheduled: ${OVERDUE_CRON}`);
}

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    await sequelize.sync({ alter: true });
    console.log('✓ Models synchronized');

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      scheduleOverdueCron();
    });
  } catch (error) {
    console.error('✗ Failed to start:', error);
    process.exit(1);
  }
}

start();

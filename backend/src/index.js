require('dotenv').config();

const app = require('./app');
const { sequelize, User } = require('./models');

const PORT = process.env.PORT || 5000;

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

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    await sequelize.sync({ alter: true });
    console.log('✓ Models synchronized');

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('✗ Failed to start:', error);
    process.exit(1);
  }
}

start();

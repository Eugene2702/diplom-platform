module.exports = async () => {
  // Close any lingering Sequelize connections opened by worker processes.
  try {
    const { sequelize } = require('../../src/models');
    await sequelize.close();
  } catch (_) {
    // ignore — pool may already be closed
  }
};

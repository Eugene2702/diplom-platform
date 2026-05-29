const { Op } = require('sequelize');
const { Stage } = require('../models');

async function markOverdueStages() {
  const [count] = await Stage.update(
    { status: 'overdue' },
    {
      where: {
        status: { [Op.notIn]: ['completed', 'overdue'] },
        deadline: { [Op.lt]: new Date() },
      },
    }
  );
  return count;
}

module.exports = { markOverdueStages };

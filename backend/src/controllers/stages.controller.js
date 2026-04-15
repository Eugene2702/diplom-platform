const { Stage, Project, Notification } = require('../models');
const { Op } = require('sequelize');

exports.getByProject = async (req, res) => {
  try {
    const stages = await Stage.findAll({
      where: { projectId: req.params.projectId },
      order: [['orderIndex', 'ASC'], ['deadline', 'ASC']],
    });
    res.json({ stages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { projectId, title, description, startDate, deadline, status, orderIndex } = req.body;

    const project = await Project.findByPk(projectId || req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });

    const stage = await Stage.create({
      projectId: project.id, title, description, startDate, deadline,
      status: status || 'not_started',
      orderIndex: orderIndex || 0,
    });

    res.status(201).json({ stage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const stage = await Stage.findByPk(req.params.id);
    if (!stage) return res.status(404).json({ error: 'Этап не найден' });

    const oldStatus = stage.status;
    await stage.update(req.body);

    // Create notification on status change
    if (req.body.status && req.body.status !== oldStatus) {
      const project = await Project.findByPk(stage.projectId);
      if (project) {
        await Notification.create({
          userId: project.studentId,
          projectId: project.id,
          type: 'status_changed',
          title: `Статус этапа "${stage.title}" изменён`,
          message: `Новый статус: ${req.body.status}`,
        });
      }
    }

    res.json({ stage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const stage = await Stage.findByPk(req.params.id);
    if (!stage) return res.status(404).json({ error: 'Этап не найден' });
    await stage.destroy();
    res.json({ message: 'Этап удалён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkOverdue = async (req, res) => {
  try {
    const [count] = await Stage.update(
      { status: 'overdue' },
      {
        where: {
          status: { [Op.notIn]: ['completed', 'overdue'] },
          deadline: { [Op.lt]: new Date() },
        },
      }
    );
    res.json({ updated: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

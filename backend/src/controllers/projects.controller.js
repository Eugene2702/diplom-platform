const { Project, User, Stage, Commit, AcademicYear, Attachment } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { status, supervisorId, studentId, academicYearId, search, page = 1, limit = 20 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (supervisorId) where.supervisorId = supervisorId;
    if (studentId) where.studentId = studentId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (search) where.title = { [Op.iLike]: `%${search}%` };

    // Role-based filtering
    if (req.user.role === 'student') {
      where.studentId = req.user.id;
    } else if (req.user.role === 'supervisor') {
      where.supervisorId = req.user.id;
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Project.findAndCountAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'supervisor', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: AcademicYear },
        { model: Stage, as: 'stages', attributes: ['id', 'title', 'status', 'deadline'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    res.json({ projects: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'supervisor', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: AcademicYear },
        { model: Stage, as: 'stages', order: [['orderIndex', 'ASC']] },
        { model: Commit, as: 'commits', order: [['committed_at', 'DESC']], limit: 20 },
        { model: Attachment, as: 'attachments' },
      ],
    });

    if (!project) return res.status(404).json({ error: 'Проект не найден' });

    // Check access
    if (req.user.role === 'student' && project.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому проекту' });
    }
    if (req.user.role === 'supervisor' && project.supervisorId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому проекту' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, shortDescription, fullDescription, studentId, supervisorId, academicYearId, direction, gitRepoUrl, gitProvider, gitToken } = req.body;

    const project = await Project.create({
      title, shortDescription, fullDescription, studentId, supervisorId, academicYearId, direction, gitRepoUrl, gitProvider, gitToken,
    });

    const full = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'supervisor', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json({ project: full });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });

    await project.update(req.body);

    const full = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'supervisor', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: AcademicYear },
        { model: Stage, as: 'stages' },
      ],
    });

    res.json({ project: full });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    await project.destroy();
    res.json({ message: 'Проект удалён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'supervisor') where.supervisorId = req.user.id;
    if (req.user.role === 'student') where.studentId = req.user.id;

    const total = await Project.count({ where });
    const active = await Project.count({ where: { ...where, status: 'active' } });
    const completed = await Project.count({ where: { ...where, status: 'completed' } });

    const overdueStages = await Stage.count({
      include: [{ model: Project, where, attributes: [] }],
      where: {
        status: { [Op.ne]: 'completed' },
        deadline: { [Op.lt]: new Date() },
      },
    });

    res.json({ total, active, completed, overdueStages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

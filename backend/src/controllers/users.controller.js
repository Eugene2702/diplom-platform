const { User, Project } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['lastName', 'ASC']],
    });

    res.json({ users: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { email, password, firstName, lastName, patronymic, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email уже используется' });

    const user = await User.create({ email, password, firstName, lastName, patronymic, role });
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const { email, firstName, lastName, patronymic, role, isActive } = req.body;
    await user.update({ email, firstName, lastName, patronymic, role, isActive });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    await user.update({ isActive: false });
    res.json({ message: 'Пользователь деактивирован' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSupervisors = async (req, res) => {
  try {
    const supervisors = await User.findAll({
      where: { role: 'supervisor', isActive: true },
      order: [['lastName', 'ASC']],
    });
    res.json({ supervisors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: 'student', isActive: true },
      order: [['lastName', 'ASC']],
    });
    res.json({ students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const { AcademicYear } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const years = await AcademicYear.findAll({ order: [['startDate', 'DESC']] });
    res.json({ academicYears: years });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const year = await AcademicYear.create(req.body);
    res.status(201).json({ academicYear: year });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const year = await AcademicYear.findByPk(req.params.id);
    if (!year) return res.status(404).json({ error: 'Учебный год не найден' });
    await year.update(req.body);
    res.json({ academicYear: year });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const year = await AcademicYear.findByPk(req.params.id);
    if (!year) return res.status(404).json({ error: 'Учебный год не найден' });
    await year.destroy();
    res.json({ message: 'Учебный год удалён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const { Project, Commit } = require('../models');
const GitHubService = require('../services/github.service');

exports.syncCommits = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    if (!project.gitRepoUrl) return res.status(400).json({ error: 'Git-репозиторий не привязан' });

    const result = await GitHubService.syncCommits(project);
    res.json({ message: 'Коммиты синхронизированы', ...result });
  } catch (error) {
    res.status(500).json({ error: `Ошибка синхронизации: ${error.message}` });
  }
};

exports.getCommits = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    const { rows, count } = await Commit.findAndCountAll({
      where: { projectId: req.params.projectId },
      order: [['committed_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ commits: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await GitHubService.getCommitStats(req.params.projectId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

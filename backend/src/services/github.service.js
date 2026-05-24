const axios = require('axios');
const { Commit } = require('../models');

class GitHubService {
  /**
   * Parse owner/repo from GitHub URL
   */
  static parseRepoUrl(url) {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('Невалидный URL GitHub-репозитория');
    return { owner: match[1], repo: match[2].replace('.git', '') };
  }

  /**
   * Fetch commits from GitHub API
   */
  static async fetchCommits(project, since = null) {
    const { owner, repo } = this.parseRepoUrl(project.gitRepoUrl);
    const token = project.gitToken || process.env.GITHUB_DEFAULT_TOKEN;

    const headers = { Accept: 'application/vnd.github.v3+json' };
    if (token) headers.Authorization = `token ${token}`;

    const params = { per_page: 100 };
    if (since) params.since = since;

    let allCommits = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits`,
        { headers, params: { ...params, page } }
      );

      if (response.data.length === 0) {
        hasMore = false;
      } else {
        allCommits = allCommits.concat(response.data);
        page++;
        if (response.data.length < 100) hasMore = false;
        if (page > 10) hasMore = false; // safety limit
      }
    }

    return allCommits;
  }

  /**
   * Sync commits for a project
   */
  static async syncCommits(project) {
    const lastCommit = await Commit.findOne({
      where: { projectId: project.id },
      order: [['committed_at', 'DESC']],
    });

    const since = lastCommit ? lastCommit.committedAt.toISOString() : null;
    const commits = await this.fetchCommits(project, since);

    const newCommits = [];
    for (const c of commits) {
      const [commit, created] = await Commit.findOrCreate({
        where: { projectId: project.id, sha: c.sha },
        defaults: {
          projectId: project.id,
          sha: c.sha,
          message: c.commit.message,
          authorName: c.commit.author?.name || 'Unknown',
          authorEmail: c.commit.author?.email || '',
          committedAt: c.commit.author?.date || new Date(),
          additions: c.stats?.additions || 0,
          deletions: c.stats?.deletions || 0,
        },
      });
      if (created) newCommits.push(commit);
    }

    return { total: commits.length, new: newCommits.length };
  }

  /**
   * Get commit stats aggregated by date
   */
  static async getCommitStats(projectId) {
    const commits = await Commit.findAll({
      where: { projectId },
      order: [['committed_at', 'ASC']],
      raw: true,
    });

    // Aggregate by date — raw:true above returns camelCase keys mapped via
    // Sequelize field aliases, so we read committedAt (not committed_at).
    const byDate = {};
    const byWeek = {};
    commits.forEach((c) => {
      const date = new Date(c.committedAt).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;

      const d = new Date(c.committedAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      byWeek[weekKey] = (byWeek[weekKey] || 0) + 1;
    });

    return {
      totalCommits: commits.length,
      byDate: Object.entries(byDate).map(([date, count]) => ({ date, count })),
      byWeek: Object.entries(byWeek).map(([week, count]) => ({ week, count })),
      commits: commits.slice(-50), // last 50 commits
    };
  }
}

module.exports = GitHubService;

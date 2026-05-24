/**
 * Functional tests — Git integration (4 кейса, таблица 4.1 ВКР).
 *
 *   TC-21  Sync without gitRepoUrl → 400
 *   TC-22  Sync of a (mocked) public repo → 200 + commits.new > 0
 *   TC-23  Repeat sync is idempotent: same commits are not duplicated
 *   TC-24  parseRepoUrl: GitHub URL is accepted, GitLab URL is rejected
 *
 * Network is mocked — axios.get is replaced with a stub that returns
 * a deterministic set of GitHub-shaped commit objects. Hitting the real
 * GitHub API from unit tests is fragile and rate-limited.
 */
const request = require('supertest');
const axios = require('axios');
const app = require('../src/app');
const { resetDb, closeDb } = require('./helpers/db');
const {
  makeUser,
  makeUserWithToken,
  makeProject,
  tokenFor,
} = require('./helpers/factory');
const { Commit } = require('../src/models');
const GitHubService = require('../src/services/github.service');

jest.mock('axios');

function fakeCommit(sha, message, date) {
  return {
    sha,
    commit: {
      message,
      author: { name: 'Test Author', email: 'author@test.local', date },
    },
    stats: { additions: 1, deletions: 0 },
  };
}

beforeEach(async () => {
  await resetDb();
  // resetAllMocks (not clearAllMocks) — clears the queue of mockResolvedValueOnce
  // that survives between tests if not consumed by the implementation under test.
  jest.resetAllMocks();
});

afterAll(async () => {
  await closeDb();
});

describe('TC-21 Sync without gitRepoUrl', () => {
  it('returns 400 with an error message', async () => {
    const supervisor = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });
    const { project } = await makeProject({ student, supervisor, gitRepoUrl: null });

    const res = await request(app)
      .post(`/api/projects/${project.id}/git/sync`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/репозитори/i);
  });
});

describe('TC-22 Sync of a public repo (mocked)', () => {
  it('imports commits and reports counts', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          fakeCommit('aaa111', 'init', '2026-01-01T10:00:00Z'),
          fakeCommit('bbb222', 'feat: auth', '2026-01-02T10:00:00Z'),
        ],
      })
      .mockResolvedValueOnce({ data: [] });

    const supervisor = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });
    const { project } = await makeProject({
      student,
      supervisor,
      gitRepoUrl: 'https://github.com/owner/repo',
      gitProvider: 'github',
    });

    const res = await request(app)
      .post(`/api/projects/${project.id}/git/sync`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.new).toBe(2);

    const persisted = await Commit.findAll({ where: { projectId: project.id } });
    expect(persisted.map((c) => c.sha).sort()).toEqual(['aaa111', 'bbb222']);
  });
});

describe('TC-23 Repeat sync is idempotent', () => {
  it('does not duplicate commits on the second run', async () => {
    const responses = [
      { data: [fakeCommit('sha-1', 'msg', '2026-01-01T10:00:00Z')] },
      { data: [] },
      { data: [fakeCommit('sha-1', 'msg', '2026-01-01T10:00:00Z')] },
      { data: [] },
    ];
    axios.get.mockImplementation(() => Promise.resolve(responses.shift() || { data: [] }));

    const supervisor = await makeUser({ role: 'supervisor' });
    const student = await makeUser({ role: 'student' });
    const { project } = await makeProject({
      student,
      supervisor,
      gitRepoUrl: 'https://github.com/owner/repo',
    });

    const first = await request(app)
      .post(`/api/projects/${project.id}/git/sync`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`);
    expect(first.body.new).toBe(1);

    const second = await request(app)
      .post(`/api/projects/${project.id}/git/sync`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`);
    expect(second.body.new).toBe(0);

    const persisted = await Commit.findAll({ where: { projectId: project.id } });
    expect(persisted.length).toBe(1);
  });
});

describe('TC-24 parseRepoUrl: GitHub OK, GitLab rejected', () => {
  it('throws on a GitLab URL (documented current limitation)', () => {
    expect(() =>
      GitHubService.parseRepoUrl('https://gitlab.com/owner/repo')
    ).toThrow(/github/i);
  });

  it('parses a valid GitHub URL', () => {
    const { owner, repo } = GitHubService.parseRepoUrl('https://github.com/facebook/react.git');
    expect(owner).toBe('facebook');
    expect(repo).toBe('react');
  });
});

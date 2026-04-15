const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

const authCtrl = require('../controllers/auth.controller');
const usersCtrl = require('../controllers/users.controller');
const projectsCtrl = require('../controllers/projects.controller');
const stagesCtrl = require('../controllers/stages.controller');
const gitCtrl = require('../controllers/git.controller');
const academicYearsCtrl = require('../controllers/academicYears.controller');
const notificationsCtrl = require('../controllers/notifications.controller');

// ─── Auth ──────────────────────────────────────
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.me);
router.put('/auth/password', authenticate, authCtrl.changePassword);

// ─── Users ─────────────────────────────────────
router.get('/users', authenticate, authorize('admin'), usersCtrl.getAll);
router.get('/users/supervisors', authenticate, usersCtrl.getSupervisors);
router.get('/users/students', authenticate, usersCtrl.getStudents);
router.get('/users/:id', authenticate, authorize('admin'), usersCtrl.getById);
router.post('/users', authenticate, authorize('admin'), usersCtrl.create);
router.put('/users/:id', authenticate, authorize('admin'), usersCtrl.update);
router.delete('/users/:id', authenticate, authorize('admin'), usersCtrl.delete);

// ─── Academic Years ────────────────────────────
router.get('/academic-years', authenticate, academicYearsCtrl.getAll);
router.post('/academic-years', authenticate, authorize('admin'), academicYearsCtrl.create);
router.put('/academic-years/:id', authenticate, authorize('admin'), academicYearsCtrl.update);
router.delete('/academic-years/:id', authenticate, authorize('admin'), academicYearsCtrl.delete);

// ─── Projects ──────────────────────────────────
router.get('/projects', authenticate, projectsCtrl.getAll);
router.get('/projects/stats', authenticate, projectsCtrl.getStats);
router.get('/projects/:id', authenticate, projectsCtrl.getById);
router.post('/projects', authenticate, authorize('admin', 'supervisor'), projectsCtrl.create);
router.put('/projects/:id', authenticate, authorize('admin', 'supervisor'), projectsCtrl.update);
router.delete('/projects/:id', authenticate, authorize('admin'), projectsCtrl.delete);

// ─── Stages ────────────────────────────────────
router.get('/projects/:projectId/stages', authenticate, stagesCtrl.getByProject);
router.post('/projects/:projectId/stages', authenticate, authorize('admin', 'supervisor'), stagesCtrl.create);
router.put('/stages/:id', authenticate, authorize('admin', 'supervisor'), stagesCtrl.update);
router.delete('/stages/:id', authenticate, authorize('admin', 'supervisor'), stagesCtrl.delete);
router.post('/stages/check-overdue', authenticate, authorize('admin'), stagesCtrl.checkOverdue);

// ─── Git ───────────────────────────────────────
router.post('/projects/:projectId/git/sync', authenticate, gitCtrl.syncCommits);
router.get('/projects/:projectId/git/commits', authenticate, gitCtrl.getCommits);
router.get('/projects/:projectId/git/stats', authenticate, gitCtrl.getStats);

// ─── Notifications ─────────────────────────────
router.get('/notifications', authenticate, notificationsCtrl.getMyNotifications);
router.put('/notifications/:id/read', authenticate, notificationsCtrl.markAsRead);
router.put('/notifications/read-all', authenticate, notificationsCtrl.markAllAsRead);

module.exports = router;

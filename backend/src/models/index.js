const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const bcrypt = require('bcryptjs');

// ─── User ──────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
  lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
  patronymic: { type: DataTypes.STRING(100), field: 'patronymic' },
  role: {
    type: DataTypes.ENUM('admin', 'supervisor', 'student'),
    allowNull: false,
    defaultValue: 'student',
  },
  avatarUrl: { type: DataTypes.STRING(500), field: 'avatar_url' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, {
  tableName: 'users',
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// ─── AcademicYear ──────────────────────────────────
const AcademicYear = sequelize.define('AcademicYear', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
  isCurrent: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_current' },
}, {
  tableName: 'academic_years',
  underscored: true,
});

// ─── Project ───────────────────────────────────────
const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(500), allowNull: false },
  shortDescription: { type: DataTypes.TEXT, field: 'short_description' },
  fullDescription: { type: DataTypes.TEXT, field: 'full_description' },
  studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
  supervisorId: { type: DataTypes.INTEGER, allowNull: false, field: 'supervisor_id' },
  academicYearId: { type: DataTypes.INTEGER, field: 'academic_year_id' },
  direction: { type: DataTypes.STRING(255) },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'archived'),
    defaultValue: 'active',
  },
  gitRepoUrl: { type: DataTypes.STRING(500), field: 'git_repo_url' },
  gitProvider: {
    type: DataTypes.ENUM('github', 'gitlab', 'other'),
    defaultValue: 'github',
    field: 'git_provider',
  },
  gitToken: { type: DataTypes.STRING(500), field: 'git_token' },
}, {
  tableName: 'projects',
  underscored: true,
});

// ─── Stage ─────────────────────────────────────────
const Stage = sequelize.define('Stage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
  title: { type: DataTypes.STRING(300), allowNull: false },
  description: { type: DataTypes.TEXT },
  startDate: { type: DataTypes.DATEONLY, field: 'start_date' },
  deadline: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'overdue'),
    defaultValue: 'not_started',
  },
  orderIndex: { type: DataTypes.INTEGER, defaultValue: 0, field: 'order_index' },
  supervisorComment: { type: DataTypes.TEXT, field: 'supervisor_comment' },
  grade: { type: DataTypes.STRING(20) },
}, {
  tableName: 'stages',
  underscored: true,
});

// ─── Commit ────────────────────────────────────────
const Commit = sequelize.define('Commit', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
  sha: { type: DataTypes.STRING(40), allowNull: false },
  message: { type: DataTypes.TEXT },
  authorName: { type: DataTypes.STRING(255), field: 'author_name' },
  authorEmail: { type: DataTypes.STRING(255), field: 'author_email' },
  committedAt: { type: DataTypes.DATE, field: 'committed_at' },
  additions: { type: DataTypes.INTEGER, defaultValue: 0 },
  deletions: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'commits',
  underscored: true,
  indexes: [
    { unique: true, fields: ['project_id', 'sha'] },
  ],
});

// ─── Attachment ────────────────────────────────────
const Attachment = sequelize.define('Attachment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
  stageId: { type: DataTypes.INTEGER, field: 'stage_id' },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  fileName: { type: DataTypes.STRING(500), allowNull: false, field: 'file_name' },
  fileUrl: { type: DataTypes.STRING(1000), allowNull: false, field: 'file_url' },
  fileType: { type: DataTypes.STRING(100), field: 'file_type' },
  fileSize: { type: DataTypes.INTEGER, field: 'file_size' },
}, {
  tableName: 'attachments',
  underscored: true,
});

// ─── Notification ──────────────────────────────────
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  projectId: { type: DataTypes.INTEGER, field: 'project_id' },
  type: {
    type: DataTypes.ENUM('deadline_approaching', 'stage_updated', 'comment_added', 'status_changed', 'git_update'),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(300), allowNull: false },
  message: { type: DataTypes.TEXT },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_read' },
}, {
  tableName: 'notifications',
  underscored: true,
});

// ─── ActivityLog ───────────────────────────────────
const ActivityLog = sequelize.define('ActivityLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, field: 'user_id' },
  projectId: { type: DataTypes.INTEGER, field: 'project_id' },
  action: { type: DataTypes.STRING(100), allowNull: false },
  details: { type: DataTypes.JSONB },
}, {
  tableName: 'activity_logs',
  underscored: true,
});

// ─── Associations ──────────────────────────────────
Project.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Project.belongsTo(User, { as: 'supervisor', foreignKey: 'supervisorId' });
Project.belongsTo(AcademicYear, { foreignKey: 'academicYearId' });
Project.hasMany(Stage, { foreignKey: 'projectId', as: 'stages' });
Project.hasMany(Commit, { foreignKey: 'projectId', as: 'commits' });
Project.hasMany(Attachment, { foreignKey: 'projectId', as: 'attachments' });
Project.hasMany(Notification, { foreignKey: 'projectId' });

User.hasMany(Project, { as: 'studentProjects', foreignKey: 'studentId' });
User.hasMany(Project, { as: 'supervisedProjects', foreignKey: 'supervisorId' });
User.hasMany(Notification, { foreignKey: 'userId' });

Stage.belongsTo(Project, { foreignKey: 'projectId' });
Stage.hasMany(Attachment, { foreignKey: 'stageId' });

Commit.belongsTo(Project, { foreignKey: 'projectId' });

Attachment.belongsTo(Project, { foreignKey: 'projectId' });
Attachment.belongsTo(Stage, { foreignKey: 'stageId' });
Attachment.belongsTo(User, { foreignKey: 'userId' });

Notification.belongsTo(User, { foreignKey: 'userId' });
Notification.belongsTo(Project, { foreignKey: 'projectId' });

ActivityLog.belongsTo(User, { foreignKey: 'userId' });
ActivityLog.belongsTo(Project, { foreignKey: 'projectId' });

module.exports = {
  sequelize,
  User,
  AcademicYear,
  Project,
  Stage,
  Commit,
  Attachment,
  Notification,
  ActivityLog,
};

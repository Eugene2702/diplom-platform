import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authSlice';
import {
  useGetProjectByIdQuery, useUpdateProjectMutation,
  useCreateStageMutation, useUpdateStageMutation, useDeleteStageMutation,
  useSyncGitCommitsMutation, useGetGitStatsQuery,
} from '../api/apiSlice';
import Modal from '../components/common/Modal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { statusLabels, formatDate, formatRelative, getFullName, isOverdue } from '../utils/helpers';
import {
  GitBranch, Plus, RefreshCw, Clock, CheckCircle2,
  AlertTriangle, ChevronDown, User, Calendar, Edit3, Trash2, MessageSquare, Save
} from 'lucide-react';

const statusOptions = [
  { value: 'not_started', label: 'Не начат' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'completed', label: 'Выполнен' },
  { value: 'overdue', label: 'Просрочен' },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, refetch } = useGetProjectByIdQuery(id);
  const { data: gitStats } = useGetGitStatsQuery(id);
  const [syncGit, { isLoading: syncing }] = useSyncGitCommitsMutation();
  const [createStage] = useCreateStageMutation();
  const [updateStage] = useUpdateStageMutation();
  const [deleteStage] = useDeleteStageMutation();
  const [updateProject] = useUpdateProjectMutation();

  const [activeTab, setActiveTab] = useState('stages');
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageForm, setStageForm] = useState({
    title: '', description: '', startDate: '', deadline: '', status: 'not_started', orderIndex: 0
  });

  const project = data?.project;
  const isSupervisorOrAdmin = ['admin', 'supervisor'].includes(user?.role);

  if (isLoading) return <div className="loading-screen" style={{ height: 400 }}><div className="spinner" /><span>Загрузка...</span></div>;
  if (!project) return <div className="empty-state"><h3>Проект не найден</h3></div>;

  const handleSyncGit = async () => {
    try {
      const res = await syncGit(id).unwrap();
      alert(`Синхронизировано. Всего: ${res.total}, новых: ${res.new}`);
      refetch();
    } catch (err) {
      alert(err.data?.error || 'Ошибка синхронизации');
    }
  };

  const openStageCreate = () => {
    setEditingStage(null);
    setStageForm({ title: '', description: '', startDate: '', deadline: '', status: 'not_started', orderIndex: (project.stages?.length || 0) });
    setShowStageModal(true);
  };

  const openStageEdit = (stage) => {
    setEditingStage(stage);
    setStageForm({
      title: stage.title, description: stage.description || '',
      startDate: stage.startDate || '', deadline: stage.deadline || '',
      status: stage.status, orderIndex: stage.orderIndex || 0,
      supervisorComment: stage.supervisorComment || '', grade: stage.grade || '',
    });
    setShowStageModal(true);
  };

  const handleSaveStage = async (e) => {
    e.preventDefault();
    try {
      if (editingStage) {
        await updateStage({ id: editingStage.id, ...stageForm }).unwrap();
      } else {
        await createStage({ projectId: id, ...stageForm }).unwrap();
      }
      setShowStageModal(false);
      refetch();
    } catch (err) {
      alert(err.data?.error || 'Ошибка');
    }
  };

  const handleDeleteStage = async (stageId) => {
    if (!window.confirm('Удалить этот этап?')) return;
    try {
      await deleteStage(stageId).unwrap();
      refetch();
    } catch (err) {
      alert(err.data?.error || 'Ошибка');
    }
  };

  const stages = project.stages || [];
  const commits = project.commits || [];
  const chartData = gitStats?.byDate?.slice(-30) || [];

  return (
    <div>
      {/* Header */}
      <div className="detail-header">
        <div style={{ flex: 1 }}>
          <h1>{project.title}</h1>
          <div className="detail-meta">
            <div className="detail-meta-item"><User size={14} /> {getFullName(project.student)}</div>
            <div className="detail-meta-item"><User size={14} /> {getFullName(project.supervisor)}</div>
            <div className="detail-meta-item">
              <span className={`badge badge-${project.status}`}><span className="badge-dot" />{statusLabels[project.status]}</span>
            </div>
            {project.gitRepoUrl && (
              <div className="detail-meta-item">
                <GitBranch size={14} />
                <a href={project.gitRepoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-accent)', textDecoration: 'none' }}>
                  {project.gitRepoUrl.split('/').slice(-2).join('/')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.shortDescription && (
        <div className="glass-card" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{project.shortDescription}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'stages' ? 'active' : ''}`} onClick={() => setActiveTab('stages')}>Этапы</button>
        <button className={`tab ${activeTab === 'git' ? 'active' : ''}`} onClick={() => setActiveTab('git')}>Git-активность</button>
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Информация</button>
      </div>

      {/* ───── Stages Tab ───── */}
      {activeTab === 'stages' && (
        <div>
          {isSupervisorOrAdmin && (
            <div style={{ marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={openStageCreate}>
                <Plus size={14} /> Добавить этап
              </button>
            </div>
          )}

          {stages.length === 0 ? (
            <div className="glass-card empty-state">
              <Clock />
              <h3>Нет этапов</h3>
              <p>Добавьте этапы для дипломного проекта</p>
            </div>
          ) : (
            <div className="timeline">
              {[...stages].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((stage) => {
                const overdue = stage.status !== 'completed' && isOverdue(stage.deadline);
                const effectiveStatus = overdue ? 'overdue' : stage.status;
                return (
                  <div key={stage.id} className="timeline-item">
                    <div className={`timeline-dot ${effectiveStatus}`} />
                    <div className="glass-card" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{stage.title}</h4>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span className={`badge badge-${effectiveStatus}`}>
                              <span className="badge-dot" />
                              {statusLabels[effectiveStatus]}
                            </span>
                            {stage.startDate && (
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                <Calendar size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
                                {formatDate(stage.startDate)} — {formatDate(stage.deadline)}
                              </span>
                            )}
                            {!stage.startDate && stage.deadline && (
                              <span style={{ fontSize: 12, color: overdue ? 'var(--accent-danger)' : 'var(--text-tertiary)' }}>
                                Дедлайн: {formatDate(stage.deadline)}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSupervisorOrAdmin && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-icon" onClick={() => openStageEdit(stage)}><Edit3 size={14} /></button>
                            <button className="btn btn-ghost btn-icon" onClick={() => handleDeleteStage(stage.id)}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                      {stage.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>{stage.description}</p>}
                      {stage.supervisorComment && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-primary)' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Комментарий руководителя</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stage.supervisorComment}</div>
                        </div>
                      )}
                      {stage.grade && <div style={{ fontSize: 12, color: 'var(--accent-primary)', marginTop: 6 }}>Оценка: {stage.grade}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───── Git Tab ───── */}
      {activeTab === 'git' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {project.gitRepoUrl && (
              <button className="btn btn-secondary btn-sm" onClick={handleSyncGit} disabled={syncing}>
                <RefreshCw size={14} className={syncing ? 'spin' : ''} />
                {syncing ? 'Синхронизация...' : 'Синхронизировать'}
              </button>
            )}
          </div>

          {/* Stats bar */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="glass-card stat-card aurora">
              <div className="stat-value">{gitStats?.totalCommits || 0}</div>
              <div className="stat-label">Всего коммитов</div>
            </div>
            <div className="glass-card stat-card success">
              <div className="stat-value">{chartData.length}</div>
              <div className="stat-label">Активных дней</div>
            </div>
            <div className="glass-card stat-card warm">
              <div className="stat-value">
                {chartData.length > 0 ? Math.round(chartData.reduce((a, b) => a + b.count, 0) / chartData.length * 10) / 10 : 0}
              </div>
              <div className="stat-label">Среднее/день</div>
            </div>
          </div>

          {/* Commit chart */}
          {chartData.length > 0 && (
            <div className="glass-card" style={{ marginBottom: 24, padding: '24px 20px' }}>
              <h3 className="section-heading"><GitBranch size={18} /> Активность по коммитам</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#151d35', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, fontSize: 13, color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#commitGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Commits list */}
          <div className="glass-card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 className="section-heading" style={{ marginBottom: 0 }}>Последние коммиты</h3>
            </div>
            {commits.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <GitBranch />
                <h3>Нет коммитов</h3>
                <p>Привяжите репозиторий и синхронизируйте</p>
              </div>
            ) : (
              <div className="commit-list" style={{ padding: 8 }}>
                {commits.map((c) => (
                  <div key={c.id} className="commit-item">
                    <span className="commit-sha">{c.sha.slice(0, 7)}</span>
                    <div style={{ flex: 1 }}>
                      <div className="commit-message">{c.message?.split('\n')[0]}</div>
                      <div className="commit-meta">{c.authorName} · {formatRelative(c.committedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── Info Tab ───── */}
      {activeTab === 'info' && (
        <div className="glass-card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 14 }}>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 4 }}>Студент</div>
              <div style={{ fontWeight: 600 }}>{getFullName(project.student)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{project.student?.email}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 4 }}>Руководитель</div>
              <div style={{ fontWeight: 600 }}>{getFullName(project.supervisor)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{project.supervisor?.email}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 4 }}>Направление</div>
              <div>{project.direction || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 4 }}>Учебный год</div>
              <div>{project.AcademicYear?.name || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 4 }}>Git-провайдер</div>
              <div style={{ textTransform: 'capitalize' }}>{project.gitProvider || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 4 }}>Создан</div>
              <div>{formatDate(project.createdAt)}</div>
            </div>
          </div>
          {project.fullDescription && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 8 }}>Полное описание</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{project.fullDescription}</p>
            </div>
          )}
        </div>
      )}

      {/* Stage Modal */}
      <Modal isOpen={showStageModal} onClose={() => setShowStageModal(false)} title={editingStage ? 'Редактировать этап' : 'Новый этап'}>
        <form onSubmit={handleSaveStage}>
          <div className="form-group">
            <label className="form-label">Название *</label>
            <input className="form-input" required value={stageForm.title} onChange={(e) => setStageForm({ ...stageForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea className="form-textarea" value={stageForm.description} onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Дата начала</label>
              <input type="date" className="form-input" value={stageForm.startDate} onChange={(e) => setStageForm({ ...stageForm, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Дедлайн *</label>
              <input type="date" className="form-input" required value={stageForm.deadline} onChange={(e) => setStageForm({ ...stageForm, deadline: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Статус</label>
              <select className="form-select" value={stageForm.status} onChange={(e) => setStageForm({ ...stageForm, status: e.target.value })}>
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Порядок</label>
              <input type="number" className="form-input" value={stageForm.orderIndex} onChange={(e) => setStageForm({ ...stageForm, orderIndex: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          {isSupervisorOrAdmin && editingStage && (
            <>
              <div className="form-group">
                <label className="form-label">Комментарий руководителя</label>
                <textarea className="form-textarea" value={stageForm.supervisorComment || ''} onChange={(e) => setStageForm({ ...stageForm, supervisorComment: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Оценка</label>
                <input className="form-input" value={stageForm.grade || ''} onChange={(e) => setStageForm({ ...stageForm, grade: e.target.value })} placeholder="Отлично / 5 / A" />
              </div>
            </>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowStageModal(false)}>Отмена</button>
            <button type="submit" className="btn btn-primary"><Save size={14} /> Сохранить</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

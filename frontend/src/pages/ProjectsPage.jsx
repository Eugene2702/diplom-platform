import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/authSlice';
import {
  useGetProjectsQuery, useCreateProjectMutation,
  useGetSupervisorsQuery, useGetStudentsQuery, useGetAcademicYearsQuery,
} from '../api/apiSlice';
import Modal from '../components/common/Modal';
import { statusLabels, getFullName, formatDate } from '../utils/helpers';
import { Plus, FolderGit2, Search, GitBranch, Filter } from 'lucide-react';

export default function ProjectsPage() {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [form, setForm] = useState({
    title: '', shortDescription: '', fullDescription: '',
    studentId: '', supervisorId: '', academicYearId: '',
    direction: '', gitRepoUrl: '', gitProvider: 'github', gitToken: '',
  });

  const { data, isLoading } = useGetProjectsQuery({ ...filters, limit: 50 });
  const { data: supervisorsData } = useGetSupervisorsQuery();
  const { data: studentsData } = useGetStudentsQuery();
  const { data: yearsData } = useGetAcademicYearsQuery();
  const [createProject, { isLoading: creating }] = useCreateProjectMutation();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProject(form).unwrap();
      setShowCreate(false);
      setForm({ title: '', shortDescription: '', fullDescription: '', studentId: '', supervisorId: '', academicYearId: '', direction: '', gitRepoUrl: '', gitProvider: 'github', gitToken: '' });
    } catch (err) {
      alert(err.data?.error || 'Ошибка создания');
    }
  };

  const canCreate = ['admin', 'supervisor'].includes(user?.role);

  return (
    <div>
      <div className="topbar">
        <h1>Проекты</h1>
        <div className="topbar-actions">
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Новый проект
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', marginBottom: 24 }}>
        <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
        <input
          className="form-input"
          placeholder="Поиск по названию..."
          style={{ flex: 1, background: 'transparent', border: 'none', padding: '4px 0' }}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="form-select"
          style={{ width: 180 }}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="completed">Завершённые</option>
          <option value="archived">В архиве</option>
        </select>
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="loading-screen" style={{ height: 300 }}>
          <div className="spinner" />
        </div>
      ) : (!data?.projects || data.projects.length === 0) ? (
        <div className="glass-card empty-state">
          <FolderGit2 />
          <h3>Нет проектов</h3>
          <p>Создайте первый дипломный проект</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {data.projects.map((p) => (
            <div
              key={p.id}
              className="glass-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, flex: 1, marginRight: 12 }}>{p.title}</h3>
                <span className={`badge badge-${p.status}`}><span className="badge-dot" />{statusLabels[p.status]}</span>
              </div>

              {p.shortDescription && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.shortDescription}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--text-tertiary)', width: 80 }}>Студент:</span>
                  <span>{getFullName(p.student)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--text-tertiary)', width: 80 }}>Рук-ль:</span>
                  <span>{getFullName(p.supervisor)}</span>
                </div>
                {p.gitRepoUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <GitBranch size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {p.gitRepoUrl.split('/').slice(-2).join('/')}
                    </span>
                  </div>
                )}
              </div>

              {/* Stage progress */}
              {p.stages && p.stages.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                    <span>Прогресс этапов</span>
                    <span>{p.stages.filter(s => s.status === 'completed').length}/{p.stages.length}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(p.stages.filter(s => s.status === 'completed').length / p.stages.length) * 100}%`,
                      background: 'var(--gradient-aurora)',
                      borderRadius: 2,
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Новый проект" wide>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Название темы *</label>
            <input className="form-input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Тема дипломного проекта" />
          </div>

          <div className="form-group">
            <label className="form-label">Краткое описание</label>
            <textarea className="form-textarea" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="Краткое описание проекта..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Студент *</label>
              <select className="form-select" required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                <option value="">Выберите студента</option>
                {studentsData?.students?.map((s) => (
                  <option key={s.id} value={s.id}>{getFullName(s)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Руководитель *</label>
              <select className="form-select" required value={form.supervisorId} onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}>
                <option value="">Выберите руководителя</option>
                {supervisorsData?.supervisors?.map((s) => (
                  <option key={s.id} value={s.id}>{getFullName(s)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Учебный год</label>
              <select className="form-select" value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
                <option value="">Не указан</option>
                {yearsData?.academicYears?.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Направление / Профиль</label>
              <input className="form-input" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} placeholder="02.03.02 ИР ПО" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">URL Git-репозитория</label>
            <input className="form-input" value={form.gitRepoUrl} onChange={(e) => setForm({ ...form, gitRepoUrl: e.target.value })} placeholder="https://github.com/user/repo" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Git-провайдер</label>
              <select className="form-select" value={form.gitProvider} onChange={(e) => setForm({ ...form, gitProvider: e.target.value })}>
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
                <option value="other">Другой</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Токен доступа (опционально)</label>
              <input className="form-input" type="password" value={form.gitToken} onChange={(e) => setForm({ ...form, gitToken: e.target.value })} placeholder="ghp_..." />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Создание...' : 'Создать проект'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

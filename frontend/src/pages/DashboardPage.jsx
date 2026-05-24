import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../features/authSlice';
import { useGetProjectStatsQuery, useGetProjectsQuery } from '../api/apiSlice';
import { FolderGit2, CheckCircle2, AlertTriangle, Clock, ArrowRight, GitBranch } from 'lucide-react';
import { statusLabels, getFullName, formatDate, isDueSoon, isOverdue } from '../utils/helpers';

export default function DashboardPage() {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useGetProjectStatsQuery();
  const { data: projectsData } = useGetProjectsQuery({ limit: 5 });

  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Доброе утро';
    if (h >= 12 && h < 17) return 'Добрый день';
    if (h >= 17 && h < 23) return 'Добрый вечер';
    return 'Доброй ночи';
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>{greeting()}, {user?.firstName}!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Обзор ваших дипломных проектов
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="glass-card stat-card aurora">
          <div className="stat-icon aurora"><FolderGit2 size={20} /></div>
          <div className="stat-value">{stats?.total || 0}</div>
          <div className="stat-label">Всего проектов</div>
        </div>
        <div className="glass-card stat-card success">
          <div className="stat-icon success"><CheckCircle2 size={20} /></div>
          <div className="stat-value">{stats?.active || 0}</div>
          <div className="stat-label">Активных</div>
        </div>
        <div className="glass-card stat-card warm">
          <div className="stat-icon warm"><Clock size={20} /></div>
          <div className="stat-value">{stats?.completed || 0}</div>
          <div className="stat-label">Завершённых</div>
        </div>
        <div className="glass-card stat-card danger">
          <div className="stat-icon danger"><AlertTriangle size={20} /></div>
          <div className="stat-value">{stats?.overdueStages || 0}</div>
          <div className="stat-label">Просроченных этапов</div>
        </div>
      </div>

      {/* Recent projects */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-heading" style={{ marginBottom: 0 }}>
            <FolderGit2 size={20} /> Проекты
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
            Все проекты <ArrowRight size={14} />
          </button>
        </div>

        {(!projectsData?.projects || projectsData.projects.length === 0) ? (
          <div className="empty-state">
            <FolderGit2 />
            <h3>Нет проектов</h3>
            <p>Пока нет дипломных проектов для отображения</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Студент</th>
                  <th>Руководитель</th>
                  <th>Статус</th>
                  <th>Этапы</th>
                </tr>
              </thead>
              <tbody>
                {projectsData.projects.map((p) => {
                  const overdueCount = (p.stages || []).filter(s => s.status === 'overdue' || (s.status !== 'completed' && isOverdue(s.deadline))).length;
                  const completedCount = (p.stages || []).filter(s => s.status === 'completed').length;
                  return (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        {p.gitRepoUrl && (
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <GitBranch size={12} /> {p.gitRepoUrl.split('/').slice(-2).join('/')}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{getFullName(p.student)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{getFullName(p.supervisor)}</td>
                      <td><span className={`badge badge-${p.status}`}><span className="badge-dot" />{statusLabels[p.status] || p.status}</span></td>
                      <td>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {completedCount}/{(p.stages || []).length}
                          {overdueCount > 0 && <span style={{ color: 'var(--accent-danger)', marginLeft: 6 }}>({overdueCount} просроч.)</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logout } from '../../features/authSlice';
import { useGetNotificationsQuery, useMarkAllNotificationsReadMutation } from '../../api/apiSlice';
import { getInitials, roleLabels } from '../../utils/helpers';
import {
  LayoutDashboard, FolderGit2, Users, GraduationCap,
  Calendar, Bell, LogOut, Settings, GitBranch, ChevronDown
} from 'lucide-react';

const navItems = {
  admin: [
    { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
    { to: '/projects', icon: FolderGit2, label: 'Проекты' },
    { to: '/users', icon: Users, label: 'Пользователи' },
    { to: '/academic-years', icon: Calendar, label: 'Учебные годы' },
  ],
  supervisor: [
    { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
    { to: '/projects', icon: FolderGit2, label: 'Мои проекты' },
  ],
  student: [
    { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
    { to: '/projects', icon: FolderGit2, label: 'Мой проект' },
  ],
};

export default function AppLayout() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);

  const { data: notifsData } = useGetNotificationsQuery(undefined, { pollingInterval: 30000 });
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const items = navItems[user?.role] || navItems.student;

  return (
    <div className="app-layout">
      <div className="app-bg" />

      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">D</div>
          <div className="sidebar-brand-text">DiplomaHub</div>
        </div>

        <div className="sidebar-section-title">Навигация</div>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-footer">
          <div style={{ position: 'relative' }}>
            <button
              className="sidebar-link notif-bell"
              onClick={() => setShowNotifs(!showNotifs)}
            >
              <Bell />
              <span>Уведомления</span>
              {notifsData?.unreadCount > 0 && (
                <span className="notif-count">{notifsData.unreadCount}</span>
              )}
            </button>

            {showNotifs && (
              <div className="notif-dropdown glass-card" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Уведомления</span>
                  {notifsData?.unreadCount > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => markAllRead()}>
                      Прочитать все
                    </button>
                  )}
                </div>
                {(!notifsData?.notifications || notifsData.notifications.length === 0) ? (
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>
                    Нет уведомлений
                  </p>
                ) : (
                  notifsData.notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-msg">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.lastName} {user?.firstName}</div>
              <div className="sidebar-user-role">{roleLabels[user?.role]}</div>
            </div>
          </div>

          <button className="sidebar-link" onClick={handleLogout}>
            <LogOut />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content" onClick={() => setShowNotifs(false)}>
        <Outlet />
      </main>
    </div>
  );
}

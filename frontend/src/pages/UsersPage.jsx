import React, { useState } from 'react';
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '../api/apiSlice';
import Modal from '../components/common/Modal';
import { roleLabels, getFullName } from '../utils/helpers';
import { Plus, Users, Search, Edit3, Trash2, UserCheck } from 'lucide-react';

export default function UsersPage() {
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', patronymic: '', role: 'student' });

  const { data, isLoading } = useGetUsersQuery({ ...filters, limit: 100 });
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const openCreate = () => {
    setEditing(null);
    setForm({ email: '', password: '', firstName: '', lastName: '', patronymic: '', role: 'student' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ email: user.email, firstName: user.firstName, lastName: user.lastName, patronymic: user.patronymic || '', role: user.role });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateUser({ id: editing.id, ...form }).unwrap();
      } else {
        await createUser(form).unwrap();
      }
      setShowModal(false);
    } catch (err) {
      alert(err.data?.error || 'Ошибка');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Деактивировать пользователя?')) return;
    await deleteUser(id);
  };

  return (
    <div>
      <div className="topbar">
        <h1>Пользователи</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="glass-card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', marginBottom: 24 }}>
        <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
        <input
          className="form-input"
          placeholder="Поиск..."
          style={{ flex: 1, background: 'transparent', border: 'none', padding: '4px 0' }}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select className="form-select" style={{ width: 180 }} value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">Все роли</option>
          <option value="admin">Администраторы</option>
          <option value="supervisor">Руководители</option>
          <option value="student">Студенты</option>
        </select>
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        {isLoading ? (
          <div className="loading-screen" style={{ height: 200 }}><div className="spinner" /></div>
        ) : (!data?.users || data.users.length === 0) ? (
          <div className="empty-state"><Users /><h3>Нет пользователей</h3></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th style={{ width: 100 }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{getFullName(u)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{u.email}</td>
                    <td><span className={`badge badge-${u.role}`}>{roleLabels[u.role]}</span></td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-active' : 'badge-archived'}`}>
                        <span className="badge-dot" />
                        {u.isActive ? 'Активен' : 'Деактивирован'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(u)}><Edit3 size={14} /></button>
                        <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(u.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Редактировать пользователя' : 'Новый пользователь'}>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Фамилия *</label>
              <input className="form-input" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Имя *</label>
              <input className="form-input" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Отчество</label>
            <input className="form-input" value={form.patronymic} onChange={(e) => setForm({ ...form, patronymic: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          {!editing && (
            <div className="form-group">
              <label className="form-label">Пароль *</label>
              <input className="form-input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Минимум 6 символов" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Роль *</label>
            <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Студент</option>
              <option value="supervisor">Руководитель</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

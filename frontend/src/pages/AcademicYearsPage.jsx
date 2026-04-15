import React, { useState } from 'react';
import { useGetAcademicYearsQuery, useCreateAcademicYearMutation, useUpdateAcademicYearMutation, useDeleteAcademicYearMutation } from '../api/apiSlice';
import Modal from '../components/common/Modal';
import { formatDate } from '../utils/helpers';
import { Plus, Calendar, Edit3, Trash2 } from 'lucide-react';

export default function AcademicYearsPage() {
  const { data, isLoading } = useGetAcademicYearsQuery();
  const [createYear] = useCreateAcademicYearMutation();
  const [updateYear] = useUpdateAcademicYearMutation();
  const [deleteYear] = useDeleteAcademicYearMutation();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', startDate: '', endDate: '', isCurrent: false });
    setShowModal(true);
  };

  const openEdit = (year) => {
    setEditing(year);
    setForm({ name: year.name, startDate: year.startDate, endDate: year.endDate, isCurrent: year.isCurrent });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateYear({ id: editing.id, ...form }).unwrap();
      } else {
        await createYear(form).unwrap();
      }
      setShowModal(false);
    } catch (err) {
      alert(err.data?.error || 'Ошибка');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить учебный год?')) return;
    await deleteYear(id);
  };

  return (
    <div>
      <div className="topbar">
        <h1>Учебные годы</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        {isLoading ? (
          <div className="loading-screen" style={{ height: 200 }}><div className="spinner" /></div>
        ) : (!data?.academicYears || data.academicYears.length === 0) ? (
          <div className="empty-state"><Calendar /><h3>Нет учебных годов</h3></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Начало</th>
                  <th>Конец</th>
                  <th>Текущий</th>
                  <th style={{ width: 100 }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.academicYears.map((y) => (
                  <tr key={y.id}>
                    <td style={{ fontWeight: 600 }}>{y.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(y.startDate)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(y.endDate)}</td>
                    <td>
                      {y.isCurrent && <span className="badge badge-active"><span className="badge-dot" />Текущий</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(y)}><Edit3 size={14} /></button>
                        <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(y.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Редактировать' : 'Новый учебный год'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Название *</label>
            <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="2024-2025" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Дата начала *</label>
              <input type="date" className="form-input" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Дата окончания *</label>
              <input type="date" className="form-input" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} />
              <span className="form-label" style={{ margin: 0 }}>Текущий учебный год</span>
            </label>
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

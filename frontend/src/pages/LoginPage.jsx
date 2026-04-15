import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../api/apiSlice';
import { setCredentials } from '../features/authSlice';
import { LogIn, AlertCircle } from 'lucide-react';

const demoAccounts = [
  { label: 'Администратор', email: 'admin@diploma.local', password: 'admin123' },
  { label: 'Руководитель', email: 'supervisor@diploma.local', password: 'super123' },
  { label: 'Студент', email: 'student@diploma.local', password: 'student123' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result));
      navigate('/');
    } catch (err) {
      setError(err.data?.error || 'Ошибка авторизации');
    }
  };

  const handleDemoLogin = async (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    try {
      const result = await login({ email: acc.email, password: acc.password }).unwrap();
      dispatch(setCredentials(result));
      navigate('/');
    } catch (err) {
      setError(err.data?.error || 'Ошибка авторизации');
    }
  };

  return (
    <div className="login-page">
      <div className="app-bg" />
      <div className="login-card glass-card">
        <div className="login-logo">
          <div className="login-logo-icon">D</div>
          <div className="login-logo-text">DiplomaHub</div>
        </div>
        <p className="login-subtitle">Платформа управления дипломными проектами</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', marginBottom: 20,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: '#f87171', fontSize: 13,
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-submit" disabled={isLoading}>
            {isLoading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><LogIn size={16} /> Войти</>}
          </button>
        </form>

        <div className="login-demo">
          <div className="login-demo-title">Демо-аккаунты</div>
          <div className="login-demo-accounts">
            {demoAccounts.map((acc) => (
              <button key={acc.email} className="login-demo-btn" onClick={() => handleDemoLogin(acc)}>
                <span>{acc.label}</span>
                <span>{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

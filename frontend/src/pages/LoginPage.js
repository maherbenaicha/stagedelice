import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@stagedelice.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
      toast.success(`Bienvenue ${res.data.user.name} !`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'Poppins', 'Inter', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background:
        'radial-gradient(circle at top left, rgba(118, 194, 255, 0.25), transparent 40%),' +
        'radial-gradient(circle at bottom right, rgba(18, 135, 255, 0.25), transparent 42%),' +
        'linear-gradient(135deg, #0842aa 0%, #0b4cc6 55%, #1287ff 100%)',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '28px',
        padding: '48px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 30px 70px rgba(3, 73, 185, 0.35)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/image/logo.jpg" alt="Délice" style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'cover', margin: '0 auto 14px', boxShadow: '0 12px 28px rgba(0, 66, 180, 0.16)' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0842aa', letterSpacing: '-0.03em' }}>Délice RH</h1>
          <p style={{ color: '#5f7faf', marginTop: '4px', fontSize: '0.92rem' }}>Plateforme d'évaluation technique</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#345088' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '11px 16px', border: '1px solid #dce9fb', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
              required />
          </div>
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#345088' }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '11px 16px', border: '1px solid #dce9fb', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
              required />
          </div>
          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '13px', color: 'white', border: 'none', borderRadius: '999px',
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: 'linear-gradient(135deg, #0b4cc6 0%, #1287ff 100%)',
              boxShadow: '0 16px 32px rgba(0, 86, 214, 0.28)',
            }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!form.currentPassword || !form.newPassword) return setError('Tous les champs sont requis');
    if (form.newPassword !== form.confirmPassword) return setError('Les mots de passe ne correspondent pas');
    if (form.newPassword.length < 6) return setError('Mot de passe trop court (min 6 caractères)');
    setSaving(true); setError(''); setMsg('');
    try {
      await api.put('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMsg('Mot de passe modifié avec succès');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Mon profil</h2><p>Vos informations et paramètres de sécurité</p></div>
      </div>
      <div className="page-body">
        <div style={{ maxWidth: 560 }}>
          <div className="card mb-4">
            <div className="card-header"><h3>Informations</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0b3fa6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700 }}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{user?.email}</div>
                  <span className={`badge ${user?.role === 'admin' ? 'badge-info' : 'badge-gray'}`} style={{ marginTop: 4 }}>{user?.role}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Changer le mot de passe</h3></div>
            <div className="card-body">
              {msg && <div className="alert alert-success">{msg}</div>}
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Mot de passe actuel</label>
                <input type="password" className="form-control" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <input type="password" className="form-control" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer le nouveau mot de passe</label>
                <input type="password" className="form-control" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
              <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>{saving ? 'Enregistrement...' : 'Modifier le mot de passe'}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;

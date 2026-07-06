import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email:'', password:'', full_name:'', role:'rh' });

  const load = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      toast.success('Utilisateur créé');
      setShowModal(false);
      setForm({ email:'', password:'', full_name:'', role:'rh' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const toggleActive = async (user) => {
    await api.put(`/users/${user.id}`, { ...user, is_active: !user.is_active });
    load();
  };

  return (
    <div style={{ padding:'32px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:'700' }}>Utilisateurs</h1>
          <p style={{ color:'#5f7faf' }}>Gestion des comptes Admin/RH</p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ padding:'10px 24px', background:'#0b3fa6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
          + Nouvel utilisateur
        </button>
      </div>
      <div style={{ background:'white', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f7fbff' }}>
              {['Nom','Email','Rôle','Statut','Créé le','Action'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.8rem', fontWeight:'600', color:'#5f7faf', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop:'1px solid #dce9fb' }}>
                <td style={{ padding:'14px 16px', fontWeight:'500' }}>{u.full_name}</td>
                <td style={{ padding:'14px 16px', color:'#5f7faf', fontSize:'0.9rem' }}>{u.email}</td>
                <td style={{ padding:'14px 16px' }}>
                  <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600',
                    background: u.role==='admin' ? '#fef3c7' : '#e5eefb',
                    color: u.role==='admin' ? '#d97706' : '#0b3fa6' }}>{u.role}</span>
                </td>
                <td style={{ padding:'14px 16px' }}>
                  <span style={{ color: u.is_active ? '#10b981' : '#ef4444', fontWeight:'500', fontSize:'0.9rem' }}>
                    {u.is_active ? '● Actif' : '○ Inactif'}
                  </span>
                </td>
                <td style={{ padding:'14px 16px', fontSize:'0.85rem', color:'#5f7faf' }}>
                  {new Date(u.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding:'14px 16px' }}>
                  <button onClick={() => toggleActive(u)}
                    style={{ padding:'6px 14px', background: u.is_active ? '#fee2e2' : '#dcfce7',
                      color: u.is_active ? '#ef4444' : '#16a34a', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500', fontSize:'0.85rem' }}>
                    {u.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'32px', width:'100%', maxWidth:'440px' }}>
            <h2 style={{ marginBottom:'24px', fontWeight:'700' }}>Nouvel utilisateur</h2>
            <form onSubmit={handleCreate}>
              {[['Nom complet','full_name','text'],['Email','email','email'],['Mot de passe','password','password']].map(([label,key,type]) => (
                <div key={key} style={{ marginBottom:'16px' }}>
                  <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px' }} required />
                </div>
              ))}
              <div style={{ marginBottom:'24px' }}>
                <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>Rôle</label>
                <select value={form.role} onChange={e => setForm({...form,role:e.target.value})}
                  style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px' }}>
                  <option value="rh">RH</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:'12px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex:1, padding:'12px', background:'#eef5ff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500' }}>Annuler</button>
                <button type="submit"
                  style={{ flex:1, padding:'12px', background:'#0b3fa6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

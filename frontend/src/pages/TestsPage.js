import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['SQL', 'Web', 'Réseau', 'Algorithmique', 'ERP', 'Général', 'DevOps', 'Mobile'];

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', duration_minutes:60, passing_score:70, category:'SQL' });
  const navigate = useNavigate();

  const load = () => api.get('/tests').then(r => setTests(r.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/tests', form);
      toast.success(`Test créé ! Code d'accès: ${res.data.access_code}`);
      setShowModal(false);
      setForm({ title:'', description:'', duration_minutes:60, passing_score:70, category:'SQL' });
      load();
    } catch (err) { toast.error('Erreur lors de la création'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Désactiver ce test ?')) return;
    await api.delete(`/tests/${id}`);
    toast.success('Test désactivé');
    load();
  };

  const handleCopyLink = async (code) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/test/${code}`);
      toast.success('Lien candidat copié');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  const getDiffColor = (cat) => {
    const colors = { SQL:'#3b82f6', Web:'#10b981', Réseau:'#f59e0b', Algorithmique:'#8b5cf6', ERP:'#ef4444' };
    return colors[cat] || '#5f7faf';
  };

  return (
    <div style={{ padding:'32px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:'700' }}>Tests Techniques</h1>
          <p style={{ color:'#5f7faf' }}>{tests.length} test(s) disponible(s)</p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ padding:'10px 24px', background:'#0b3fa6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'0.95rem' }}>
          + Nouveau test
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px' }}>
        {tests.map(t => (
          <div key={t.id} style={{ background:'white', borderRadius:'12px', padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', border:'1px solid #dce9fb' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
              <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600', background:`${getDiffColor(t.category)}20`, color:getDiffColor(t.category) }}>
                {t.category}
              </span>
              <span style={{ fontSize:'0.8rem', color: t.is_active ? '#10b981' : '#ef4444' }}>
                {t.is_active ? '● Actif' : '○ Inactif'}
              </span>
            </div>
            <h3 style={{ fontSize:'1.1rem', fontWeight:'600', marginBottom:'8px' }}>{t.title}</h3>
            <p style={{ color:'#5f7faf', fontSize:'0.85rem', marginBottom:'16px', minHeight:'40px' }}>{t.description}</p>
            <div style={{ display:'flex', gap:'16px', marginBottom:'16px', fontSize:'0.85rem', color:'#5f7faf' }}>
              <span>⏱ {t.duration_minutes} min</span>
              <span>❓ {t.question_count} questions</span>
              <span>👥 {t.session_count} sessions</span>
            </div>
            <div style={{ background:'#f7fbff', borderRadius:'6px', padding:'8px 12px', marginBottom:'16px', fontSize:'0.8rem' }}>
              Code d'accès: <strong style={{ color:'#0b3fa6', letterSpacing:'2px' }}>{t.access_code}</strong>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => navigate(`/dashboard/tests/${t.id}`)}
                style={{ flex:1, padding:'8px', background:'#0b3fa6', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500' }}>
                Gérer
              </button>
              <button onClick={() => handleCopyLink(t.access_code)}
                style={{ padding:'8px 14px', background:'#eef5ff', color:'#0b3fa6', border:'none', borderRadius:'6px', cursor:'pointer' }}
                title="Copier le lien candidat">
                🔗
              </button>
              <button onClick={() => handleDelete(t.id)}
                style={{ padding:'8px 14px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'6px', cursor:'pointer' }}>
                🗑
              </button>
            </div>
          </div>
        ))}
        {tests.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px', color:'#5f7faf' }}>
            <div style={{ fontSize:'3rem', marginBottom:'12px' }}>📝</div>
            <p>Aucun test créé. Créez votre premier test !</p>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'32px', width:'100%', maxWidth:'520px' }}>
            <h2 style={{ marginBottom:'24px', fontWeight:'700' }}>Nouveau test</h2>
            <form onSubmit={handleCreate}>
              {[['Titre du test', 'title', 'text'], ['Description', 'description', 'text']].map(([label, key, type]) => (
                <div key={key} style={{ marginBottom:'16px' }}>
                  <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px', fontSize:'0.95rem' }}
                    required={key==='title'} />
                </div>
              ))}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                <div>
                  <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>Durée (min)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: +e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px' }} min="5" />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>Score passage (%)</label>
                  <input type="number" value={form.passing_score} onChange={e => setForm({...form, passing_score: +e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px' }} min="0" max="100" />
                </div>
              </div>
              <div style={{ marginBottom:'24px' }}>
                <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>Catégorie</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px' }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:'12px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex:1, padding:'12px', background:'#eef5ff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500' }}>
                  Annuler
                </button>
                <button type="submit"
                  style={{ flex:1, padding:'12px', background:'#0b3fa6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                  Créer le test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
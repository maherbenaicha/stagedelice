import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function CandidatePortal() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name:'', email:'', phone:'' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/tests/code/${code}`)
      .then(r => setTest(r.data))
      .catch(() => toast.error('Code invalide ou test inactif'))
      .finally(() => setLoading(false));
  }, [code]);

  const handleStart = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/sessions/start', {
        test_id: test.id, candidate_name: form.name,
        candidate_email: form.email, candidate_phone: form.phone,
      });
      sessionStorage.setItem('tt_session', JSON.stringify(res.data));
      navigate(`/test/${code}/start`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f7fbff' }}>
      <p>Vérification du test...</p>
    </div>
  );

  if (!test) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f7fbff' }}>
      <div style={{ textAlign:'center', padding:'40px' }}>
        <div style={{ fontSize:'4rem', marginBottom:'16px' }}>❌</div>
        <h2>Test non trouvé</h2>
        <p style={{ color:'#5f7faf' }}>Le code d'accès est invalide ou le test n'est plus disponible.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0842aa 0%,#0b3fa6 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'48px', width:'100%', maxWidth:'520px', boxShadow:'0 25px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>🧪</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:'700', color:'#0b2d63' }}>{test.title}</h1>
          {test.description && <p style={{ color:'#5f7faf', marginTop:'8px', fontSize:'0.95rem' }}>{test.description}</p>}
          <div style={{ display:'flex', justifyContent:'center', gap:'24px', marginTop:'16px' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:'700', color:'#0b3fa6' }}>{test.duration_minutes}</div>
              <div style={{ fontSize:'0.8rem', color:'#5f7faf' }}>minutes</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:'700', color:'#10b981' }}>{test.category}</div>
              <div style={{ fontSize:'0.8rem', color:'#5f7faf' }}>catégorie</div>
            </div>
          </div>
        </div>

        <div style={{ background:'#fef3c7', borderRadius:'8px', padding:'12px 16px', marginBottom:'24px', fontSize:'0.85rem', color:'#92400e' }}>
          ⚠️ Une fois démarré, le test ne peut pas être mis en pause. Assurez-vous d'avoir {test.duration_minutes} minutes disponibles.
        </div>

        <form onSubmit={handleStart}>
          {[['Nom complet *','name','text','Jean Dupont'],['Email *','email','email','jean@exemple.com'],['Téléphone','phone','tel','(optionnel)']].map(([label,key,type,ph]) => (
            <div key={key} style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>{label}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
                style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px', fontSize:'0.95rem' }}
                required={key!=='phone'} />
            </div>
          ))}
          <button type="submit" disabled={submitting}
            style={{ width:'100%', padding:'14px', background:'#0b3fa6', color:'white', border:'none', borderRadius:'8px', fontSize:'1rem', fontWeight:'700', cursor:'pointer', marginTop:'8px' }}>
            {submitting ? 'Démarrage...' : '🚀 Démarrer le test'}
          </button>
        </form>
      </div>
    </div>
  );
}

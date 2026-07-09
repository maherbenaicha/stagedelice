import { Clock, Target, Link2, Mail, CheckCircle2, HelpCircle, ChevronLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const DIFFICULTIES = ['facile', 'moyen', 'difficile'];
const DIFF_COLORS = { facile:'#10b981', moyen:'#f59e0b', difficile:'#ef4444' };
const emptyQ = { text:'', options:['','','',''], correct_answer:0, difficulty:'moyen', points:1 };

export default function TestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [form, setForm] = useState(emptyQ);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiForm, setAiForm] = useState({ technology: '', level: 'moyen', count: 5 });
  const [aiLoading, setAiLoading] = useState(false);

  const load = () => api.get(`/tests/${id}`).then(r => setTest(r.data));
  useEffect(() => { load(); }, [id]);

  const handleGenerateAi = async (e) => {
    e.preventDefault();
    if (!aiForm.technology.trim()) return toast.error('Précisez une technologie');
    setAiLoading(true);
    try {
      await api.post('/ai/generate-questions', { ...aiForm, test_id: id, save: true });
      toast.success('Questions générées par IA et ajoutées au test');
      setShowAiModal(false);
      setAiForm({ technology: '', level: 'moyen', count: 5 });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la génération IA');
    } finally {
      setAiLoading(false);
    }
  };

  const openAdd = () => { setEditQ(null); setForm(emptyQ); setShowModal(true); };
  const openEdit = (q) => {
    setEditQ(q);
    setForm({ text:q.text, options:[...q.options], correct_answer:q.correct_answer, difficulty:q.difficulty, points:q.points });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.options.some(o => !o.trim())) return toast.error('Toutes les options doivent être remplies');
    try {
      if (editQ) {
        await api.put(`/tests/${id}/questions/${editQ.id}`, { ...form, position: editQ.position });
        toast.success('Question mise à jour');
      } else {
        await api.post(`/tests/${id}/questions`, { ...form, position: test.questions.length + 1 });
        toast.success('Question ajoutée');
      }
      setShowModal(false);
      load();
    } catch { toast.error('Erreur lors de la sauvegarde'); }
  };

  const handleDelete = async (qid) => {
    if (!window.confirm('Supprimer cette question ?')) return;
    await api.delete(`/tests/${id}/questions/${qid}`);
    toast.success('Question supprimée');
    load();
  };

  const candidateLink = `${window.location.origin}/test/${test?.access_code}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(candidateLink);
      toast.success('Lien copié dans le presse-papiers');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  const handleSendByEmail = () => {
    const subject = `Invitation au test technique : ${test.title}`;
    const body = [
      `Bonjour,`,
      ``,
      `Vous êtes invité(e) à passer le test technique "${test.title}".`,
      `Durée : ${test.duration_minutes} minutes.`,
      ``,
      `Deux façons d'y accéder :`,
      `1. Lien direct : ${candidateLink}`,
      `2. Ou rendez-vous sur ${window.location.origin}/test et saisissez le code : ${test.access_code}`,
      ``,
      `Cordialement,`,
      `L'équipe RH`,
    ].join('\n');
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (!test) return <div style={{ padding:'32px' }}>Chargement...</div>;

  return (
    <div style={{ padding:'32px' }}>
      <button onClick={() => navigate('/dashboard/tests')} style={{ background:'none', border:'none', cursor:'pointer', color:'#0b3fa6', marginBottom:'16px', fontWeight:'500' }}>
        <ChevronLeft size={16} style={{ display:'inline', verticalAlign:'middle' }} /> Retour aux tests
      </button>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:'700' }}>{test.title}</h1>
          <p style={{ color:'#5f7faf', marginTop:'4px' }}>{test.description}</p>
          <div style={{ display:'flex', gap:'16px', marginTop:'12px', fontSize:'0.9rem', color:'#5f7faf' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Clock size={14} /> {test.duration_minutes} min</span>
            <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Target size={14} /> Seuil: {test.passing_score}%</span>
            <span style={{ background:'#e5eefb', color:'#0b3fa6', padding:'2px 10px', borderRadius:'20px', fontWeight:'600' }}>Code: {test.access_code}</span>
            <button onClick={handleCopyLink}
              style={{ padding:'2px 12px', background:'#f7fbff', border:'1px solid #dce9fb', borderRadius:'20px', cursor:'pointer', fontWeight:'500', fontSize:'0.85rem', color:'#0b3fa6' }}>
              <Link2 size={13} style={{ display:'inline', verticalAlign:'middle', marginRight:'4px' }} />Copier le lien candidat
            </button>
            <button onClick={handleSendByEmail}
              style={{ padding:'2px 12px', background:'#f7fbff', border:'1px solid #dce9fb', borderRadius:'20px', cursor:'pointer', fontWeight:'500', fontSize:'0.85rem', color:'#0b3fa6' }}>
              <Mail size={13} style={{ display:'inline', verticalAlign:'middle', marginRight:'4px' }} />Envoyer par email
            </button>
          </div>
        </div>
        <div style={{ display:'flex', gap:'12px' }}>
          <button onClick={() => setShowAiModal(true)}
            style={{ padding:'10px 24px', background:'linear-gradient(135deg, #f4a261 0%, #e76f51 100%)', color:'white', border:'none', borderRadius:'999px', cursor:'pointer', fontWeight:'600', boxShadow:'0 8px 20px rgba(231, 111, 81, 0.3)' }}>
            ✨ Générer avec l'IA
          </button>
          <button onClick={openAdd}
            style={{ padding:'10px 24px', background:'#0b3fa6', color:'white', border:'none', borderRadius:'999px', cursor:'pointer', fontWeight:'600' }}>
            + Ajouter une question
          </button>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
        {test.questions?.map((q, i) => (
          <div key={q.id} style={{ background:'white', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <span style={{ background:'#e5eefb', color:'#0b3fa6', borderRadius:'50%', width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'0.85rem' }}>{i+1}</span>
                <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:'600', background:`${DIFF_COLORS[q.difficulty]}20`, color:DIFF_COLORS[q.difficulty] }}>
                  {q.difficulty}
                </span>
                <span style={{ fontSize:'0.8rem', color:'#5f7faf' }}>{q.points} pt(s)</span>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => openEdit(q)} style={{ padding:'6px 14px', background:'#eef5ff', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500', fontSize:'0.85rem' }}>Modifier</button>
                <button onClick={() => handleDelete(q.id)} style={{ padding:'6px 14px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem' }}>Supprimer</button>
              </div>
            </div>
            <p style={{ fontWeight:'500', marginBottom:'12px' }}>{q.text}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {q.options.map((opt, idx) => (
                <div key={idx} style={{ padding:'8px 12px', borderRadius:'6px', fontSize:'0.9rem',
                  background: idx === q.correct_answer ? '#dcfce7' : '#f7fbff',
                  border: `1px solid ${idx === q.correct_answer ? '#10b981' : '#dce9fb'}`,
                  color: idx === q.correct_answer ? '#16a34a' : '#374151',
                  fontWeight: idx === q.correct_answer ? '600' : '400' }}>
                  {idx === q.correct_answer ? <CheckCircle2 size={13} style={{ display:'inline', verticalAlign:'middle', marginRight:'4px' }} /> : ''}{opt}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!test.questions?.length && (
          <div style={{ textAlign:'center', padding:'60px', background:'white', borderRadius:'12px', color:'#5f7faf' }}>
            <div style={{ marginBottom:'12px', opacity:0.4 }}><HelpCircle size={48} strokeWidth={1} style={{ margin:'0 auto' }} /></div>
            <p>Aucune question. Ajoutez des questions pour ce test.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, overflowY:'auto', padding:'20px' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'32px', width:'100%', maxWidth:'600px' }}>
            <h2 style={{ marginBottom:'24px', fontWeight:'700' }}>{editQ ? 'Modifier' : 'Nouvelle'} question</h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>Question</label>
                <textarea value={form.text} onChange={e => setForm({...form, text:e.target.value})}
                  style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px', minHeight:'80px', resize:'vertical' }}
                  required />
              </div>
              <label style={{ display:'block', marginBottom:'10px', fontWeight:'500', fontSize:'0.9rem' }}>Options (cochez la bonne réponse)</label>
              {form.options.map((opt, idx) => (
                <div key={idx} style={{ display:'flex', gap:'10px', marginBottom:'10px', alignItems:'center' }}>
                  <input type="radio" checked={form.correct_answer === idx} onChange={() => setForm({...form, correct_answer:idx})} />
                  <input type="text" value={opt} onChange={e => { const o=[...form.options]; o[idx]=e.target.value; setForm({...form,options:o}); }}
                    placeholder={`Option ${idx+1}`}
                    style={{ flex:1, padding:'8px 12px', border:`1px solid ${form.correct_answer===idx?'#10b981':'#dce9fb'}`, borderRadius:'6px' }} />
                </div>
              ))}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginTop:'16px', marginBottom:'24px' }}>
                <div>
                  <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>Difficulté</label>
                  <select value={form.difficulty} onChange={e => setForm({...form,difficulty:e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px' }}>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>Points</label>
                  <input type="number" value={form.points} onChange={e => setForm({...form,points:+e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px' }} min="1" max="10" />
                </div>
              </div>
              <div style={{ display:'flex', gap:'12px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex:1, padding:'12px', background:'#eef5ff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500' }}>Annuler</button>
                <button type="submit"
                  style={{ flex:1, padding:'12px', background:'#0b3fa6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                  {editQ ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAiModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, overflowY:'auto', padding:'20px' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'32px', width:'100%', maxWidth:'480px' }}>
            <h2 style={{ marginBottom:'8px', fontWeight:'700' }}>✨ Générer des questions avec l'IA</h2>
            <p style={{ color:'#5f7faf', fontSize:'0.9rem', marginBottom:'24px' }}>
              Propulsé par Gemini. Les questions générées sont ajoutées directement à ce test.
            </p>
            <form onSubmit={handleGenerateAi}>
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>Technologie</label>
                <input type="text" value={aiForm.technology} onChange={e => setAiForm({...aiForm, technology:e.target.value})}
                  placeholder="Ex: React, SQL, Docker..."
                  style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px' }} required />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
                <div>
                  <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>Niveau</label>
                  <select value={aiForm.level} onChange={e => setAiForm({...aiForm, level:e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px' }}>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:'6px', fontWeight:'500', fontSize:'0.9rem' }}>Nombre de questions</label>
                  <input type="number" value={aiForm.count} onChange={e => setAiForm({...aiForm, count:+e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px' }} min="1" max="15" />
                </div>
              </div>
              <div style={{ display:'flex', gap:'12px' }}>
                <button type="button" onClick={() => setShowAiModal(false)} disabled={aiLoading}
                  style={{ flex:1, padding:'12px', background:'#eef5ff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500' }}>Annuler</button>
                <button type="submit" disabled={aiLoading}
                  style={{ flex:1, padding:'12px', background:'linear-gradient(135deg, #f4a261 0%, #e76f51 100%)', color:'white', border:'none', borderRadius:'999px', cursor:'pointer', fontWeight:'600' }}>
                  {aiLoading ? 'Génération...' : 'Générer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
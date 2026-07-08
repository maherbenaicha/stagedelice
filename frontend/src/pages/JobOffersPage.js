import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function JobOffersPage() {
  const [offers, setOffers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    position: '', level: 'Junior', technologies: '',
    title: '', description: '', missions: '', responsibilities: '',
    required_skills: [], desired_profile: '', recommended_questions: [], status: 'draft',
  });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/job-offers').then(r => setOffers(r.data));
  }, []);

  const handleGenerate = async () => {
    if (!form.position) return toast.error('Saisissez le poste');
    setGenerating(true);
    try {
      const r = await api.post('/job-offers/generate', {
        position: form.position, level: form.level, technologies: form.technologies,
      });
      const g = r.data.generated;
      // L'IA renvoie parfois ces champs sous forme de tableau au lieu
      // d'une chaîne : on normalise toujours en texte pour l'affichage
      // dans les <textarea> et pour éviter une erreur SQL au moment
      // d'enregistrer l'offre.
      const asText = (v) => (Array.isArray(v) ? v.join('\n') : (v || ''));
      setForm(f => ({
        ...f,
        title: g.title || f.title,
        description: asText(g.description),
        missions: asText(g.missions),
        responsibilities: asText(g.responsibilities),
        required_skills: g.required_skills || [],
        desired_profile: asText(g.desired_profile),
        recommended_questions: g.recommended_questions || [],
      }));
      toast.success('Offre générée par l\'IA — modifiez avant publication');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur génération');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (!form.title || !form.position) return toast.error('Titre et poste requis');
    setSaving(true);
    try {
      const payload = { ...form, status: publish ? 'published' : 'draft' };
      const r = await api.post('/job-offers', payload);
      toast.success(publish ? 'Offre publiée avec pipeline IA' : 'Offre enregistrée en brouillon');
      setShowForm(false);
      navigate(`/dashboard/talent/offers/${r.data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur création');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #dce9fb', borderRadius: '8px', fontSize: '0.95rem', marginBottom: '12px' };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Offres d'emploi</h1>
          <p style={{ color: '#5f7faf' }}>Créez des offres avec l'aide de l'IA</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#0b3fa6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          + Nouvelle offre IA
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '16px', fontWeight: '600' }}>Génération IA</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#5f7faf' }}>Poste *</label>
              <input style={inputStyle} placeholder="Développeur Backend Java" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#5f7faf' }}>Niveau</label>
              <select style={inputStyle} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                <option>Junior</option><option>Intermédiaire</option><option>Senior</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#5f7faf' }}>Technologies</label>
              <input style={inputStyle} placeholder="Spring Boot, SQL" value={form.technologies} onChange={e => setForm(f => ({ ...f, technologies: e.target.value }))} />
            </div>
          </div>
          <button onClick={handleGenerate} disabled={generating} style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}>
            {generating ? 'Génération...' : '🤖 Générer avec l\'IA'}
          </button>

          {form.title && (
            <>
              <h3 style={{ marginBottom: '12px', fontWeight: '600' }}>Modifier avant publication</h3>
              <label style={{ fontSize: '0.85rem', color: '#5f7faf' }}>Titre</label>
              <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <label style={{ fontSize: '0.85rem', color: '#5f7faf' }}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: '80px' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <label style={{ fontSize: '0.85rem', color: '#5f7faf' }}>Missions</label>
              <textarea style={{ ...inputStyle, minHeight: '80px' }} value={form.missions} onChange={e => setForm(f => ({ ...f, missions: e.target.value }))} />
              <label style={{ fontSize: '0.85rem', color: '#5f7faf' }}>Responsabilités</label>
              <textarea style={{ ...inputStyle, minHeight: '80px' }} value={form.responsibilities} onChange={e => setForm(f => ({ ...f, responsibilities: e.target.value }))} />
              <label style={{ fontSize: '0.85rem', color: '#5f7faf' }}>Profil recherché</label>
              <textarea style={{ ...inputStyle, minHeight: '60px' }} value={form.desired_profile} onChange={e => setForm(f => ({ ...f, desired_profile: e.target.value }))} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button onClick={() => handleSave(true)} disabled={saving} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  {saving ? 'Enregistrement...' : '✅ Publier l\'offre'}
                </button>
                <button onClick={() => handleSave(false)} disabled={saving} style={{ padding: '10px 20px', background: '#e5eefb', color: '#0b3fa6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Enregistrer en brouillon
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#e5eefb', color: '#0b3fa6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f7fbff' }}>
              {['Titre', 'Poste', 'Niveau', 'Statut', 'Candidats', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#5f7faf', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {offers.map(o => (
              <tr key={o.id} style={{ borderTop: '1px solid #dce9fb' }}>
                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{o.title}</td>
                <td style={{ padding: '14px 16px' }}>{o.position}</td>
                <td style={{ padding: '14px 16px' }}>{o.level}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', background: o.status === 'published' ? '#dcfce7' : '#e5eefb', color: o.status === 'published' ? '#16a34a' : '#0b3fa6' }}>{o.status}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>{o.candidate_count || 0}</td>
                <td style={{ padding: '14px 16px' }}>
                  <button onClick={() => navigate(`/dashboard/talent/offers/${o.id}`)} style={{ padding: '6px 14px', background: '#e5eefb', color: '#0b3fa6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Gérer</button>
                </td>
              </tr>
            ))}
            {offers.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#5f7faf' }}>Aucune offre — créez-en une avec l'IA</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { ChevronLeft, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EMAIL_TYPES = [
  { key: 'invitation_test', label: 'Invitation test' },
  { key: 'acceptation', label: 'Acceptation' },
  { key: 'refus', label: 'Refus' },
  { key: 'invitation_entretien', label: 'Invitation entretien' },
  { key: 'relance', label: 'Relance' },
];

const ScoreBar = ({ label, value }) => (
  <div style={{ marginBottom: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
      <span>{label}</span><strong>{value}%</strong>
    </div>
    <div style={{ background: '#e5eefb', borderRadius: '4px', height: '8px' }}>
      <div style={{ background: '#0b3fa6', borderRadius: '4px', height: '8px', width: `${value || 0}%` }} />
    </div>
  </div>
);

export default function TalentCandidateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [emailType, setEmailType] = useState('invitation_test');
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get(`/talent/applications/${id}`).then(r => setApp(r.data));
  }, [id]);

  const generateEmail = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/talent/emails/generate', { application_id: parseInt(id, 10), template_type: emailType });
      setGeneratedEmail(r.data);
      toast.success('Email généré par l\'IA');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur génération email');
    } finally {
      setGenerating(false);
    }
  };

  if (!app) return <div style={{ padding: '32px' }}>Chargement...</div>;

  const extracted = app.extracted || {};

  return (
    <div style={{ padding: '32px' }}>
      <button onClick={() => navigate('/dashboard/talent/candidates')} style={{ marginBottom: '16px', background: 'none', border: 'none', color: '#0b3fa6', cursor: 'pointer' }}><ChevronLeft size={16} style={{ display:'inline', verticalAlign:'middle' }} /> Retour</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{app.full_name}</h1>
            <p style={{ color: '#5f7faf' }}>{app.email} {app.phone && `• ${app.phone}`}</p>
            <p style={{ marginTop: '8px' }}><strong>Offre :</strong> {app.job_title}</p>

            <h2 style={{ fontWeight: '600', marginTop: '20px', marginBottom: '8px' }}>Profil IA</h2>
            <p style={{ background: '#f0f9ff', padding: '14px', borderRadius: '8px', fontStyle: 'italic' }}>{app.ai_profile_summary}</p>

            <h3 style={{ fontWeight: '600', marginTop: '16px' }}>Compétences principales</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {(extracted.technical_skills || extracted.technologies || []).slice(0, 8).map((s, i) => (
                <span key={i} style={{ padding: '4px 12px', background: '#e5eefb', color: '#0b3fa6', borderRadius: '20px', fontSize: '0.85rem' }}>{s}</span>
              ))}
            </div>

            <h3 style={{ fontWeight: '600', marginTop: '16px', color: '#16a34a' }}>Points forts</h3>
            <ul>{(app.ai_strengths || []).map((s, i) => <li key={i}><CheckCircle2 size={14} style={{ display:"inline", verticalAlign:"middle", color:"#16a34a", marginRight:"4px" }} />{s}</li>)}</ul>

            <h3 style={{ fontWeight: '600', marginTop: '8px', color: '#dc2626' }}>Points faibles</h3>
            <ul>{(app.ai_weaknesses || []).map((w, i) => <li key={i}><AlertTriangle size={14} style={{ display:"inline", verticalAlign:"middle", color:"#f59e0b", marginRight:"4px" }} />{w}</li>)}</ul>

            <div style={{ marginTop: '16px', padding: '14px', background: '#fef3c7', borderRadius: '8px' }}>
              <strong>Recommandation IA :</strong> {app.ai_recommendation}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontWeight: '600', marginBottom: '12px' }}>Données extraites du CV</h2>
            <p><strong>Formation :</strong> {(extracted.education || []).map(e => e.degree).join(', ') || '-'}</p>
            <p><strong>Expérience :</strong> {extracted.years_of_experience ?? '-'} ans</p>
            <p><strong>Langues :</strong> {(extracted.languages || []).map(l => `${l.language} (${l.level})`).join(', ') || '-'}</p>
            <p><strong>Certifications :</strong> {(extracted.certifications || []).join(', ') || '-'}</p>
          </div>
        </div>

        <div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontWeight: '600', marginBottom: '16px' }}>Score de compatibilité</h2>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem', fontWeight: '700', color: app.score_global >= 80 ? '#10b981' : '#f59e0b' }}>{app.score_global}%</span>
            </div>
            <ScoreBar label="Compétences techniques" value={app.score_technical} />
            <ScoreBar label="Expérience" value={app.score_experience} />
            <ScoreBar label="Formation" value={app.score_education} />
            <ScoreBar label="Certifications" value={app.score_certifications} />
            <ScoreBar label="Langues" value={app.score_languages} />

            <h3 style={{ fontWeight: '600', marginTop: '16px', color: '#16a34a' }}>Points forts (match)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(app.strengths || []).map((s, i) => <span key={i} style={{ color: '#16a34a' }}><CheckCircle2 size={14} style={{ display:"inline", verticalAlign:"middle", color:"#16a34a", marginRight:"4px" }} />{s}</span>)}
            </div>

            <h3 style={{ fontWeight: '600', marginTop: '12px', color: '#dc2626' }}>Compétences manquantes</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(app.missing_skills || []).map((s, i) => <span key={i} style={{ color: '#dc2626' }}><XCircle size={14} style={{ display:"inline", verticalAlign:"middle", color:"#dc2626", marginRight:"4px" }} />{s}</span>)}
            </div>

            <p style={{ marginTop: '16px', fontSize: '0.9rem', color: '#5f7faf', fontStyle: 'italic' }}>{app.explanation}</p>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontWeight: '600', marginBottom: '12px' }}>Email personnalisé IA</h2>
            <select value={emailType} onChange={e => setEmailType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #dce9fb', borderRadius: '8px', marginBottom: '12px' }}>
              {EMAIL_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <button onClick={generateEmail} disabled={generating} style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
              {generating ? 'Génération...' : '🤖 Générer email IA'}
            </button>
            {generatedEmail && (
              <div style={{ marginTop: '16px', padding: '14px', background: '#f7fbff', borderRadius: '8px' }}>
                <p><strong>À :</strong> {generatedEmail.to_email}</p>
                <p><strong>Objet :</strong> {generatedEmail.subject}</p>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', marginTop: '8px' }}>{generatedEmail.body}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

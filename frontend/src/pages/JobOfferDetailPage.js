import { ChevronLeft, BrainCircuit, CheckCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const medals = ['🥇', '🥈', '🥉'];

export default function JobOfferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pipeline, setPipeline] = useState([]);
  const [savingPipeline, setSavingPipeline] = useState(false);

  const load = () => {
    api.get(`/job-offers/${id}`).then(r => {
      setOffer(r.data);
      setPipeline(r.data.pipeline?.steps || []);
    });
    api.get(`/talent/offers/${id}/ranking`).then(r => setRanking(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [id]);

  const handleUpload = async () => {
    if (!files.length) return toast.error('Sélectionnez des PDF');
    setUploading(true);
    const fd = new FormData();
    files.forEach(f => fd.append('cvs', f));
    try {
      const r = await api.post(`/talent/offers/${id}/cvs`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${r.data.results?.filter(x => x.status === 'analyzed').length || 0} CV analysé(s)`);
      setFiles([]);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const savePipeline = async () => {
    setSavingPipeline(true);
    try {
      await api.put(`/job-offers/${id}/pipeline`, { steps: pipeline });
      toast.success('Pipeline mis à jour');
    } catch {
      toast.error('Erreur sauvegarde pipeline');
    } finally {
      setSavingPipeline(false);
    }
  };

  const regeneratePipeline = async () => {
    try {
      const r = await api.post(`/job-offers/${id}/pipeline/regenerate`);
      setPipeline(r.data.steps || []);
      toast.success('Pipeline régénéré par l\'IA');
    } catch {
      toast.error('Erreur régénération');
    }
  };

  const togglePublish = async () => {
    const newStatus = offer.status === 'published' ? 'draft' : 'published';
    try {
      await api.put(`/job-offers/${id}`, { ...offer, status: newStatus });
      toast.success(newStatus === 'published' ? 'Offre publiée' : 'Offre repassée en brouillon');
      load();
    } catch {
      toast.error('Erreur changement de statut');
    }
  };

  if (!offer) return <div style={{ padding: '32px' }}>Chargement...</div>;

  return (
    <div style={{ padding: '32px' }}>
      <button onClick={() => navigate('/dashboard/talent/offers')} style={{ marginBottom: '16px', background: 'none', border: 'none', color: '#0b3fa6', cursor: 'pointer' }}><ChevronLeft size={16} style={{ display:'inline', verticalAlign:'middle' }} /> Retour aux offres</button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>{offer.title}</h1>
              <p style={{ color: '#5f7faf', marginBottom: '16px' }}>{offer.position} — {offer.level}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', background: offer.status === 'published' ? '#dcfce7' : '#e5eefb', color: offer.status === 'published' ? '#16a34a' : '#0b3fa6' }}>{offer.status}</span>
              <br />
              <button onClick={togglePublish} style={{ marginTop: '8px', padding: '6px 14px', background: offer.status === 'published' ? '#e5eefb' : '#10b981', color: offer.status === 'published' ? '#0b3fa6' : 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                {offer.status === 'published' ? 'Repasser en brouillon' : 'Publier'}
              </button>
            </div>
          </div>
          <p style={{ marginBottom: '12px' }}><strong>Technologies :</strong> {offer.technologies}</p>
          <p style={{ marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{offer.description}</p>
          <p style={{ marginBottom: '12px', whiteSpace: 'pre-wrap' }}><strong>Missions :</strong><br />{offer.missions}</p>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontWeight: '600', marginBottom: '16px' }}>Top candidats</h2>
          {ranking.slice(0, 5).map((c, i) => (
            <div key={c.application_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f7fbff', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }}
              onClick={() => navigate(`/dashboard/talent/candidates/${c.application_id}`)}>
              <span>{medals[i] || `#${i + 1}`} {c.full_name}</span>
              <strong style={{ color: '#10b981' }}>{c.score_global}%</strong>
            </div>
          ))}
          {!ranking.length && <p style={{ color: '#5f7faf', fontSize: '0.9rem' }}>Importez des CV pour voir le classement</p>}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontWeight: '600', marginBottom: '16px' }}>Importer des CV (PDF)</h2>
        <input type="file" accept=".pdf" multiple onChange={e => setFiles(Array.from(e.target.files))} style={{ marginBottom: '12px' }} />
        <button onClick={handleUpload} disabled={uploading} style={{ padding: '10px 20px', background: '#0b3fa6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {uploading ? 'Analyse IA en cours...' : 'Analyser les CV'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontWeight: '600' }}>Parcours de recrutement</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={regeneratePipeline} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Régénérer IA</button>
            <button onClick={savePipeline} disabled={savingPipeline} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Sauvegarder</button>
          </div>
        </div>
        {pipeline.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
            <span style={{ background: '#0b3fa6', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>{step.order || i + 1}</span>
            <div style={{ flex: 1 }}>
              <input value={step.title || ''} onChange={e => { const s = [...pipeline]; s[i] = { ...s[i], title: e.target.value }; setPipeline(s); }}
                style={{ width: '100%', padding: '8px', border: '1px solid #dce9fb', borderRadius: '6px', marginBottom: '6px', fontWeight: '600' }} />
              <input value={step.description || ''} onChange={e => { const s = [...pipeline]; s[i] = { ...s[i], description: e.target.value }; setPipeline(s); }}
                style={{ width: '100%', padding: '8px', border: '1px solid #dce9fb', borderRadius: '6px', fontSize: '0.9rem' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
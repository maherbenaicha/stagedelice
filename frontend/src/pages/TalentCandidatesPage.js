import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function TalentCandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [offers, setOffers] = useState([]);
  const [filters, setFilters] = useState({ job_offer_id: '', sort: 'score', skill: '', min_experience: '', diploma: '', min_score: '' });
  const navigate = useNavigate();

  useEffect(() => { api.get('/job-offers').then(r => setOffers(r.data)); }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    api.get(`/talent/applications?${params}`).then(r => setCandidates(r.data));
  }, [filters]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Talent AI — Candidats analysés</h1>
        <p style={{ color: '#5f7faf' }}>{candidates.length} candidat(s) avec score IA</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <select value={filters.job_offer_id} onChange={e => setFilters(f => ({ ...f, job_offer_id: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #dce9fb', borderRadius: '8px' }}>
          <option value="">Toutes les offres</option>
          {offers.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
        <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #dce9fb', borderRadius: '8px' }}>
          <option value="score">Meilleur score</option>
          <option value="experience">Années d'expérience</option>
        </select>
        <input placeholder="Compétence (ex: React)" value={filters.skill} onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #dce9fb', borderRadius: '8px' }} />
        <input placeholder="Exp. min (années)" type="number" value={filters.min_experience} onChange={e => setFilters(f => ({ ...f, min_experience: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #dce9fb', borderRadius: '8px', width: '140px' }} />
        <input placeholder="Diplôme" value={filters.diploma} onChange={e => setFilters(f => ({ ...f, diploma: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #dce9fb', borderRadius: '8px' }} />
        <input placeholder="Score min (%)" type="number" value={filters.min_score} onChange={e => setFilters(f => ({ ...f, min_score: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #dce9fb', borderRadius: '8px', width: '120px' }} />
      </div>

      {candidates.slice(0, 3).length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontWeight: '600', marginBottom: '12px' }}>Top candidats</h2>
          {candidates.slice(0, 3).map((c, i) => (
            <div key={c.id} style={{ fontSize: '1.1rem', marginBottom: '6px' }}>
              {medals[i]} {c.full_name} — <strong style={{ color: '#10b981' }}>{c.score_global}%</strong>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f7fbff' }}>
              {['Candidat', 'Offre', 'Score', 'Exp.', 'Recommandation', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#5f7faf', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid #dce9fb' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: '500' }}>{c.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#5f7faf' }}>{c.email}</div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>{c.job_title}</td>
                <td style={{ padding: '14px 16px', fontWeight: '700', fontSize: '1.1rem', color: c.score_global >= 80 ? '#10b981' : c.score_global >= 60 ? '#f59e0b' : '#ef4444' }}>
                  {c.score_global != null ? `${c.score_global}%` : '-'}
                </td>
                <td style={{ padding: '14px 16px' }}>{c.extracted?.years_of_experience ?? '-'} ans</td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', maxWidth: '200px' }}>{c.ai_recommendation || '-'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <button onClick={() => navigate(`/dashboard/talent/candidates/${c.id}`)}
                    style={{ padding: '6px 14px', background: '#e5eefb', color: '#0b3fa6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Fiche IA</button>
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#5f7faf' }}>Aucun candidat analysé — importez des CV depuis une offre</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

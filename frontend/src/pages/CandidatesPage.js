import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function CandidatesPage() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => { api.get('/sessions').then(r => setSessions(r.data)); }, []);

  const filtered = sessions.filter(s =>
    s.candidate_name.toLowerCase().includes(filter.toLowerCase()) ||
    s.candidate_email.toLowerCase().includes(filter.toLowerCase()) ||
    s.test_title?.toLowerCase().includes(filter.toLowerCase())
  );

  const formatTime = (s) => s ? `${Math.floor(s/60)}m ${s%60}s` : '-';

  return (
    <div style={{ padding:'32px' }}>
      <div style={{ marginBottom:'32px' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:'700' }}>Candidats</h1>
        <p style={{ color:'#5f7faf' }}>{sessions.length} session(s) enregistrée(s)</p>
      </div>
      <div style={{ background:'white', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding:'16px 24px', borderBottom:'1px solid #dce9fb' }}>
          <input type="text" placeholder="Rechercher par nom, email, test..." value={filter} onChange={e=>setFilter(e.target.value)}
            style={{ width:'100%', maxWidth:'400px', padding:'10px 14px', border:'1px solid #dce9fb', borderRadius:'8px', fontSize:'0.95rem' }} />
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f7fbff' }}>
              {['Candidat','Test','Catégorie','Score','Statut','Temps','Date','Détail'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.8rem', fontWeight:'600', color:'#5f7faf', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderTop:'1px solid #dce9fb' }}>
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ fontWeight:'500' }}>{s.candidate_name}</div>
                  <div style={{ fontSize:'0.8rem', color:'#5f7faf' }}>{s.candidate_email}</div>
                </td>
                <td style={{ padding:'14px 16px', fontSize:'0.9rem' }}>{s.test_title}</td>
                <td style={{ padding:'14px 16px' }}>
                  <span style={{ padding:'3px 10px', background:'#e5eefb', color:'#0b3fa6', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600' }}>{s.category}</span>
                </td>
                <td style={{ padding:'14px 16px', fontWeight:'700', fontSize:'1.1rem', color: s.score >= s.passing_score ? '#10b981' : '#ef4444' }}>
                  {s.score != null ? `${s.score}%` : '-'}
                </td>
                <td style={{ padding:'14px 16px' }}>
                  {s.status ? (
                    <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600',
                      background: s.status === 'reussi' ? '#dcfce7' : '#fee2e2',
                      color: s.status === 'reussi' ? '#16a34a' : '#dc2626' }}>
                      {s.status === 'reussi' ? '✓ Reçu' : '✗ Refusé'}
                    </span>
                  ) : <span style={{ color:'#5f7faf', fontSize:'0.85rem' }}>En cours</span>}
                </td>
                <td style={{ padding:'14px 16px', fontSize:'0.9rem', color:'#5f7faf' }}>{formatTime(s.time_taken_seconds)}</td>
                <td style={{ padding:'14px 16px', fontSize:'0.85rem', color:'#5f7faf' }}>
                  {new Date(s.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding:'14px 16px' }}>
                  {s.submitted_at && (
                    <button onClick={() => navigate(`/candidates/${s.id}`)}
                      style={{ padding:'6px 14px', background:'#e5eefb', color:'#0b3fa6', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500', fontSize:'0.85rem' }}>
                      Voir
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', color:'#5f7faf' }}>Aucun résultat</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

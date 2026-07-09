import { ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => { api.get(`/sessions/${id}`).then(r => setSession(r.data)); }, [id]);

  if (!session) return <div style={{ padding:'32px' }}>Chargement...</div>;

  const formatTime = (s) => `${Math.floor(s/60)}m ${s%60}s`;
  const passed = session.status === 'reussi';

  return (
    <div style={{ padding:'32px' }}>
      <button onClick={() => navigate('/candidates')} style={{ background:'none', border:'none', cursor:'pointer', color:'#0b3fa6', marginBottom:'16px', fontWeight:'500' }}>
        <ChevronLeft size={16} style={{ display:'inline', verticalAlign:'middle' }} /> Retour aux candidats
      </button>
      <div style={{ background:'white', borderRadius:'16px', padding:'32px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', marginBottom:'24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:'700', marginBottom:'4px' }}>{session.candidate_name}</h1>
            <p style={{ color:'#5f7faf' }}>{session.candidate_email} {session.candidate_phone && `• ${session.candidate_phone}`}</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'3rem', fontWeight:'700', color: passed ? '#10b981' : '#ef4444' }}>{session.score}%</div>
            <span style={{ padding:'6px 16px', borderRadius:'20px', fontWeight:'700', fontSize:'0.9rem',
              background: passed ? '#dcfce7' : '#fee2e2', color: passed ? '#16a34a' : '#dc2626' }}>
              {passed ? '✓ REÇU' : '✗ REFUSÉ'}
            </span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px', marginTop:'24px', paddingTop:'24px', borderTop:'1px solid #dce9fb' }}>
          {[
            ['Test', session.test_title],
            ['Catégorie', session.category],
            ['Points', `${session.earned_points}/${session.total_points}`],
            ['Temps', formatTime(session.time_taken_seconds)],
          ].map(([label, val]) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'0.8rem', color:'#5f7faf', marginBottom:'4px', textTransform:'uppercase' }}>{label}</div>
              <div style={{ fontWeight:'600', fontSize:'1rem' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {session.answers && (
        <div>
          <h2 style={{ fontWeight:'700', marginBottom:'16px' }}>Détail des réponses</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {session.answers.map((a, i) => (
              <div key={i} style={{ background:'white', borderRadius:'10px', padding:'16px', borderLeft:`4px solid ${a.is_correct ? '#10b981' : '#ef4444'}`, boxShadow:'0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontWeight:'500', fontSize:'0.9rem' }}>Question #{a.question_id}</span>
                  <span style={{ fontWeight:'600', color: a.is_correct ? '#10b981' : '#ef4444' }}>
                    {a.is_correct ? `2713 +${a.points} pt(s)` : '2717 0 pt'}
                  </span>
                </div>
                {!a.is_correct && <div style={{ marginTop:'8px', fontSize:'0.85rem', color:'#5f7faf' }}>
                  Réponse candidate: Option {a.candidate_answer + 1} | Bonne réponse: Option {a.correct_answer + 1}
                </div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function CandidateTest() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem('tt_session');
    if (!data) { navigate('/'); return; }
    const parsed = JSON.parse(data);
    setSessionData(parsed);
    const expires = new Date(parsed.expires_at).getTime();
    setTimeLeft(Math.max(0, Math.floor((expires - Date.now()) / 1000)));
  }, [navigate]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (!sessionData) return;
    setSubmitting(true);
    try {
      const res = await api.post('/sessions/submit', {
        session_id: sessionData.session_id, answers
      });
      sessionStorage.removeItem('tt_session');
      sessionStorage.setItem('tt_result', JSON.stringify(res.data));
      navigate(`/test/result/${sessionData.session_id}`);
    } catch (err) {
      if (auto) { toast.error('Temps écoulé — soumission impossible'); navigate('/'); }
      else toast.error(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally { setSubmitting(false); }
  }, [sessionData, answers, navigate]);

  useEffect(() => {
    if (!timeLeft) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  if (!sessionData) return <div style={{ padding:'32px', textAlign:'center' }}>Chargement...</div>;

  const questions = sessionData.questions || [];
  const q = questions[currentIdx];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isUrgent = timeLeft < 300;
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ minHeight:'100vh', background:'#f7fbff' }}>
      {/* Header */}
      <div style={{ background:'white', borderBottom:'1px solid #dce9fb', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 }}>
        <div>
          <div style={{ fontWeight:'700', fontSize:'1.1rem' }}>{sessionData.test?.title}</div>
          <div style={{ fontSize:'0.85rem', color:'#5f7faf' }}>{answeredCount}/{questions.length} réponses</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ background: isUrgent ? '#fee2e2' : '#e5eefb', color: isUrgent ? '#ef4444' : '#0b3fa6',
            padding:'8px 20px', borderRadius:'8px', fontWeight:'700', fontSize:'1.2rem', fontVariantNumeric:'tabular-nums' }}>
            {isUrgent ? '⚠️ ' : '⏱ '}{mins}:{secs.toString().padStart(2,'0')}
          </div>
          <button onClick={() => { if(window.confirm('Soumettre le test maintenant ?')) handleSubmit(); }}
            disabled={submitting}
            style={{ padding:'10px 24px', background:'#10b981', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'700' }}>
            {submitting ? 'Envoi...' : 'Terminer'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'32px 20px' }}>
        {/* Progress */}
        <div style={{ background:'#dce9fb', borderRadius:'8px', height:'6px', marginBottom:'24px' }}>
          <div style={{ background:'#0b3fa6', borderRadius:'8px', height:'6px', width:`${(currentIdx+1)/questions.length*100}%`, transition:'width 0.3s' }} />
        </div>

        {/* Question */}
        {q && (
          <div style={{ background:'white', borderRadius:'16px', padding:'32px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', marginBottom:'24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
              <span style={{ color:'#5f7faf', fontWeight:'500' }}>Question {currentIdx + 1} / {questions.length}</span>
              <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600',
                background: q.difficulty==='facile'?'#dcfce7':q.difficulty==='moyen'?'#fef3c7':'#fee2e2',
                color: q.difficulty==='facile'?'#16a34a':q.difficulty==='moyen'?'#d97706':'#dc2626' }}>
                {q.difficulty} · {q.points} pt(s)
              </span>
            </div>
            <p style={{ fontSize:'1.1rem', fontWeight:'600', lineHeight:'1.6', marginBottom:'24px' }}>{q.text}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {q.options.map((opt, idx) => (
                <button key={idx} onClick={() => setAnswers(prev => ({...prev, [q.id]: idx}))}
                  style={{ padding:'14px 20px', border:`2px solid ${answers[q.id]===idx?'#0b3fa6':'#dce9fb'}`,
                    borderRadius:'10px', background: answers[q.id]===idx?'#e5eefb':'white',
                    color: answers[q.id]===idx?'#0b3fa6':'#374151', cursor:'pointer', textAlign:'left',
                    fontWeight: answers[q.id]===idx?'600':'400', fontSize:'0.95rem', transition:'all 0.15s' }}>
                  <span style={{ marginRight:'10px', fontWeight:'700' }}>{['A','B','C','D'][idx]}.</span>{opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => setCurrentIdx(i => Math.max(0, i-1))} disabled={currentIdx===0}
            style={{ padding:'10px 24px', background:'white', border:'1px solid #dce9fb', borderRadius:'8px', cursor:'pointer', fontWeight:'500', color: currentIdx===0?'#c2d7f2':'#374151' }}>
            ← Précédent
          </button>

          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', justifyContent:'center', maxWidth:'400px' }}>
            {questions.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentIdx(idx)}
                style={{ width:'32px', height:'32px', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600',
                  background: idx===currentIdx?'#0b3fa6':answers[questions[idx]?.id]!=null?'#10b981':'#dce9fb',
                  color: idx===currentIdx||answers[questions[idx]?.id]!=null?'white':'#5f7faf' }}>
                {idx+1}
              </button>
            ))}
          </div>

          {currentIdx < questions.length - 1 ? (
            <button onClick={() => setCurrentIdx(i => i+1)}
              style={{ padding:'10px 24px', background:'#0b3fa6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500' }}>
              Suivant →
            </button>
          ) : (
            <button onClick={() => { if(window.confirm('Soumettre le test ?')) handleSubmit(); }}
              style={{ padding:'10px 24px', background:'#10b981', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'700' }}>
              ✓ Soumettre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, PartyPopper, Frown } from 'lucide-react';

export default function TestResult() {
  const { sessionId } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem('tt_result');
    if (data) setResult(JSON.parse(data));
  }, [sessionId]);

  if (!result) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f7fbff' }}>
      <div style={{ textAlign:'center' }}>
        <CheckCircle2 size={56} color="#10b981" style={{ margin:'0 auto 16px' }} />
        <h2>Test soumis avec succès</h2>
        <p style={{ color:'#5f7faf', marginTop:'8px' }}>Vos résultats ont été enregistrés.</p>
      </div>
    </div>
  );

  const passed = result.score >= result.passing_score;
  const minutes = Math.floor(result.time_taken / 60);
  const seconds = result.time_taken % 60;

  return (
    <div style={{ minHeight:'100vh', background: passed ? 'linear-gradient(135deg,#065f46,#10b981)' : 'linear-gradient(135deg,#7f1d1d,#ef4444)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'20px', padding:'48px', width:'100%', maxWidth:'500px', textAlign:'center', boxShadow:'0 25px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ marginBottom:'16px' }}>
          {passed
            ? <PartyPopper size={64} color="#16a34a" style={{ margin:'0 auto' }} />
            : <Frown size={64} color="#dc2626" style={{ margin:'0 auto' }} />
          }
        </div>
        <h1 style={{ fontSize:'2rem', fontWeight:'700', color: passed?'#065f46':'#7f1d1d', marginBottom:'8px' }}>
          {passed ? 'Félicitations !' : 'Test non validé'}
        </h1>
        <p style={{ color:'#5f7faf', marginBottom:'32px' }}>
          {passed ? 'Vous avez réussi ce test technique !' : "Vous n'avez pas atteint le score minimum requis."}
        </p>

        <div style={{ background: passed?'#dcfce7':'#fee2e2', borderRadius:'16px', padding:'24px', marginBottom:'24px' }}>
          <div style={{ fontSize:'4rem', fontWeight:'700', color: passed?'#16a34a':'#dc2626' }}>{result.score}%</div>
          <div style={{ color:'#5f7faf', marginTop:'4px' }}>Score obtenu</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'24px' }}>
          {[
            ['Points', `${result.earned_points}/${result.total_points}`],
            ['Seuil', `${result.passing_score}%`],
            ['Temps', `${minutes}m${seconds}s`],
          ].map(([label, val]) => (
            <div key={label} style={{ background:'#f7fbff', borderRadius:'10px', padding:'12px' }}>
              <div style={{ fontSize:'0.75rem', color:'#5f7faf', textTransform:'uppercase', marginBottom:'4px' }}>{label}</div>
              <div style={{ fontWeight:'700', fontSize:'1rem' }}>{val}</div>
            </div>
          ))}
        </div>

        <p style={{ color:'#5f7faf', fontSize:'0.9rem' }}>
          Vos résultats ont été transmis à l'équipe RH. Vous serez contacté(e) prochainement.
        </p>
      </div>
    </div>
  );
}

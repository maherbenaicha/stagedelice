import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ background:'white', borderRadius:'12px', padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', borderLeft:`4px solid ${color}` }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div>
        <p style={{ color:'#5f7faf', fontSize:'0.85rem', marginBottom:'4px' }}>{label}</p>
        <p style={{ fontSize:'2rem', fontWeight:'700', color:'#0b2d63' }}>{value}</p>
      </div>
      <span style={{ fontSize:'2rem' }}>{icon}</span>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  const handleExport = async (type) => {
    const url = `/reports/export/${type}`;
    const res = await api.get(url, { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(res.data);
    a.download = `resultats.${type === 'excel' ? 'xlsx' : 'pdf'}`;
    a.click();
  };

  if (loading) return <div style={{ padding:'32px', textAlign:'center' }}>Chargement...</div>;

  const chartData = {
    labels: stats?.tests_stats?.map(t => t.title.substring(0, 20)) || [],
    datasets: [{
      label: 'Score moyen (%)',
      data: stats?.tests_stats?.map(t => Math.round(t.avg_score || 0)) || [],
      backgroundColor: '#0b3fa6',
      borderRadius: 6,
    }]
  };

  return (
    <div style={{ padding:'32px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:'700' }}>Tableau de bord</h1>
          <p style={{ color:'#5f7faf' }}>Vue d'ensemble de la plateforme</p>
        </div>
        <div style={{ display:'flex', gap:'12px' }}>
          <button onClick={() => handleExport('excel')} style={{ padding:'10px 20px', background:'#10b981', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500' }}>
            📥 Export Excel
          </button>
          <button onClick={() => handleExport('pdf')} style={{ padding:'10px 20px', background:'#ef4444', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500' }}>
            📄 Export PDF
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'20px', marginBottom:'32px' }}>
        <StatCard icon="📝" label="Tests actifs" value={stats?.total_tests || 0} color="#0b3fa6" />
        <StatCard icon="👥" label="Sessions complètes" value={stats?.total_sessions || 0} color="#10b981" />
        <StatCard icon="✅" label="Candidats reçus" value={stats?.total_passed || 0} color="#f59e0b" />
        <StatCard icon="📊" label="Score moyen" value={`${stats?.avg_score || 0}%`} color="#8b5cf6" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
        <div style={{ background:'white', borderRadius:'12px', padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom:'20px', fontWeight:'600' }}>Performance par test</h2>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div style={{ background:'white', borderRadius:'12px', padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom:'20px', fontWeight:'600' }}>Dernières sessions</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {stats?.recent_sessions?.map((s, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', background:'#f7fbff', borderRadius:'8px' }}>
                <div>
                  <div style={{ fontWeight:'500', fontSize:'0.9rem' }}>{s.candidate_name}</div>
                  <div style={{ color:'#5f7faf', fontSize:'0.8rem' }}>{s.title}</div>
                </div>
                <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600',
                  background: s.status === 'réussi' ? '#dcfce7' : '#fee2e2',
                  color: s.status === 'réussi' ? '#16a34a' : '#dc2626' }}>
                  {s.score}%
                </span>
              </div>
            ))}
            {!stats?.recent_sessions?.length && <p style={{ color:'#5f7faf', textAlign:'center', padding:'20px' }}>Aucune session pour l'instant</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
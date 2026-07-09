import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Users, Briefcase, ClipboardList, BarChart2, Star, Lightbulb } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ color: '#5f7faf', fontSize: '0.85rem', marginBottom: '4px' }}>{label}</p>
        <p style={{ fontSize: '2rem', fontWeight: '700', color: '#0b2d63' }}>{value}</p>
      </div>
      <span style={{ color: color, opacity: 0.85 }}><Icon size={32} strokeWidth={1.5} /></span>
    </div>
  </div>
);

export default function TalentDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/talent/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '32px', textAlign: 'center' }}>Chargement...</div>;

  const skillsChart = {
    labels: stats?.skills_distribution?.map(s => s.name) || [],
    datasets: [{ label: 'Compétences', data: stats?.skills_distribution?.map(s => s.count) || [], backgroundColor: '#0b3fa6', borderRadius: 6 }],
  };

  const levelChart = {
    labels: ['Junior', 'Intermédiaire', 'Senior'],
    datasets: [{
      data: [stats?.level_distribution?.junior || 0, stats?.level_distribution?.intermediaire || 0, stats?.level_distribution?.senior || 0],
      backgroundColor: ['#10b981', '#f59e0b', '#8b5cf6'],
    }],
  };

  const techChart = {
    labels: stats?.technologies_distribution?.map(t => t.name) || [],
    datasets: [{ label: 'Technologies', data: stats?.technologies_distribution?.map(t => t.count) || [], backgroundColor: '#6366f1', borderRadius: 6 }],
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Dashboard IA — Talent AI</h1>
        <p style={{ color: '#5f7faf' }}>Vue d'ensemble du recrutement intelligent</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard icon={Users} label="Candidats analysés" value={stats?.total_candidates || 0} color="#0b3fa6" />
        <StatCard icon={Briefcase} label="Offres d'emploi" value={stats?.total_offers || 0} color="#10b981" />
        <StatCard icon={ClipboardList} label="Tests réalisés" value={stats?.total_tests || 0} color="#f59e0b" />
        <StatCard icon={BarChart2} label="Score moyen" value={`${stats?.avg_score || 0}%`} color="#8b5cf6" />
        <StatCard icon={Star} label="Candidats recommandés" value={stats?.recommended_candidates || 0} color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px', fontWeight: '600' }}>Répartition des compétences</h2>
          {skillsChart.labels.length > 0 ? (
            <Bar data={skillsChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          ) : <p style={{ color: '#5f7faf', textAlign: 'center' }}>Aucune donnée</p>}
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px', fontWeight: '600' }}>Niveau des candidats</h2>
          <Doughnut data={levelChart} options={{ responsive: true }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px', fontWeight: '600' }}>Technologies les plus fréquentes</h2>
          {techChart.labels.length > 0 ? (
            <Bar data={techChart} options={{ responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }} />
          ) : <p style={{ color: '#5f7faf', textAlign: 'center' }}>Aucune donnée</p>}
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px', fontWeight: '600' }}>Insights IA</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(stats?.insights || []).map((insight, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px', background: '#f0f9ff', borderRadius: '8px', borderLeft: '3px solid #0b3fa6', fontSize: '0.95rem' }}>
                <Lightbulb size={16} style={{ color: '#0b3fa6', flexShrink: 0, marginTop: '2px' }} />
                {insight}
              </div>
            ))}
            {!stats?.insights?.length && <p style={{ color: '#5f7faf' }}>Aucun insight disponible</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

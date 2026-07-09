import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';

export default function CandidateAccessPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = code.trim();
    if (!clean) {
      toast.error('Merci de saisir un code');
      return;
    }
    setSubmitting(true);
    navigate(`/test/${encodeURIComponent(clean.toUpperCase())}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0842aa 0%,#0b3fa6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Poppins','Inter',sans-serif" }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '48px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <KeyRound size={48} color="#0b3fa6" style={{ margin: '0 auto 12px' }} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0b2d63' }}>Accéder à mon test technique</h1>
          <p style={{ color: '#5f7faf', marginTop: '8px', fontSize: '0.95rem' }}>
            Saisissez le code d'accès communiqué par l'équipe RH.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem', color: '#0b2d63' }}>
              Code d'accès *
            </label>
            <input
              type="text"
              placeholder="Ex: A1B2C3D4"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', border: '1px solid #dce9fb', borderRadius: '8px',
                fontSize: '1.1rem', letterSpacing: '2px', textAlign: 'center', textTransform: 'uppercase',
                fontWeight: '700', color: '#0b3fa6',
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{ width: '100%', padding: '14px', background: '#0b3fa6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}
          >
            {submitting ? 'Vérification...' : 'Continuer'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: '#5f7faf', textDecoration: 'none' }}>Retour à l'accueil</Link>
        </p>
      </div>
    </div>
  );
}

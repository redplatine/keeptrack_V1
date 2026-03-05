'use client'
import { useState } from 'react'

const DECORATIVE_CIRCLES = [
  { size: 320, top: -80,  left: -80,  opacity: 0.06 },
  { size: 200, top: 60,   left: 340,  opacity: 0.04 },
  { size: 150, top: 400,  left: -40,  opacity: 0.05 },
  { size: 100, top: 520,  left: 380,  opacity: 0.035 },
  { size: 80,  top: 200,  left: 500,  opacity: 0.04 },
  { size: 240, top: 480,  left: 260,  opacity: 0.03 },
]

export default function LoginPreview() {
  const [role, setRole] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F7F5F3', fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>

      {/* ÉLÉMENTS DÉCORATIFS FOND */}
      {DECORATIVE_CIRCLES.map((c, i) => (
        <div key={i} style={{
          position: 'fixed', width: c.size, height: c.size, borderRadius: '50%',
          border: `1.5px solid rgba(74,35,48,${c.opacity * 2})`,
          background: `rgba(74,35,48,${c.opacity})`,
          top: c.top, left: c.left, pointerEvents: 'none',
        }} />
      ))}

      {/* Petits losanges décoratifs */}
      {[
        { top: 80,  right: 120, size: 12 },
        { top: 220, right: 60,  size: 8  },
        { top: 480, right: 200, size: 10 },
        { top: 360, left: 80,   size: 8  },
        { top: 600, left: 300,  size: 14 },
      ].map((d, i) => (
        <div key={i} style={{
          position: 'fixed', width: d.size, height: d.size,
          background: 'rgba(74,35,48,0.12)',
          transform: 'rotate(45deg)',
          top: d.top, right: d.right, left: d.left,
          pointerEvents: 'none',
          borderRadius: '2px',
        }} />
      ))}

      {/* Lignes décoratives */}
      <div style={{ position: 'fixed', top: 0, right: 180, width: '1px', height: '35%', background: 'linear-gradient(to bottom, transparent, rgba(74,35,48,0.08), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 220, width: '1px', height: '30%', background: 'linear-gradient(to top, transparent, rgba(74,35,48,0.08), transparent)', pointerEvents: 'none' }} />

      {/* CARTE PRINCIPALE */}
      <div style={{
        background: 'white', borderRadius: '24px',
        width: '100%', maxWidth: '460px',
        border: '1px solid #E8E4E0',
        boxShadow: '0 8px 40px rgba(74,35,48,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>

        {/* Bande déco haut */}
        <div style={{ height: '4px', background: 'linear-gradient(to right, #4A2330, #8B4A5A, #C4849A)', borderRadius: '24px 24px 0 0' }} />

        <div style={{ padding: '36px 40px 40px' }}>

          {/* LOGO */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #4A2330, #6B2F42)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(74,35,48,0.3)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F9C7D0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="14" x2="16" y2="14"/>
                <line x1="8" y1="18" x2="12" y2="18"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1917', margin: '0 0 4px', letterSpacing: '-0.3px' }}>KeepTrack</h1>
            <p style={{ fontSize: '13px', color: '#A8A29E', margin: 0 }}>GTA Specialist App</p>
          </div>

          {/* ÉTAPE 1 — CHOIX DU RÔLE */}
          {!role && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#78716C', textAlign: 'center', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Choisissez votre espace
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                {/* TUILE ADMIN */}
                <button onClick={() => setRole('admin')} style={{
                  padding: '22px 16px', borderRadius: '16px', border: '1.5px solid #E8E4E0',
                  background: '#FAF8F6', cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'center', transition: 'all 0.18s', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: '10px',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4A2330'; e.currentTarget.style.background = '#F9EEF1'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(74,35,48,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E4E0'; e.currentTarget.style.background = '#FAF8F6'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #4A2330, #6B2F42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F9C7D0" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1C1917', margin: '0 0 3px' }}>Administrateur</p>
                    <p style={{ fontSize: '11px', color: '#A8A29E', margin: 0, lineHeight: 1.4 }}>Gestion RH & équipes</p>
                  </div>
                </button>

                {/* TUILE SALARIÉ */}
                <button onClick={() => setRole('salarie')} style={{
                  padding: '22px 16px', borderRadius: '16px', border: '1.5px solid #E8E4E0',
                  background: '#FAF8F6', cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'center', transition: 'all 0.18s', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: '10px',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4F7EF7'; e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,126,247,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E4E0'; e.currentTarget.style.background = '#FAF8F6'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B63D4, #4F7EF7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1C1917', margin: '0 0 3px' }}>Salarié</p>
                    <p style={{ fontSize: '11px', color: '#A8A29E', margin: 0, lineHeight: 1.4 }}>Mon espace personnel</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 — FORMULAIRE */}
          {role && (
            <div>
              {/* Breadcrumb retour */}
              <button onClick={() => setRole(null)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', color: '#A8A29E', fontFamily: 'inherit',
                marginBottom: '20px', padding: '4px 0', transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#4A2330'}
                onMouseLeave={e => e.currentTarget.style.color = '#A8A29E'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Changer d'espace
              </button>

              {/* Badge rôle sélectionné */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px', borderRadius: '20px', marginBottom: '20px',
                background: role === 'admin' ? '#F9EEF1' : '#EFF6FF',
                border: `1px solid ${role === 'admin' ? '#E8C8D0' : '#BFDBFE'}`,
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: role === 'admin' ? '#6B2F42' : '#4F7EF7' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: role === 'admin' ? '#6B2F42' : '#3B63D4' }}>
                  Espace {role === 'admin' ? 'Administrateur' : 'Salarié'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com"
                    style={{ width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mot de passe</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    style={{ width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <button style={{
                  width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                  background: role === 'admin' ? 'linear-gradient(135deg, #4A2330, #6B2F42)' : 'linear-gradient(135deg, #3B63D4, #4F7EF7)',
                  color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px',
                }}>
                  Se connecter
                </button>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#A8A29E' }}>Mot de passe oublié ?</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
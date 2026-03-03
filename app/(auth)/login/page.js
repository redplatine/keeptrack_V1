'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    const { data: emp } = await supabase.from('employes').select('role').eq('email', email).single()
    if (emp?.role === 'salarie') router.push('/profil')
    else router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F7F5F3', fontFamily: "'Inter', -apple-system, sans-serif", padding: '24px'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '40px',
        width: '100%', maxWidth: '420px',
        border: '1px solid #E8E4E0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
      }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px', margin: '0 auto 14px',
            background: '#4A2330',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(74,35,48,0.25)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F9C7D0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="8" y1="14" x2="16" y2="14"/>
              <line x1="8" y1="18" x2="12" y2="18"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1917', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            KeepTrack
          </h1>
          <p style={{ fontSize: '13px', color: '#A8A29E', margin: 0 }}>GTA Specialist App</p>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleLogin}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{
                fontSize: '12px', fontWeight: 600, color: '#A8A29E',
                display: 'block', marginBottom: '6px',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com" required
                style={{
                  width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px',
                  padding: '10px 14px', fontSize: '14px', background: '#FAF8F6',
                  outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#8B4A5A'}
                onBlur={e => e.target.style.borderColor = '#E8E4E0'}
              />
            </div>

            <div>
              <label style={{
                fontSize: '12px', fontWeight: 600, color: '#A8A29E',
                display: 'block', marginBottom: '6px',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                Mot de passe
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px',
                  padding: '10px 14px', fontSize: '14px', background: '#FAF8F6',
                  outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#8B4A5A'}
                onBlur={e => e.target.style.borderColor = '#E8E4E0'}
              />
            </div>

            {/* ERREUR */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: '10px', padding: '10px 14px',
                color: '#DC2626', fontSize: '13.5px'
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* BOUTON */}
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '11px',
                borderRadius: '10px', border: 'none',
                background: loading ? '#C4B5A5' : '#1C1917',
                color: 'white', fontSize: '14px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', marginTop: '4px',
                transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#44403C' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1C1917' }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  Connexion…
                </>
              ) : 'Se connecter'}
            </button>

            {/* MOT DE PASSE OUBLIÉ */}
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <Link href="/reset-password" style={{
                fontSize: '13px', color: '#A8A29E', textDecoration: 'none',
                transition: 'color 0.15s'
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#6B2F42'}
                onMouseLeave={e => e.currentTarget.style.color = '#A8A29E'}
              >
                Mot de passe oublié ?
              </Link>
            </div>

          </div>
        </form>

      </div>
    </div>
  )
}
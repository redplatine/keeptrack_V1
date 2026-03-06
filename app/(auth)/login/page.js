'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [role, setRole] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Email ou mot de passe incorrect')
        setLoading(false)
        return
      }

      const session = authData?.session
      const user = authData?.user

      if (!session || !user) {
        setError('Connexion impossible : session introuvable')
        setLoading(false)
        return
      }

      const { data: emp, error: empError } = await supabase
        .from('employes')
        .select('role, prenom, nom, user_id, email')
        .eq('user_id', user.id)
        .maybeSingle()

      if (empError) {
        console.error('Erreur récupération employé après login:', empError)
        await supabase.auth.signOut()
        setError("Impossible de charger votre profil employé")
        setLoading(false)
        return
      }

      if (!emp) {
        console.error('Aucune fiche employé trouvée après login', {
          authUserId: user.id,
          authEmail: user.email,
        })
        await supabase.auth.signOut()
        setError("Aucune fiche employé n'est liée à ce compte")
        setLoading(false)
        return
      }

      if (role === 'admin' && emp.role === 'salarie') {
        await supabase.auth.signOut()
        setError("Ce compte n'a pas accès à l'espace Administrateur")
        setLoading(false)
        return
      }

      if (role === 'salarie' && (emp.role === 'admin' || emp.role === 'manager')) {
        await supabase.auth.signOut()
        setError("Ce compte n'a pas accès à l'espace Salarié")
        setLoading(false)
        return
      }

      router.replace(emp.role === 'salarie' ? '/profil' : '/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Erreur login:', err)
      setError('Une erreur est survenue pendant la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F7F5F3', fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100vh', pointerEvents: 'none', zIndex: 0 }} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="bgFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A2330" stopOpacity="0.72" />
            <stop offset="22%" stopColor="#4A2330" stopOpacity="0.28" />
            <stop offset="45%" stopColor="#4A2330" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#4A2330" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="shapeR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A2330" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#4A2330" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="shapeL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6B2F42" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#6B2F42" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgFade)" />
        <circle cx="95%" cy="-20" r="320" fill="none" stroke="url(#shapeR)" strokeWidth="2.5" />
        <circle cx="95%" cy="-20" r="230" fill="none" stroke="url(#shapeR)" strokeWidth="2" />
        <circle cx="95%" cy="-20" r="150" fill="none" stroke="url(#shapeR)" strokeWidth="1.5" />
        <circle cx="95%" cy="-20" r="80" fill="none" stroke="url(#shapeR)" strokeWidth="1" />
        <circle cx="5%" cy="-15" r="280" fill="none" stroke="url(#shapeL)" strokeWidth="2.5" />
        <circle cx="5%" cy="-15" r="190" fill="none" stroke="url(#shapeL)" strokeWidth="2" />
        <circle cx="5%" cy="-15" r="110" fill="none" stroke="url(#shapeL)" strokeWidth="1.5" />
        <circle cx="5%" cy="-15" r="50" fill="none" stroke="url(#shapeL)" strokeWidth="1" />
      </svg>

      <div style={{
        background: 'white', borderRadius: '24px',
        width: '100%', maxWidth: '460px',
        border: '1px solid #E8E4E0',
        boxShadow: '0 8px 40px rgba(74,35,48,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>
        <div style={{ height: '4px', background: 'linear-gradient(to right, #4A2330, #8B4A5A, #C4849A)' }} />

        <div style={{ padding: '36px 40px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #4A2330, #6B2F42)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(74,35,48,0.3)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F9C7D0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="8" y1="14" x2="16" y2="14" />
                <line x1="8" y1="18" x2="12" y2="18" />
              </svg>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1917', margin: '0 0 4px', letterSpacing: '-0.3px' }}>KeepTrack</h1>
            <p style={{ fontSize: '13px', color: '#A8A29E', margin: 0 }}>GTA Specialist App</p>
          </div>

          {!role && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', textAlign: 'center', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Choisissez votre espace
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setRole('admin')}
                  style={{
                    padding: '22px 16px', borderRadius: '16px', border: '1.5px solid #E8E4E0',
                    background: '#FAF8F6', cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'center', transition: 'all 0.18s', display: 'flex',
                    flexDirection: 'column', alignItems: 'center', gap: '10px',
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #4A2330, #6B2F42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F9C7D0" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1C1917', margin: '0 0 3px' }}>Administrateur</p>
                    <p style={{ fontSize: '11px', color: '#A8A29E', margin: 0, lineHeight: 1.4 }}>Gestion RH & équipes</p>
                  </div>
                </button>

                <button
                  onClick={() => setRole('salarie')}
                  style={{
                    padding: '22px 16px', borderRadius: '16px', border: '1.5px solid #E8E4E0',
                    background: '#FAF8F6', cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'center', transition: 'all 0.18s', display: 'flex',
                    flexDirection: 'column', alignItems: 'center', gap: '10px',
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B63D4, #4F7EF7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
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

          {role && (
            <div>
              <button
                onClick={() => {
                  setRole(null)
                  setError(null)
                  setEmail('')
                  setPassword('')
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '12px', color: '#A8A29E', fontFamily: 'inherit',
                  marginBottom: '20px', padding: '4px 0',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Changer d'espace
              </button>

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

              <form onSubmit={handleLogin}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      style={{ width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', color: '#DC2626', fontSize: '13.5px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '10px',
                      border: 'none',
                      background: loading
                        ? '#C4B5A5'
                        : role === 'admin'
                          ? 'linear-gradient(135deg, #4A2330, #6B2F42)'
                          : 'linear-gradient(135deg, #3B63D4, #4F7EF7)',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {loading ? 'Connexion…' : 'Se connecter'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    <Link href="/reset-password" style={{ fontSize: '13px', color: '#A8A29E', textDecoration: 'none' }}>
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
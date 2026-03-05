'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [nomEntreprise, setNomEntreprise] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const generateSlug = (nom) =>
    nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setLoading(false)
      return
    }

    // 1. Créer le compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email'
        : authError.message)
      setLoading(false)
      return
    }

    // 2. Créer la ligne entreprise
    const slug = generateSlug(nomEntreprise)
    const { data: entreprise, error: entrepriseError } = await supabase
      .from('entreprises')
      .insert({ nom: nomEntreprise, slug, plan: 'free' })
      .select()
      .single()

    if (entrepriseError) {
      setError('Erreur lors de la création de l\'entreprise : ' + entrepriseError.message)
      setLoading(false)
      return
    }

    // 3. Créer l'employé admin rattaché à cette entreprise
    const { error: employeError } = await supabase
      .from('employes')
      .insert({
        email,
        role: 'admin',
        entreprise_id: entreprise.id,
        nom: '',
        prenom: '',
        matricule: 'ADMIN-001',
        statut: 'actif',
      })

    if (employeError) {
      setError('Erreur lors de la création du profil admin : ' + employeError.message)
      setLoading(false)
      return
    }

    // 4. Rediriger vers le dashboard
    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F7F5F3', fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>

      {/* FOND SVG — identique au login */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100vh', pointerEvents: 'none', zIndex: 0 }} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYTop slice">
        <defs>
          <linearGradient id="bgFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A2330" stopOpacity="0.72"/>
            <stop offset="22%" stopColor="#4A2330" stopOpacity="0.28"/>
            <stop offset="45%" stopColor="#4A2330" stopOpacity="0.07"/>
            <stop offset="100%" stopColor="#4A2330" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="shapeR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A2330" stopOpacity="0.85"/>
            <stop offset="100%" stopColor="#4A2330" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="shapeL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6B2F42" stopOpacity="0.75"/>
            <stop offset="100%" stopColor="#6B2F42" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgFade)"/>
        <circle cx="95%" cy="-20" r="320" fill="none" stroke="url(#shapeR)" strokeWidth="2.5"/>
        <circle cx="95%" cy="-20" r="230" fill="none" stroke="url(#shapeR)" strokeWidth="2"/>
        <circle cx="95%" cy="-20" r="150" fill="none" stroke="url(#shapeR)" strokeWidth="1.5"/>
        <circle cx="5%"  cy="-15" r="280" fill="none" stroke="url(#shapeL)" strokeWidth="2.5"/>
        <circle cx="5%"  cy="-15" r="190" fill="none" stroke="url(#shapeL)" strokeWidth="2"/>
        <circle cx="50%" cy="8"   r="160" fill="none" stroke="#8B4A5A" strokeWidth="1.5" opacity="0.5"/>
      </svg>

      {/* CARTE */}
      <div style={{
        background: 'white', borderRadius: '24px',
        width: '100%', maxWidth: '460px',
        border: '1px solid #E8E4E0',
        boxShadow: '0 8px 40px rgba(74,35,48,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>

        <div style={{ height: '4px', background: 'linear-gradient(to right, #4A2330, #8B4A5A, #C4849A)' }} />

        <div style={{ padding: '36px 40px 40px' }}>

          {/* LOGO */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1917', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Créer votre espace</h1>
            <p style={{ fontSize: '13px', color: '#A8A29E', margin: 0 }}>Inscription entreprise — KeepTrack</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Nom entreprise */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nom de l'entreprise
              </label>
              <input
                type="text" value={nomEntreprise} onChange={e => setNomEntreprise(e.target.value)}
                placeholder="Acme SAS" required
                style={{ width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#8B4A5A'}
                onBlur={e => e.target.style.borderColor = '#E8E4E0'}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email administrateur
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@entreprise.com" required
                style={{ width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#8B4A5A'}
                onBlur={e => e.target.style.borderColor = '#E8E4E0'}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mot de passe
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="8 caractères minimum" required
                style={{ width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#8B4A5A'}
                onBlur={e => e.target.style.borderColor = '#E8E4E0'}
              />
            </div>

            {/* Confirmation */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#8B4A5A'}
                onBlur={e => e.target.style.borderColor = '#E8E4E0'}
              />
            </div>

            {/* Erreur */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', color: '#DC2626', fontSize: '13.5px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Bouton */}
            <button
              onClick={handleRegister} disabled={loading}
              style={{
                width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                background: loading ? '#C4B5A5' : 'linear-gradient(135deg, #4A2330, #6B2F42)',
                color: 'white', fontSize: '14px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', marginTop: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1' }}>
              {loading ? (
                <>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                  Création en cours…
                </>
              ) : 'Créer mon espace entreprise'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#A8A29E', margin: '4px 0 0' }}>
              Déjà un compte ?{' '}
              <Link href="/login" style={{ color: '#6B2F42', fontWeight: 600, textDecoration: 'none' }}>
                Se connecter
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
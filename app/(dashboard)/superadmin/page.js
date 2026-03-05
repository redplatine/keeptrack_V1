// app/(dashboard)/superadmin/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const SUPER_ADMIN_EMAIL = 'alexandre.aubry.dumand@gmail.com'

const S = {
  input: { width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '9px 12px', fontSize: '13.5px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: '12px', fontWeight: 600, color: '#A8A29E', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
}

function generateSlug(nom) {
  return nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [entreprises, setEntreprises] = useState([])
  const [form, setForm] = useState({ nom: '', email: '', password: '', confirm: '' })
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      router.replace('/dashboard')
      return
    }
    setAuthorized(true)
    fetchEntreprises()
  }

  const fetchEntreprises = async () => {
    const { data } = await supabase
      .from('entreprises').select('*')
      .order('created_at', { ascending: false })
    setEntreprises(data || [])
    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (form.password.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return }
    setCreating(true)

    // 1. Créer le compte Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError) { setError('Erreur Auth : ' + authError.message); setCreating(false); return }

    // 2. Créer l'entreprise
    const slug = generateSlug(form.nom)
    const { data: entreprise, error: entError } = await supabase
      .from('entreprises').insert([{ nom: form.nom, slug }])
      .select().single()
    if (entError) { setError('Erreur entreprise : ' + entError.message); setCreating(false); return }

    // 3. Créer l'employé admin
    const { error: empError } = await supabase.from('employes').insert([{
      nom: form.email.split('@')[0],
      prenom: 'Admin',
      email: form.email,
      role: 'admin',
      entreprise_id: entreprise.id,
      date_entree: new Date().toISOString().split('T')[0],
      type_contrat: 'CDI',
      statut: 'Cadre',
      temps_travail: 'Temps plein',
    }])
    if (empError) { setError('Erreur employé : ' + empError.message); setCreating(false); return }

    setSuccess(`✅ Entreprise "${form.nom}" créée avec succès ! L'admin (${form.email}) peut maintenant se connecter.`)
    setForm({ nom: '', email: '', password: '', confirm: '' })
    fetchEntreprises()
    setCreating(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!authorized) return null

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* BADGE SUPER ADMIN */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1C1917', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, marginBottom: '24px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }} />
        Super Admin — KeepTrack
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* FORMULAIRE CRÉATION */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0EDE9' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: 0 }}>Créer une nouvelle entreprise</h2>
            <p style={{ fontSize: '12px', color: '#A8A29E', margin: '4px 0 0' }}>Crée l'entreprise + le compte admin en une seule action</p>
          </div>
          <div style={{ padding: '24px' }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#DC2626', fontSize: '13px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#16A34A', fontSize: '13px', fontWeight: 500 }}>
                {success}
              </div>
            )}
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={S.label}>Nom de l'entreprise *</label>
                  <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Acme SAS" style={S.input} />
                  {form.nom && <p style={{ fontSize: '11px', color: '#A8A29E', margin: '4px 0 0' }}>Slug : <code style={{ background: '#F0EDE9', padding: '1px 5px', borderRadius: 4 }}>{generateSlug(form.nom)}</code></p>}
                </div>
                <div>
                  <label style={S.label}>Email admin *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@entreprise.fr" style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Mot de passe *</label>
                  <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 caractères" style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Confirmer le mot de passe *</label>
                  <input required type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="Répéter le mot de passe" style={S.input} />
                </div>
                <button type="submit" disabled={creating} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '10px', border: 'none', background: creating ? '#E8E4E0' : '#1C1917', color: creating ? '#A8A29E' : 'white', fontSize: '13.5px', fontWeight: 500, cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: '4px' }}>
                  {creating ? (
                    <><div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />Création…</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Créer l'entreprise</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* LISTE ENTREPRISES */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: 0 }}>Entreprises enregistrées</h2>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#F0EDE9', color: '#78716C' }}>{entreprises.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {entreprises.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#A8A29E', fontSize: '13px' }}>Aucune entreprise pour l'instant</div>
            ) : entreprises.map((ent, i) => (
              <div key={ent.id} style={{ padding: '14px 24px', borderBottom: i < entreprises.length - 1 ? '1px solid #FAF8F6' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F2E6E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#6B2F42', flexShrink: 0 }}>
                  {ent.nom?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1C1917', margin: 0 }}>{ent.nom}</p>
                  <p style={{ fontSize: '11px', color: '#A8A29E', margin: '1px 0 0', fontFamily: 'monospace' }}>{ent.slug}</p>
                </div>
                <span style={{ fontSize: '11px', color: '#A8A29E' }}>{new Date(ent.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
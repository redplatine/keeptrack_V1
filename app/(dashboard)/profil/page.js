'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

function InfoField({ label, value, mono = false }) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #FAF8F6' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>
        {label}
      </p>
      <p style={{ fontSize: '14px', fontWeight: 500, color: value ? '#1C1917' : '#C4B5A5', margin: 0, fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value || '—'}
      </p>
    </div>
  )
}

function SoldeCard({ label, acquis, pris, solde, accent }) {
  const pct = acquis > 0 ? Math.min(100, Math.round((pris / acquis) * 100)) : 0
  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8E4E0', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent, flexShrink: 0 }} />
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#44403C', margin: 0 }}>{label}</p>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '16px' }}>
          <span style={{ fontSize: '36px', fontWeight: 700, color: '#1C1917', lineHeight: 1 }}>{solde ?? '—'}</span>
          <span style={{ fontSize: '14px', color: '#A8A29E', marginBottom: '4px' }}>j restants</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <div style={{ background: '#FAF8F6', borderRadius: '10px', padding: '10px 12px' }}>
            <p style={{ fontSize: '11px', color: '#A8A29E', margin: '0 0 2px' }}>Acquis</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#44403C', margin: 0 }}>{acquis ?? '—'} j</p>
          </div>
          <div style={{ background: '#FAF8F6', borderRadius: '10px', padding: '10px 12px' }}>
            <p style={{ fontSize: '11px', color: '#A8A29E', margin: '0 0 2px' }}>Pris</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#44403C', margin: 0 }}>{pris ?? '—'} j</p>
          </div>
        </div>
        <div style={{ height: '4px', background: '#F0EDE9', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: accent, borderRadius: '99px', width: `${pct}%`, transition: 'width 0.6s ease' }} />
        </div>
        <p style={{ fontSize: '11px', color: '#A8A29E', margin: '4px 0 0' }}>{pct}% utilisés</p>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ padding: '18px 24px', borderBottom: '1px solid #F0EDE9' }}>
      <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#44403C', margin: 0 }}>{children}</h2>
    </div>
  )
}

export default function ProfilPage() {
  const [employe, setEmploye] = useState(null)
  const [soldes, setSoldes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avatar, setAvatar] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { fetchProfil() }, [])

  const fetchProfil = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: emp } = await supabase.from('employes').select('*').eq('email', user.email).single()
    setEmploye(emp)
    if (emp) {
      const annee = new Date().getFullYear()
      const { data: soldesData } = await supabase.from('soldes_conges').select('*').eq('employe_id', emp.id).eq('annee', annee).single()
      setSoldes(soldesData)
      const { data } = supabase.storage.from('avatars').getPublicUrl(`${emp.id}/avatar`)
      setAvatar(`${data.publicUrl}?t=${Date.now()}`)
    }
    setLoading(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Veuillez sélectionner une image.'); return }
    if (file.size > 2 * 1024 * 1024) { alert('La photo ne doit pas dépasser 2 MB.'); return }
    setUploadLoading(true)
    const { error } = await supabase.storage.from('avatars').upload(`${employe.id}/avatar`, file, { upsert: true, contentType: file.type })
    if (error) { alert('Erreur upload : ' + error.message) } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(`${employe.id}/avatar`)
      setAvatar(`${data.publicUrl}?t=${Date.now()}`)
      setAvatarError(false)
    }
    setUploadLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!employe) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#A8A29E' }}>Profil introuvable. Contactez votre administrateur.</div>
  )

  const initiales = `${employe.prenom?.[0] || ''}${employe.nom?.[0] || ''}`.toUpperCase()
  const adresse = [employe.numero_voie, employe.nom_rue, employe.code_postal, employe.ville].filter(Boolean).join(' ') || null
  const salaire = employe.salaire_brut ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(employe.salaire_brut) : null

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* CARTE IDENTITÉ RAPIDE */}
      <div style={{
        background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '20px',
        padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '24px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '88px', height: '88px', borderRadius: '20px',
              background: avatarError || !avatar ? '#F2E6E9' : 'transparent',
              border: '2px dashed #E8E4E0', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#8B4A5A'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E4E0'}>
            {uploadLoading ? (
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
            ) : avatar && !avatarError ? (
              <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarError(true)} />
            ) : (
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#6B2F42' }}>{initiales}</span>
            )}
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(74,35,48,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.15s', borderRadius: '18px'
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#A8A29E', margin: 0 }}>
            {uploadLoading ? 'Upload…' : 'Changer la photo'}
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1C1917', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            {employe.prenom} {employe.nom}
          </h2>
          <p style={{ fontSize: '14px', color: '#78716C', margin: '0 0 2px' }}>{employe.poste || '—'}</p>
          <p style={{ fontSize: '13px', color: '#A8A29E', margin: '0 0 12px' }}>{employe.email}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px',
              background: employe.statut === 'Cadre' ? '#F9EEF1' : '#F0EDE9',
              color: employe.statut === 'Cadre' ? '#6B2F42' : '#78716C',
            }}>{employe.statut}</span>
            {employe.type_contrat && (
              <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: '#F9EEF1', color: '#6B2F42' }}>
                {employe.type_contrat}
              </span>
            )}
            {employe.matricule && (
              <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: '#FAF8F6', color: '#A8A29E', fontFamily: 'monospace' }}>
                {employe.matricule}
              </span>
            )}
            {employe.forfait_jours && (
              <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB' }}>
                Forfait jours
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* BLOC IDENTITÉ */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <SectionTitle>Identité</SectionTitle>
          <InfoField label="Nom complet" value={`${employe.prenom} ${employe.nom}`} />
          <InfoField label="Email" value={employe.email} />
          <InfoField label="Date de naissance" value={employe.date_naissance} />
          <InfoField label="Lieu de naissance" value={employe.lieu_naissance} />
          <InfoField label="CP de naissance" value={employe.cp_naissance} />
          <InfoField label="N° Sécurité sociale" value={employe.numero_secu} mono />
          <InfoField label="Adresse" value={adresse} />
        </div>

        {/* BLOC CONTRAT */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <SectionTitle>Contrat</SectionTitle>
          <InfoField label="Poste" value={employe.poste} />
          <InfoField label="Département" value={employe.departement} />
          <InfoField label="Date d'entrée" value={employe.date_entree} />
          <InfoField label="Temps de travail" value={employe.temps_travail} />
          <InfoField label="Forfait jours" value={employe.forfait_jours ? 'Oui' : 'Non'} />
          {employe.forfait_jours
            ? <InfoField label="Jours annuels" value={employe.nb_jours_annuels ? `${employe.nb_jours_annuels} jours` : null} />
            : <InfoField label="Heures par semaine" value={employe.nb_heures_semaine ? `${employe.nb_heures_semaine}h / semaine` : null} />
          }
          <InfoField label="RTT annuel" value={employe.rtt_annuel ? `${employe.rtt_annuel} jours` : null} />
          <InfoField label="Salaire brut annuel" value={salaire} />
        </div>
      </div>

      {/* BLOC SOLDES */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <SectionTitle>Soldes de congés — {new Date().getFullYear()}</SectionTitle>
        <div style={{ padding: '20px 24px' }}>
          {!soldes ? (
            <p style={{ color: '#A8A29E', fontSize: '14px', margin: 0 }}>Aucun solde disponible pour cette année.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <SoldeCard label="Congés Payés N-1" acquis={soldes.cp_n1_acquis} pris={soldes.cp_n1_pris} solde={soldes.cp_n1_solde} accent="#8B4A5A" />
              <SoldeCard label="Congés Payés N"   acquis={soldes.cp_n_acquis}  pris={soldes.cp_n_pris}  solde={soldes.cp_n_solde}  accent="#4F7EF7" />
              <SoldeCard label="RTT"               acquis={soldes.rtt_acquis}   pris={soldes.rtt_pris}   solde={soldes.rtt_solde}   accent="#16A34A" />
              <SoldeCard label="Récupération"      acquis={soldes.recup_acquis} pris={soldes.recup_pris} solde={soldes.recup_solde} accent="#B45309" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
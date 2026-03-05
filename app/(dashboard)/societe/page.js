'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useEntreprise } from '../../../lib/EntrepriseContext'

const S = {
  input: { width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '9px 12px', fontSize: '13.5px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: '12px', fontWeight: 600, color: '#A8A29E', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
}

function InfoField({ label, value, mono = false }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #FAF8F6' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: '14px', fontWeight: 500, color: value ? '#1C1917' : '#C4B5A5', margin: 0, fontFamily: mono ? 'monospace' : 'inherit' }}>{value || '—'}</p>
    </div>
  )
}

export default function SocietePage() {
  const [societe, setSociete] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [success, setSuccess] = useState(false)
  const { entrepriseId } = useEntreprise()
  const [form, setForm] = useState({
    raison_sociale: '', numero_voie: '', nom_rue: '',
    code_postal: '', ville: '', siret: '', code_naf: '',
    nom_signataire: '', qualite_signataire: '',
  })

  useEffect(() => { if (entrepriseId) fetchData() }, [entrepriseId])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: emp } = await supabase
      .from('employes').select('role')
      .eq('email', user.email)
      .eq('entreprise_id', entrepriseId)
      .single()
    setRole(emp?.role)

    const { data: soc } = await supabase
      .from('societe').select('*')
      .eq('entreprise_id', entrepriseId)
      .single()
    setSociete(soc)

    if (soc) setForm({
      raison_sociale:     soc.raison_sociale     || '',
      numero_voie:        soc.numero_voie        || '',
      nom_rue:            soc.nom_rue            || '',
      code_postal:        soc.code_postal        || '',
      ville:              soc.ville              || '',
      siret:              soc.siret              || '',
      code_naf:           soc.code_naf           || '',
      nom_signataire:     soc.nom_signataire     || '',
      qualite_signataire: soc.qualite_signataire || '',
    })
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (societe) {
      await supabase.from('societe').update(form).eq('id', societe.id)
    } else {
      await supabase.from('societe').insert([{ ...form, entreprise_id: entrepriseId }])
    }
    setSociete({ ...societe, ...form })
    setEditing(false); setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const adresse = [societe?.numero_voie, societe?.nom_rue, societe?.code_postal, societe?.ville].filter(Boolean).join(' ') || null

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
        {role === 'admin' && !editing && (
          <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', border: '1px solid #E8E4E0', background: 'white', color: '#44403C', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Modifier
          </button>
        )}
      </div>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', color: '#16A34A', fontSize: '13.5px', fontWeight: 500 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Informations enregistrées avec succès
        </div>
      )}

      {!editing && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', gridColumn: '1 / -1' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0, background: '#F0EDE9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1C1917', margin: 0 }}>{societe?.raison_sociale || 'Raison sociale non renseignée'}</h2>
                <p style={{ fontSize: '13px', color: '#A8A29E', margin: '2px 0 0' }}>{adresse || 'Adresse non renseignée'}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <InfoField label="Raison sociale"   value={societe?.raison_sociale} />
              <InfoField label="Adresse complète" value={adresse} />
              <InfoField label="SIRET"            value={societe?.siret} mono />
              <InfoField label="Code NAF"         value={societe?.code_naf} mono />
              <InfoField label="Signataire"       value={societe?.nom_signataire} />
              <InfoField label="Qualité"          value={societe?.qualite_signataire} />
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px 32px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', maxWidth: '680px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: '0 0 24px' }}>Modifier les informations</h2>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#C4B5A5', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '10px', borderBottom: '1px solid #F0EDE9' }}>Informations légales</div>
              <div>
                <label style={S.label}>Raison sociale</label>
                <input value={form.raison_sociale} onChange={e => setForm({ ...form, raison_sociale: e.target.value })} placeholder="Ex: KeepTrack SAS" style={S.input} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={S.label}>SIRET</label><input value={form.siret} onChange={e => setForm({ ...form, siret: e.target.value })} placeholder="Ex: 123 456 789 00010" style={{ ...S.input, fontFamily: 'monospace' }} /></div>
                <div><label style={S.label}>Code NAF</label><input value={form.code_naf} onChange={e => setForm({ ...form, code_naf: e.target.value })} placeholder="Ex: 6201Z" style={{ ...S.input, fontFamily: 'monospace' }} /></div>
              </div>

              <div style={{ fontSize: '11px', fontWeight: 700, color: '#C4B5A5', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '10px', borderBottom: '1px solid #F0EDE9', marginTop: '8px' }}>Signataire des documents</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={S.label}>Nom du signataire</label><input value={form.nom_signataire} onChange={e => setForm({ ...form, nom_signataire: e.target.value })} placeholder="Ex: Jean Dupont" style={S.input} /></div>
                <div><label style={S.label}>Qualité / Titre</label><input value={form.qualite_signataire} onChange={e => setForm({ ...form, qualite_signataire: e.target.value })} placeholder="Ex: Directeur Général" style={S.input} /></div>
              </div>

              <div style={{ fontSize: '11px', fontWeight: 700, color: '#C4B5A5', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '10px', borderBottom: '1px solid #F0EDE9', marginTop: '8px' }}>Adresse</div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                <div><label style={S.label}>N° voie</label><input value={form.numero_voie} onChange={e => setForm({ ...form, numero_voie: e.target.value })} placeholder="12" style={S.input} /></div>
                <div><label style={S.label}>Nom de rue</label><input value={form.nom_rue} onChange={e => setForm({ ...form, nom_rue: e.target.value })} placeholder="Rue de la Paix" style={S.input} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
                <div><label style={S.label}>Code postal</label><input value={form.code_postal} onChange={e => setForm({ ...form, code_postal: e.target.value })} placeholder="75001" style={S.input} /></div>
                <div><label style={S.label}>Ville</label><input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} placeholder="Paris" style={S.input} /></div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid #F0EDE9' }}>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#1C1917', color: 'white', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#44403C'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1C1917'}>Enregistrer</button>
                <button type="button" onClick={() => setEditing(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #E8E4E0', background: 'white', color: '#78716C', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
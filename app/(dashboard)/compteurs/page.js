'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useEntreprise } from '../../lib/EntrepriseContext'
import * as XLSX from 'xlsx'

function getAvatarUrl(id) {
  const { data } = supabase.storage.from('avatars').getPublicUrl(`${id}/avatar`)
  return data.publicUrl
}

function Avatar({ id, prenom, nom, size = 32 }) {
  const [error, setError] = useState(false)
  const url = getAvatarUrl(id)
  const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0, background: 'linear-gradient(135deg, #F2E6E9, #E8D5D9)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!error
        ? <img src={`${url}?t=${id}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setError(true)} />
        : <span style={{ fontSize: size * 0.33, fontWeight: 700, color: '#6B2F42' }}>{initiales}</span>
      }
    </div>
  )
}

function EditCell({ value, onSave, color, bg, small = false }) {
  const [editing, setEditing] = useState(false)
  const [delta, setDelta] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const d = parseFloat(delta)
    if (isNaN(d) || d === 0) { setEditing(false); setDelta(''); return }
    setLoading(true)
    await onSave(d)
    setEditing(false); setDelta(''); setLoading(false)
  }

  if (editing) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <input autoFocus type="number" step="0.5" value={delta}
        onChange={e => setDelta(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setDelta('') } }}
        placeholder="±"
        style={{ width: 52, padding: '3px 5px', borderRadius: 6, border: `1.5px solid ${color}`, outline: 'none', fontSize: 12, fontWeight: 600, color, background: bg, fontFamily: 'inherit', textAlign: 'center' }}
      />
      <button onClick={handleSave} disabled={loading} style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? '…' : '✓'}
      </button>
      <button onClick={() => { setEditing(false); setDelta('') }} style={{ width: 20, height: 20, borderRadius: 5, border: '1px solid #E8E4E0', background: 'white', cursor: 'pointer', fontSize: 10, color: '#A8A29E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
    </div>
  )

  return (
    <div onClick={() => setEditing(true)} title="Cliquer pour ajuster"
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: small ? 34 : 42, height: 26, borderRadius: 7, fontSize: small ? 12 : 13, fontWeight: 700, background: bg, color, padding: '0 8px', cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.15s, opacity 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${color}`; e.currentTarget.style.opacity = '0.8' }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.opacity = '1' }}>
      {value ?? '—'}
    </div>
  )
}

function SoldeDisplay({ value, color, bg }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 42, height: 26, borderRadius: 7, fontSize: 13, fontWeight: 800, background: bg, color, padding: '0 8px', border: `1px solid ${color}22` }}>
      {value ?? '—'}
    </span>
  )
}

function LigneCompteur({ emp, solde, onDelta }) {
  const GROUPES = [
    { key: 'cp_n1', label: 'CP N-1', color: '#8B4A5A', bg: '#F9EEF1' },
    { key: 'cp_n',  label: 'CP N',   color: '#4F7EF7', bg: '#EFF6FF' },
    { key: 'rtt',   label: 'RTT',    color: '#16A34A', bg: '#F0FDF4' },
  ]
  const s = solde || {}

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 90px', gap: 8, alignItems: 'center', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,35,48,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar id={emp.id} prenom={emp.prenom} nom={emp.nom} size={34} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1917', margin: 0 }}>{emp.prenom} {emp.nom}</p>
          <p style={{ fontSize: 11, color: '#A8A29E', margin: 0 }}>{emp.poste || '—'} · <span style={{ fontFamily: 'monospace', fontSize: 10, background: '#F0EDE9', color: '#78716C', padding: '1px 5px', borderRadius: 4 }}>{emp.matricule || '—'}</span></p>
        </div>
      </div>
      {GROUPES.map(g => (
        <div key={g.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Acquis</span>
              <EditCell value={s[`${g.key}_acquis`] ?? null} color={g.color} bg={g.bg} onSave={d => onDelta(emp.id, `${g.key}_acquis`, d)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pris</span>
              <EditCell value={s[`${g.key}_pris`] ?? null} color={g.color} bg={g.bg} onSave={d => onDelta(emp.id, `${g.key}_pris`, d)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: g.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Solde</span>
              <SoldeDisplay value={s[`${g.key}_solde`] ?? null} color={g.color} bg={g.bg} />
            </div>
          </div>
          {(s[`${g.key}_acquis`] || 0) > 0 && (
            <div style={{ width: '100%', height: 3, background: `${g.color}18`, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: g.color, borderRadius: 99, width: `${Math.min(100, ((s[`${g.key}_pris`] || 0) / s[`${g.key}_acquis`]) * 100)}%` }} />
            </div>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.7 }}>Récup</span>
        <EditCell value={s.recup_solde ?? null} color="#B45309" bg="#FFFBEB" onSave={d => onDelta(emp.id, 'recup_solde', d)} />
      </div>
    </div>
  )
}

export default function CompteursPage() {
  const [employes, setEmployes] = useState([])
  const [soldes, setSoldes] = useState({})
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const { entrepriseId } = useEntreprise()
  const annee = new Date().getFullYear()

  useEffect(() => { if (entrepriseId) fetchAll() }, [entrepriseId])

  const fetchAll = async () => {
    setLoading(true)

    const { data: emps } = await supabase
      .from('employes').select('id, nom, prenom, poste, matricule')
      .eq('entreprise_id', entrepriseId)
      .order('nom')

    const { data: sols } = await supabase
      .from('soldes_conges').select('*')
      .eq('entreprise_id', entrepriseId)
      .eq('annee', annee)

    const { data: dems } = await supabase
      .from('demandes_recup').select('*, employes(nom, prenom)')
      .eq('entreprise_id', entrepriseId)
      .eq('statut', 'En attente')
      .order('created_at', { ascending: false })

    const soldesMap = {}
    for (const s of sols || []) soldesMap[s.employe_id] = s
    setSoldes(soldesMap)
    setEmployes(emps || [])
    setDemandes(dems || [])
    setLoading(false)
  }

  const handleDelta = async (employeId, field, delta) => {
    const solde = soldes[employeId]
    const current = solde?.[field] || 0
    const newVal = Math.max(0, current + delta)

    const prefixes = ['cp_n1', 'cp_n', 'rtt']
    const matchedPrefix = prefixes.find(p => field.startsWith(p))
    const isAcquisOrPris = matchedPrefix && (field.endsWith('_acquis') || field.endsWith('_pris'))

    let updates = { [field]: newVal }
    if (isAcquisOrPris && solde) {
      const acquis = field.endsWith('_acquis') ? newVal : (solde[`${matchedPrefix}_acquis`] || 0)
      const pris   = field.endsWith('_pris')   ? newVal : (solde[`${matchedPrefix}_pris`]   || 0)
      updates[`${matchedPrefix}_solde`] = Math.max(0, acquis - pris)
    }

    if (solde) {
      await supabase.from('soldes_conges').update(updates).eq('id', solde.id)
    } else {
      await supabase.from('soldes_conges').insert({
        employe_id: employeId, entreprise_id: entrepriseId, annee, ...updates
      })
    }
    await fetchAll()
  }

  const handleValiderDemande = async (demande) => {
    const solde = soldes[demande.employe_id]
    if (solde) {
      await supabase.from('soldes_conges').update({
        recup_acquis: (solde.recup_acquis || 0) + demande.nb_jours,
        recup_solde:  (solde.recup_solde  || 0) + demande.nb_jours,
      }).eq('id', solde.id)
    } else {
      await supabase.from('soldes_conges').insert({
        employe_id: demande.employe_id, entreprise_id: entrepriseId,
        annee, recup_acquis: demande.nb_jours, recup_solde: demande.nb_jours
      })
    }
    await supabase.from('demandes_recup').update({ statut: 'Validée' }).eq('id', demande.id)
    await fetchAll()
  }

  const handleRefuserDemande = async (id) => {
    await supabase.from('demandes_recup').update({ statut: 'Refusée' }).eq('id', id)
    await fetchAll()
  }

  const handleExportExcel = () => {
    const data = employes.map(emp => {
      const s = soldes[emp.id] || {}
      return {
        'Matricule': emp.matricule || '—', 'Nom': emp.nom || '', 'Prénom': emp.prenom || '', 'Poste': emp.poste || '',
        'CP N-1 Acquis': s.cp_n1_acquis ?? 0, 'CP N-1 Pris': s.cp_n1_pris ?? 0, 'CP N-1 Solde': s.cp_n1_solde ?? 0,
        'CP N Acquis': s.cp_n_acquis ?? 0, 'CP N Pris': s.cp_n_pris ?? 0, 'CP N Solde': s.cp_n_solde ?? 0,
        'RTT Acquis': s.rtt_acquis ?? 0, 'RTT Pris': s.rtt_pris ?? 0, 'RTT Solde': s.rtt_solde ?? 0,
        'Récup Acquis': s.recup_acquis ?? 0, 'Récup Pris': s.recup_pris ?? 0, 'Récup Solde': s.recup_solde ?? 0,
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{wch:12},{wch:18},{wch:18},{wch:20},{wch:14},{wch:12},{wch:13},{wch:14},{wch:12},{wch:13},{wch:14},{wch:12},{wch:13},{wch:14},{wch:12},{wch:13}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Compteurs ${annee}`)
    XLSX.writeFile(wb, `compteurs_${annee}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {demandes.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #FDE68A', boxShadow: '0 2px 8px rgba(245,158,11,0.08)', marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1C1917', margin: 0 }}>Demandes de récupération en attente</h2>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>{demandes.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {demandes.map((d, i) => (
              <div key={d.id} style={{ padding: '13px 22px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: i < demandes.length - 1 ? '1px solid #FAF8F6' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1917', margin: '0 0 2px' }}>{d.employes?.prenom} {d.employes?.nom}</p>
                  <p style={{ fontSize: 12, color: '#A8A29E', margin: 0 }}>{d.nb_jours} jour(s) · {d.motif || 'Aucun motif'} · {new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleValiderDemande(d)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}>✓ Valider</button>
                  <button onClick={() => handleRefuserDemande(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>✕ Refuser</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#78716C', margin: 0 }}>{employes.length} salarié(s) · {annee}</p>
        <button onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: '1px solid #E8E4E0', background: 'white', color: '#44403C', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exporter Excel
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 90px', gap: 8, padding: '10px 16px', marginBottom: 6, background: 'white', borderRadius: 10, border: '1px solid #E8E4E0' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Salarié</span>
        {[['CP N-1', '#8B4A5A'], ['CP N', '#4F7EF7'], ['RTT', '#16A34A']].map(([l, c]) => (
          <span key={l} style={{ fontSize: 11, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>{l}</span>
        ))}
        <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>Récup</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {employes.map(emp => (
          <LigneCompteur key={emp.id} emp={emp} solde={soldes[emp.id]} onDelta={handleDelta} />
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '13px 18px', background: 'rgba(255,255,255,0.7)', borderRadius: 12, border: '1px solid #E8E4E0' }}>
        <p style={{ fontSize: 12, color: '#78716C', margin: 0 }}>
          💡 <strong>Acq</strong> et <strong>Pris</strong> sont éditables — le <strong>Solde</strong> se calcule automatiquement (Acquis − Pris). Entrez un nombre positif pour ajouter, négatif pour retirer. <kbd style={{ background: '#F0EDE9', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>Entrée</kbd> pour confirmer, <kbd style={{ background: '#F0EDE9', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>Échap</kbd> pour annuler.
        </p>
      </div>
    </div>
  )
}
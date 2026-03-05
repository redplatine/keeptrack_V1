'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
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
    <div style={{ width: size, height: size, borderRadius: '8px', flexShrink: 0, background: '#F2E6E9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!error ? (
        <img src={`${url}?t=${id}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setError(true)} />
      ) : (
        <span style={{ fontSize: size * 0.33, fontWeight: 700, color: '#6B2F42' }}>{initiales}</span>
      )}
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
      <input autoFocus type="number" step="0.5" value={delta}
        onChange={e => setDelta(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setDelta('') } }}
        placeholder="±"
        style={{ width: '54px', padding: '3px 5px', borderRadius: '6px', border: `1.5px solid ${color}`, outline: 'none', fontSize: '12px', fontWeight: 600, color, background: bg, fontFamily: 'inherit', textAlign: 'center' }}
      />
      <button onClick={handleSave} disabled={loading} style={{ width: '20px', height: '20px', borderRadius: '5px', border: 'none', background: color, color: 'white', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? '…' : '✓'}
      </button>
      <button onClick={() => { setEditing(false); setDelta('') }} style={{ width: '20px', height: '20px', borderRadius: '5px', border: '1px solid #E8E4E0', background: 'white', cursor: 'pointer', fontSize: '10px', color: '#A8A29E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
    </div>
  )

  return (
    <div onClick={() => setEditing(true)} title="Cliquer pour ajuster"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: small ? '36px' : '44px', height: '26px', borderRadius: '7px',
        fontSize: small ? '12px' : '13px', fontWeight: 700,
        background: bg, color, padding: '0 8px', cursor: 'pointer',
        border: '1px solid transparent', transition: 'border 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${color}`; e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.opacity = '1' }}>
      {value ?? '—'}
    </div>
  )
}

function SoldeDisplay({ value, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: '44px', height: '26px', borderRadius: '7px',
      fontSize: '13px', fontWeight: 700, background: bg, color, padding: '0 8px',
      border: `1px solid ${color}22`,
    }}>
      {value ?? '—'}
    </span>
  )
}

export default function CompteursPage() {
  const [employes, setEmployes] = useState([])
  const [soldes, setSoldes] = useState({})
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const annee = new Date().getFullYear()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data: emps } = await supabase.from('employes').select('id, nom, prenom, poste, matricule').order('nom')
    const { data: sols } = await supabase.from('soldes_conges').select('*').eq('annee', annee)
    const { data: dems } = await supabase.from('demandes_recup').select('*, employes(nom, prenom)').eq('statut', 'En attente').order('created_at', { ascending: false })
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
      await supabase.from('soldes_conges').insert({ employe_id: employeId, annee, ...updates })
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
        employe_id: demande.employe_id, annee,
        recup_acquis: demande.nb_jours, recup_solde: demande.nb_jours,
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
        'Matricule':        emp.matricule || '—',
        'Nom':              emp.nom || '',
        'Prénom':           emp.prenom || '',
        'Poste':            emp.poste || '',
        // CP N-1
        'CP N-1 Acquis':    s.cp_n1_acquis ?? 0,
        'CP N-1 Pris':      s.cp_n1_pris   ?? 0,
        'CP N-1 Solde':     s.cp_n1_solde  ?? 0,
        // CP N
        'CP N Acquis':      s.cp_n_acquis  ?? 0,
        'CP N Pris':        s.cp_n_pris    ?? 0,
        'CP N Solde':       s.cp_n_solde   ?? 0,
        // RTT
        'RTT Acquis':       s.rtt_acquis   ?? 0,
        'RTT Pris':         s.rtt_pris     ?? 0,
        'RTT Solde':        s.rtt_solde    ?? 0,
        // Récup
        'Récup Acquis':     s.recup_acquis ?? 0,
        'Récup Pris':       s.recup_pris   ?? 0,
        'Récup Solde':      s.recup_solde  ?? 0,
      }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 20 },
      { wch: 14 }, { wch: 12 }, { wch: 13 },
      { wch: 14 }, { wch: 12 }, { wch: 13 },
      { wch: 14 }, { wch: 12 }, { wch: 13 },
      { wch: 14 }, { wch: 12 }, { wch: 13 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Compteurs ${annee}`)
    XLSX.writeFile(wb, `compteurs_${annee}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const GROUPES = [
    { key: 'cp_n1', label: 'CP N-1', color: '#8B4A5A', bg: '#F9EEF1', headerBg: '#F5ECF0', borderColor: '#F5ECF0' },
    { key: 'cp_n',  label: 'CP N',   color: '#4F7EF7', bg: '#EFF6FF', headerBg: '#EAF2FF', borderColor: '#EAF2FF' },
    { key: 'rtt',   label: 'RTT',    color: '#16A34A', bg: '#F0FDF4', headerBg: '#E8FAF0', borderColor: '#E8FAF0' },
  ]

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* DEMANDES RÉCUP EN ATTENTE */}
      {demandes.length > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #FDE68A', boxShadow: '0 2px 8px rgba(245,158,11,0.08)', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1C1917', margin: 0 }}>Demandes de récupération en attente</h2>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>{demandes.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {demandes.map((d, i) => (
              <div key={d.id} style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: i < demandes.length - 1 ? '1px solid #FAF8F6' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1C1917', margin: '0 0 2px' }}>{d.employes?.prenom} {d.employes?.nom}</p>
                  <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>
                    {d.nb_jours} jour(s) · {d.motif || 'Aucun motif'} · {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleValiderDemande(d)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Valider</button>
                  <button onClick={() => handleRefuserDemande(d.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Refuser</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEADER TABLEAU */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div />
        <button onClick={handleExportExcel} style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '9px 16px', borderRadius: '10px', border: '1px solid #E8E4E0',
          background: 'white', color: '#44403C', fontSize: '13.5px', fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exporter Excel
        </button>
      </div>

      {/* TABLEAU COMPTEURS */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: 0 }}>Compteurs — {annee}</h2>
            <p style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px' }}>
              Cliquez sur Acq ou Pris pour ajuster — le Solde se calcule automatiquement
            </p>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} title="Données à jour" />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAF8F6' }}>
              <th rowSpan={2} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0EDE9', verticalAlign: 'middle' }}>
                Salarié
              </th>
              {GROUPES.map(g => (
                <th key={g.key} colSpan={3} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: g.color, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0EDE9', borderLeft: `1px solid ${g.borderColor}`, background: g.headerBg }}>
                  {g.label}
                </th>
              ))}
              <th rowSpan={2} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0EDE9', borderLeft: '1px solid #F0EDE9', verticalAlign: 'middle' }}>
                Récup
              </th>
            </tr>
            <tr style={{ background: '#FAF8F6' }}>
              {GROUPES.map(g => (
                ['Acq', 'Pris', 'Solde'].map((sub, si) => (
                  <th key={`${g.key}-${sub}`} style={{
                    padding: '6px 8px', textAlign: 'center',
                    fontSize: '10px', fontWeight: 600,
                    color: sub === 'Solde' ? g.color : '#C4B5A5',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    borderBottom: '1px solid #F0EDE9',
                    borderLeft: si === 0 ? `1px solid ${g.borderColor}` : 'none',
                    background: g.headerBg,
                  }}>
                    {sub}
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            {employes.map(emp => {
              const s = soldes[emp.id] || {}
              return (
                <tr key={emp.id}
                  style={{ borderBottom: '1px solid #FAF8F6', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar id={emp.id} prenom={emp.prenom} nom={emp.nom} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917' }}>{emp.prenom} {emp.nom}</div>
                        <div style={{ fontSize: '12px', color: '#A8A29E' }}>{emp.poste || '—'}</div>
                      </div>
                    </div>
                  </td>

                  {/* CP N-1 */}
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderLeft: '1px solid #F5ECF0' }}>
                    <EditCell value={s.cp_n1_acquis ?? null} color="#8B4A5A" bg="#F9EEF1" small onSave={(d) => handleDelta(emp.id, 'cp_n1_acquis', d)} />
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <EditCell value={s.cp_n1_pris ?? null} color="#8B4A5A" bg="#F9EEF1" small onSave={(d) => handleDelta(emp.id, 'cp_n1_pris', d)} />
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <SoldeDisplay value={s.cp_n1_solde ?? null} color="#8B4A5A" bg="#F9EEF1" />
                  </td>

                  {/* CP N */}
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderLeft: '1px solid #EAF2FF' }}>
                    <EditCell value={s.cp_n_acquis ?? null} color="#4F7EF7" bg="#EFF6FF" small onSave={(d) => handleDelta(emp.id, 'cp_n_acquis', d)} />
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <EditCell value={s.cp_n_pris ?? null} color="#4F7EF7" bg="#EFF6FF" small onSave={(d) => handleDelta(emp.id, 'cp_n_pris', d)} />
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <SoldeDisplay value={s.cp_n_solde ?? null} color="#4F7EF7" bg="#EFF6FF" />
                  </td>

                  {/* RTT */}
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderLeft: '1px solid #E8FAF0' }}>
                    <EditCell value={s.rtt_acquis ?? null} color="#16A34A" bg="#F0FDF4" small onSave={(d) => handleDelta(emp.id, 'rtt_acquis', d)} />
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <EditCell value={s.rtt_pris ?? null} color="#16A34A" bg="#F0FDF4" small onSave={(d) => handleDelta(emp.id, 'rtt_pris', d)} />
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <SoldeDisplay value={s.rtt_solde ?? null} color="#16A34A" bg="#F0FDF4" />
                  </td>

                  {/* Récup — solde uniquement éditable */}
                  <td style={{ padding: '10px 16px', textAlign: 'center', borderLeft: '1px solid #F0EDE9' }}>
                    <EditCell value={s.recup_solde ?? null} color="#B45309" bg="#FFFBEB"
                      onSave={(d) => handleDelta(emp.id, 'recup_solde', d)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* LÉGENDE */}
      <div style={{ marginTop: '16px', padding: '14px 20px', background: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '1px solid #E8E4E0' }}>
        <p style={{ fontSize: '12px', color: '#78716C', margin: 0 }}>
          💡 <strong>Acq</strong> et <strong>Pris</strong> sont éditables — le <strong>Solde</strong> se calcule automatiquement (Acquis − Pris). Entrez un nombre positif pour ajouter, négatif pour retirer. <kbd style={{ background: '#F0EDE9', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>Entrée</kbd> pour confirmer, <kbd style={{ background: '#F0EDE9', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>Échap</kbd> pour annuler.
        </p>
      </div>
    </div>
  )
}
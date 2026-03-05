'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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
        style={{
          width: '54px', padding: '3px 5px', borderRadius: '6px',
          border: `1.5px solid ${color}`, outline: 'none',
          fontSize: '12px', fontWeight: 600, color, background: bg,
          fontFamily: 'inherit', textAlign: 'center',
        }}
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

// Groupe de 3 cellules Acquis / Pris / Solde pour un compteur
function CompteurGroup({ s, keyPrefix, color, bg, onSaveAcquis, onSavePris, onSaveSolde }) {
  const labelStyle = { fontSize: '10px', fontWeight: 600, color: '#C4B5A5', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', display: 'block', textAlign: 'center' }
  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={labelStyle}>Acq</span>
        <EditCell value={s[`${keyPrefix}_acquis`] ?? null} color={color} bg={bg} small onSave={onSaveAcquis} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={labelStyle}>Pris</span>
        <EditCell value={s[`${keyPrefix}_pris`] ?? null} color={color} bg={bg} small onSave={onSavePris} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ ...labelStyle, color, fontWeight: 700 }}>Solde</span>
        <EditCell value={s[`${keyPrefix}_solde`] ?? null} color={color} bg={bg} onSave={onSaveSolde} />
      </div>
    </div>
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

  // Mise à jour d'une colonne précise (acquis, pris ou solde) par delta
  const handleDelta = async (employeId, field, delta) => {
    const solde = soldes[employeId]
    if (solde) {
      const current = solde[field] || 0
      await supabase.from('soldes_conges').update({
        [field]: Math.max(0, current + delta)
      }).eq('id', solde.id)
    } else {
      await supabase.from('soldes_conges').insert({
        employe_id: employeId, annee,
        [field]: Math.max(0, delta),
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const GROUPES = [
    { key: 'cp_n1', label: 'CP N-1', color: '#8B4A5A', bg: '#F9EEF1', headerBg: '#F5ECF0' },
    { key: 'cp_n',  label: 'CP N',   color: '#4F7EF7', bg: '#EFF6FF', headerBg: '#EAF2FF' },
    { key: 'rtt',   label: 'RTT',    color: '#16A34A', bg: '#F0FDF4', headerBg: '#E8FAF0' },
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

      {/* TABLEAU COMPTEURS */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: 0 }}>Compteurs — {annee}</h2>
            <p style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px' }}>
              Cliquez sur une valeur pour l'ajuster (positif pour ajouter, négatif pour retirer)
            </p>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} title="Données à jour" />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {/* Ligne 1 : groupes */}
            <tr style={{ background: '#FAF8F6' }}>
              <th rowSpan={2} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0EDE9', verticalAlign: 'middle' }}>
                Salarié
              </th>
              {GROUPES.map(g => (
                <th key={g.key} colSpan={3} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: g.color, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0EDE9', borderLeft: '1px solid #F0EDE9', background: g.headerBg }}>
                  {g.label}
                </th>
              ))}
              <th rowSpan={2} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0EDE9', borderLeft: '1px solid #F0EDE9', verticalAlign: 'middle' }}>
                Récup
              </th>
            </tr>
            {/* Ligne 2 : sous-colonnes */}
            <tr style={{ background: '#FAF8F6' }}>
              {GROUPES.map(g => (
                ['Acq', 'Pris', 'Solde'].map(sub => (
                  <th key={`${g.key}-${sub}`} style={{
                    padding: '6px 8px', textAlign: 'center',
                    fontSize: '10px', fontWeight: 600,
                    color: sub === 'Solde' ? g.color : '#C4B5A5',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    borderBottom: '1px solid #F0EDE9',
                    borderLeft: sub === 'Acq' ? '1px solid #F0EDE9' : 'none',
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
                  {[
                    { field: 'cp_n1_acquis', color: '#8B4A5A', bg: '#F9EEF1' },
                    { field: 'cp_n1_pris',   color: '#8B4A5A', bg: '#F9EEF1' },
                    { field: 'cp_n1_solde',  color: '#8B4A5A', bg: '#F9EEF1' },
                  ].map(({ field, color, bg }) => (
                    <td key={field} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: field.endsWith('acquis') ? '1px solid #F5ECF0' : 'none' }}>
                      <EditCell value={s[field] ?? null} color={color} bg={bg} small={!field.endsWith('solde')}
                        onSave={(delta) => handleDelta(emp.id, field, delta)} />
                    </td>
                  ))}

                  {/* CP N */}
                  {[
                    { field: 'cp_n_acquis', color: '#4F7EF7', bg: '#EFF6FF' },
                    { field: 'cp_n_pris',   color: '#4F7EF7', bg: '#EFF6FF' },
                    { field: 'cp_n_solde',  color: '#4F7EF7', bg: '#EFF6FF' },
                  ].map(({ field, color, bg }) => (
                    <td key={field} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: field.endsWith('acquis') ? '1px solid #EAF2FF' : 'none' }}>
                      <EditCell value={s[field] ?? null} color={color} bg={bg} small={!field.endsWith('solde')}
                        onSave={(delta) => handleDelta(emp.id, field, delta)} />
                    </td>
                  ))}

                  {/* RTT */}
                  {[
                    { field: 'rtt_acquis', color: '#16A34A', bg: '#F0FDF4' },
                    { field: 'rtt_pris',   color: '#16A34A', bg: '#F0FDF4' },
                    { field: 'rtt_solde',  color: '#16A34A', bg: '#F0FDF4' },
                  ].map(({ field, color, bg }) => (
                    <td key={field} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: field.endsWith('acquis') ? '1px solid #E8FAF0' : 'none' }}>
                      <EditCell value={s[field] ?? null} color={color} bg={bg} small={!field.endsWith('solde')}
                        onSave={(delta) => handleDelta(emp.id, field, delta)} />
                    </td>
                  ))}

                  {/* Récup — solde uniquement */}
                  <td style={{ padding: '10px 16px', textAlign: 'center', borderLeft: '1px solid #F0EDE9' }}>
                    <EditCell value={s['recup_solde'] ?? null} color="#B45309" bg="#FFFBEB"
                      onSave={(delta) => handleDelta(emp.id, 'recup_solde', delta)} />
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
          💡 <strong>Saisie :</strong> entrez un nombre positif pour ajouter des jours, négatif pour en retirer. <kbd style={{ background: '#F0EDE9', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>Entrée</kbd> pour confirmer, <kbd style={{ background: '#F0EDE9', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>Échap</kbd> pour annuler. Les colonnes <strong>Acq</strong> et <strong>Pris</strong> sont également éditables.
        </p>
      </div>
    </div>
  )
}
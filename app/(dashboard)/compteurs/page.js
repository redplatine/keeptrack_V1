// /app/compteurs/page.jsx
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
    <div style={{
      width: size, height: size, borderRadius: '8px', flexShrink: 0,
      background: '#F2E6E9', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {!error ? (
        <img src={`${url}?t=${id}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setError(true)} />
      ) : (
        <span style={{ fontSize: size * 0.33, fontWeight: 700, color: '#6B2F42' }}>{initiales}</span>
      )}
    </div>
  )
}

const COMPTEURS = [
  { key: 'cp_n1', label: 'CP N-1', color: '#8B4A5A', bg: '#F9EEF1' },
  { key: 'cp_n',  label: 'CP N',   color: '#4F7EF7', bg: '#EFF6FF' },
  { key: 'rtt',   label: 'RTT',    color: '#16A34A', bg: '#F0FDF4' },
  { key: 'recup', label: 'Récup',  color: '#B45309', bg: '#FFFBEB' },
]

function EditCell({ value, onSave, color, bg }) {
  const [editing, setEditing] = useState(false)
  const [delta, setDelta] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const d = parseFloat(delta)
    if (isNaN(d) || d === 0) { setEditing(false); setDelta(''); return }
    setLoading(true)
    await onSave(d)
    setEditing(false)
    setDelta('')
    setLoading(false)
  }

  if (editing) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <input
        autoFocus
        type="number"
        step="0.5"
        value={delta}
        onChange={e => setDelta(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setDelta('') } }}
        placeholder="±0.5"
        style={{
          width: '64px', padding: '4px 6px', borderRadius: '7px',
          border: `1.5px solid ${color}`, outline: 'none',
          fontSize: '13px', fontWeight: 600, color,
          background: bg, fontFamily: 'inherit', textAlign: 'center',
        }}
      />
      <button onClick={handleSave} disabled={loading} style={{
        width: '24px', height: '24px', borderRadius: '6px', border: 'none',
        background: color, color: 'white', cursor: 'pointer', fontSize: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {loading ? '…' : '✓'}
      </button>
      <button onClick={() => { setEditing(false); setDelta('') }} style={{
        width: '24px', height: '24px', borderRadius: '6px',
        border: '1px solid #E8E4E0', background: 'white',
        cursor: 'pointer', fontSize: '11px', color: '#A8A29E',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>✕</button>
    </div>
  )

  return (
    <div
      onClick={() => setEditing(true)}
      title="Cliquer pour modifier"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: '52px', height: '30px', borderRadius: '8px',
        fontSize: '14px', fontWeight: 700, background: bg, color,
        padding: '0 10px', cursor: 'pointer', transition: 'opacity 0.15s',
        border: `1px solid transparent`,
      }}
      onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${color}`; e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.opacity = '1' }}
    >
      {value ?? '—'}
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

  const handleDelta = async (employeId, key, delta) => {
    const solde = soldes[employeId]
    const anneeN = annee

    if (solde) {
      const updates = {
        [`${key}_acquis`]: Math.max(0, (solde[`${key}_acquis`] || 0) + delta),
        [`${key}_solde`]:  Math.max(0, (solde[`${key}_solde`]  || 0) + delta),
      }
      await supabase.from('soldes_conges').update(updates).eq('id', solde.id)
    } else {
      await supabase.from('soldes_conges').insert({
        employe_id: employeId, annee: anneeN,
        [`${key}_acquis`]: Math.max(0, delta),
        [`${key}_solde`]:  Math.max(0, delta),
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

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* DEMANDES RÉCUP EN ATTENTE */}
      {demandes.length > 0 && (
        <div style={{
          background: 'white', borderRadius: '16px', border: '1px solid #FDE68A',
          boxShadow: '0 2px 8px rgba(245,158,11,0.08)', marginBottom: '20px', overflow: 'hidden'
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1C1917', margin: 0 }}>
              Demandes de récupération en attente
            </h2>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
              background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A'
            }}>{demandes.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {demandes.map((d, i) => (
              <div key={d.id} style={{
                padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px',
                borderBottom: i < demandes.length - 1 ? '1px solid #FAF8F6' : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1C1917', margin: '0 0 2px' }}>
                    {d.employes?.prenom} {d.employes?.nom}
                  </p>
                  <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>
                    {d.nb_jours} jour(s) · {d.motif || 'Aucun motif'}
                    {' · '}{new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleValiderDemande(d)} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '8px', border: '1px solid #BBF7D0',
                    background: '#F0FDF4', color: '#16A34A', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>✓ Valider</button>
                  <button onClick={() => handleRefuserDemande(d.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '8px', border: '1px solid #FECACA',
                    background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>✕ Refuser</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLEAU COMPTEURS */}
      <div style={{
        background: 'white', borderRadius: '16px',
        border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: 0 }}>Compteurs — {annee}</h2>
            <p style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px' }}>
              Cliquez sur un solde pour l'ajuster (valeur positive ou négative)
            </p>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} title="Données à jour" />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAF8F6' }}>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0EDE9' }}>
                Salarié
              </th>
              {COMPTEURS.map(c => (
                <th key={c.key} style={{ padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0EDE9' }}>
                  {c.label}
                </th>
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

                  {COMPTEURS.map(c => (
                    <td key={c.key} style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <EditCell
                        value={s[`${c.key}_solde`] ?? null}
                        color={c.color}
                        bg={c.bg}
                        onSave={(delta) => handleDelta(emp.id, c.key, delta)}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* LÉGENDE */}
      <div style={{ marginTop: '16px', padding: '14px 20px', background: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '1px solid #E8E4E0' }}>
        <p style={{ fontSize: '12px', color: '#78716C', margin: 0 }}>
          💡 <strong>Saisie :</strong> entrez un nombre positif pour ajouter des jours, négatif pour en retirer. Appuyez sur <kbd style={{ background: '#F0EDE9', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>Entrée</kbd> pour confirmer ou <kbd style={{ background: '#F0EDE9', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>Échap</kbd> pour annuler.
        </p>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function getAvatarUrl(id) {
  const { data } = supabase.storage.from('avatars').getPublicUrl(`${id}/avatar`)
  return data.publicUrl
}

function Avatar({ id, prenom, nom, size = 36 }) {
  const [error, setError] = useState(false)
  const url = getAvatarUrl(id)
  const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '10px', flexShrink: 0, background: '#F2E6E9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!error ? (
        <img src={`${url}?t=${id}`} alt={`${prenom} ${nom}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setError(true)} />
      ) : (
        <span style={{ fontSize: size * 0.33, fontWeight: 700, color: '#6B2F42' }}>{initiales}</span>
      )}
    </div>
  )
}

const CONTRAT_CONFIG = {
  'CDI':        { bg: '#F9EEF1', color: '#6B2F42' },
  'CDD':        { bg: '#FFFBEB', color: '#B45309' },
  'Alternance': { bg: '#F0FDF4', color: '#16A34A' },
  'Stage':      { bg: '#F0EDE9', color: '#78716C' },
}

const S = {
  input: {
    width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px',
    padding: '9px 12px', fontSize: '13.5px', background: '#FAF8F6',
    outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  label: {
    fontSize: '12px', fontWeight: 600, color: '#A8A29E', marginBottom: '6px',
    display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em'
  },
  sectionTitle: {
    fontSize: '11px', fontWeight: 700, color: '#C4B5A5', textTransform: 'uppercase',
    letterSpacing: '0.1em', padding: '0 0 10px', borderBottom: '1px solid #F0EDE9',
    marginBottom: '16px', gridColumn: '1 / -1'
  },
}

const FORM_DEFAULT = {
  matricule: '', nom: '', prenom: '', email: '', poste: '',
  departement: '', type_contrat: 'CDI', statut: 'Non-cadre',
  temps_travail: 'Temps plein', date_entree: '', salaire_brut: '',
  numero_voie: '', nom_rue: '', code_postal: '', ville: '',
  date_naissance: '', rtt_annuel: 0,
}

export default function EmployesPage() {
  const [employes, setEmployes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [employeSelectionne, setEmployeSelectionne] = useState(null)
  const [invitationEnvoyee, setInvitationEnvoyee] = useState(false)
  const [invitationLoading, setInvitationLoading] = useState(false)
  const [form, setForm] = useState(FORM_DEFAULT)

  useEffect(() => { fetchEmployes() }, [])

  const fetchEmployes = async () => {
    const { data, error } = await supabase.from('employes').select('*').order('nom')
    if (!error) setEmployes(data)
    setLoading(false)
  }

  const resetForm = () => setForm(FORM_DEFAULT)

  const handleEnvoyerInvitation = async () => {
    if (!form.email) return
    setInvitationLoading(true)
    const response = await fetch('/api/inviter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email }),
    })
    const data = await response.json()
    if (data.error) alert('Erreur : ' + data.error)
    else setInvitationEnvoyee(true)
    setInvitationLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formNettoye = {
      matricule: form.matricule || null, nom: form.nom, prenom: form.prenom,
      email: form.email, poste: form.poste || null, departement: form.departement || null,
      type_contrat: form.type_contrat, statut: form.statut, temps_travail: form.temps_travail,
      date_entree: form.date_entree || null, salaire_brut: form.salaire_brut || null,
      numero_voie: form.numero_voie || null, nom_rue: form.nom_rue || null,
      code_postal: form.code_postal || null, ville: form.ville || null,
      date_naissance: form.date_naissance || null, rtt_annuel: form.rtt_annuel || 0,
    }

    if (employeSelectionne) {
      const { error } = await supabase.from('employes').update(formNettoye).eq('id', employeSelectionne.id)
      if (error) { alert('Erreur modification : ' + error.message); return }
      if (form.date_entree !== employeSelectionne.date_entree || parseFloat(form.rtt_annuel) !== parseFloat(employeSelectionne.rtt_annuel)) {
        await supabase.rpc('calculer_acquisitions')
      }
    } else {
      const { error } = await supabase.from('employes').insert([formNettoye]).select().single()
      if (error) { alert('Erreur création : ' + error.message); return }
      await supabase.rpc('calculer_acquisitions')
      // Reprise des compteurs à la création
      const { data: newEmp } = await supabase.from('employes').select('id').eq('email', formNettoye.email).single()
      const cp_n1 = parseFloat(form.cp_n1_reprise) || 0
      const cp_n  = parseFloat(form.cp_n_reprise)  || 0
      const rtt   = parseFloat(form.rtt_reprise)   || 0
      const recup = parseFloat(form.recup_reprise)  || 0
      if (cp_n1 > 0 || cp_n > 0 || rtt > 0 || recup > 0) {
        const annee = new Date().getFullYear()
        const { data: ex } = await supabase.from('soldes_conges').select('*').eq('employe_id', newEmp.id).eq('annee', annee).single()
        if (ex) {
          await supabase.from('soldes_conges').update({
            cp_n1_acquis: (ex.cp_n1_acquis || 0) + cp_n1, cp_n1_solde: (ex.cp_n1_solde || 0) + cp_n1,
            cp_n_acquis:  (ex.cp_n_acquis  || 0) + cp_n,  cp_n_solde:  (ex.cp_n_solde  || 0) + cp_n,
            rtt_acquis:   (ex.rtt_acquis   || 0) + rtt,   rtt_solde:   (ex.rtt_solde   || 0) + rtt,
            recup_acquis: (ex.recup_acquis || 0) + recup, recup_solde: (ex.recup_solde || 0) + recup,
          }).eq('employe_id', newEmp.id).eq('annee', annee)
        } else {
          await supabase.from('soldes_conges').insert({
            employe_id: newEmp.id, annee,
            cp_n1_acquis: cp_n1, cp_n1_solde: cp_n1,
            cp_n_acquis: cp_n,   cp_n_solde: cp_n,
            rtt_acquis: rtt,     rtt_solde: rtt,
            recup_acquis: recup, recup_solde: recup,
          })
        }
      }
    }

    setShowForm(false); setEmployeSelectionne(null); setInvitationEnvoyee(false); resetForm(); fetchEmployes()
  }

  const handleDoubleClick = (emp) => {
    setEmployeSelectionne(emp); setInvitationEnvoyee(false)
    setForm({
      matricule: emp.matricule || '', nom: emp.nom || '', prenom: emp.prenom || '',
      email: emp.email || '', poste: emp.poste || '', departement: emp.departement || '',
      type_contrat: emp.type_contrat || 'CDI', statut: emp.statut || 'Non-cadre',
      temps_travail: emp.temps_travail || 'Temps plein', date_entree: emp.date_entree || '',
      salaire_brut: emp.salaire_brut || '', numero_voie: emp.numero_voie || '',
      nom_rue: emp.nom_rue || '', code_postal: emp.code_postal || '', ville: emp.ville || '',
      date_naissance: emp.date_naissance || '', rtt_annuel: emp.rtt_annuel || 0,
    })
    setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSupprimer = async () => {
    if (!window.confirm(`Supprimer ${employeSelectionne.prenom} ${employeSelectionne.nom} ? Cette action est irréversible.`)) return
    await supabase.from('soldes_conges').delete().eq('employe_id', employeSelectionne.id)
    await supabase.from('absences').delete().eq('employe_id', employeSelectionne.id)
    await supabase.from('employes').delete().eq('id', employeSelectionne.id)
    setShowForm(false); setEmployeSelectionne(null); resetForm(); fetchEmployes()
  }

  const F = (key, extra = {}) => ({
    value: form[key],
    onChange: e => setForm({ ...form, [key]: e.target.value }),
    style: { ...S.input, ...extra }
  })

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: '#78716C', margin: 0 }}>
          {employes.length} salarié(s) · double-cliquez pour ouvrir une fiche
        </p>
        <button onClick={() => { setEmployeSelectionne(null); setInvitationEnvoyee(false); resetForm(); setShowForm(!showForm) }}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#1C1917', color: 'white', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = '#44403C'}
          onMouseLeave={e => e.currentTarget.style.background = '#1C1917'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter un employé
        </button>
      </div>

      {/* FORMULAIRE */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px 32px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {employeSelectionne && <Avatar id={employeSelectionne.id} prenom={employeSelectionne.prenom} nom={employeSelectionne.nom} size={40} />}
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917', margin: 0 }}>
                  {employeSelectionne ? `${employeSelectionne.prenom} ${employeSelectionne.nom}` : 'Nouvel employé'}
                </h2>
                {employeSelectionne && <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>Modification de la fiche</p>}
              </div>
            </div>
            {employeSelectionne && (
              <button onClick={handleEnvoyerInvitation} disabled={invitationLoading || invitationEnvoyee}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
                  cursor: invitationEnvoyee ? 'default' : 'pointer', fontFamily: 'inherit',
                  border: invitationEnvoyee ? '1px solid #BBF7D0' : '1px solid #E8E4E0',
                  background: invitationEnvoyee ? '#F0FDF4' : '#FAF8F6',
                  color: invitationEnvoyee ? '#16A34A' : '#44403C',
                }}>
                {invitationLoading ? '⏳ Envoi…' : invitationEnvoyee ? '✓ Invitation envoyée' : '✉ Envoyer invitation'}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              <div style={S.sectionTitle}>Informations personnelles</div>
              <div><label style={S.label}>Matricule</label><input {...F('matricule')} placeholder="Ex: MAT001" /></div>
              <div><label style={S.label}>Nom *</label><input required {...F('nom')} /></div>
              <div><label style={S.label}>Prénom *</label><input required {...F('prenom')} /></div>
              <div><label style={S.label}>Email *</label><input required type="email" {...F('email')} /></div>
              <div><label style={S.label}>Date de naissance</label><input type="date" {...F('date_naissance')} /></div>

              <div style={{ ...S.sectionTitle, marginTop: '8px' }}>Adresse</div>
              <div><label style={S.label}>Numéro de voie</label><input {...F('numero_voie')} /></div>
              <div><label style={S.label}>Nom de rue</label><input {...F('nom_rue')} /></div>
              <div><label style={S.label}>Code postal</label><input {...F('code_postal')} /></div>
              <div><label style={S.label}>Ville</label><input {...F('ville')} /></div>

              <div style={{ ...S.sectionTitle, marginTop: '8px' }}>Contrat & Rémunération</div>
              <div><label style={S.label}>Poste</label><input {...F('poste')} /></div>
              <div><label style={S.label}>Département</label><input {...F('departement')} /></div>
              <div><label style={S.label}>Date d'entrée *</label><input required type="date" {...F('date_entree')} /></div>
              <div>
                <label style={S.label}>Type de contrat</label>
                <select {...F('type_contrat')} style={{ ...S.input, cursor: 'pointer' }}>
                  <option>CDI</option><option>CDD</option><option>Alternance</option><option>Stage</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Statut</label>
                <select {...F('statut')} style={{ ...S.input, cursor: 'pointer' }}>
                  <option>Cadre</option><option>Non-cadre</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Temps de travail</label>
                <select {...F('temps_travail')} style={{ ...S.input, cursor: 'pointer' }}>
                  <option>Temps plein</option><option>Temps partiel</option>
                </select>
              </div>
              <div><label style={S.label}>RTT annuel</label><input type="number" {...F('rtt_annuel')} placeholder="0 si pas de RTT" /></div>
              <div><label style={S.label}>Salaire brut annuel (€)</label><input type="number" {...F('salaire_brut')} placeholder="Ex: 35000" /></div>

              {/* NOTE : les compteurs se gèrent désormais dans l'onglet "Compteurs" */}
              {!employeSelectionne && (
                <>
                  <div style={{ ...S.sectionTitle, marginTop: '8px' }}>Reprise des compteurs (optionnel)</div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '-8px', marginBottom: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>
                      Pour les salariés ayant déjà des compteurs à reprendre. Les ajustements ultérieurs se font via l'onglet <strong>Compteurs</strong>.
                    </p>
                  </div>
                  <div>
                    <label style={S.label}>CP N-1 (j)</label>
                    <input type="number" step="0.5" value={form.cp_n1_reprise || 0}
                      onChange={e => setForm({ ...form, cp_n1_reprise: parseFloat(e.target.value) || 0 })} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>CP N (j)</label>
                    <input type="number" step="0.5" value={form.cp_n_reprise || 0}
                      onChange={e => setForm({ ...form, cp_n_reprise: parseFloat(e.target.value) || 0 })} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>RTT (j)</label>
                    <input type="number" step="0.5" value={form.rtt_reprise || 0}
                      onChange={e => setForm({ ...form, rtt_reprise: parseFloat(e.target.value) || 0 })} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Récupération (j)</label>
                    <input type="number" step="0.5" value={form.recup_reprise || 0}
                      onChange={e => setForm({ ...form, recup_reprise: parseFloat(e.target.value) || 0 })} style={S.input} />
                  </div>
                </>
              )}

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid #F0EDE9' }}>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#1C1917', color: 'white', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#44403C'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1C1917'}>
                  {employeSelectionne ? 'Enregistrer les modifications' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEmployeSelectionne(null); setInvitationEnvoyee(false); resetForm() }}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #E8E4E0', background: 'white', color: '#78716C', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Annuler
                </button>
                {employeSelectionne && (
                  <button type="button" onClick={handleSupprimer}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TABLEAU */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : employes.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>👥</div>
            <p style={{ color: '#A8A29E', fontSize: '14px' }}>Aucun employé pour l'instant</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAF8F6' }}>
                {['Matricule', 'Nom', 'Poste', 'Contrat', 'Entrée', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0EDE9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employes.map(emp => {
                const cc = CONTRAT_CONFIG[emp.type_contrat] || CONTRAT_CONFIG['CDI']
                return (
                  <tr key={emp.id} onDoubleClick={() => handleDoubleClick(emp)}
                    style={{ borderBottom: '1px solid #FAF8F6', transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '15px 24px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'monospace', background: '#F0EDE9', color: '#78716C', padding: '4px 9px', borderRadius: '6px' }}>
                        {emp.matricule || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '15px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar id={emp.id} prenom={emp.prenom} nom={emp.nom} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917' }}>{emp.prenom} {emp.nom}</div>
                          <div style={{ fontSize: '12px', color: '#A8A29E' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px 24px', fontSize: '13px', color: '#78716C' }}>{emp.poste || '—'}</td>
                    <td style={{ padding: '15px 24px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: cc.bg, color: cc.color }}>
                        {emp.type_contrat}
                      </span>
                    </td>
                    <td style={{ padding: '15px 24px', fontSize: '13px', color: '#78716C' }}>{emp.date_entree || '—'}</td>
                    <td style={{ padding: '15px 24px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: emp.statut === 'Cadre' ? '#F9EEF1' : '#F0EDE9', color: emp.statut === 'Cadre' ? '#6B2F42' : '#78716C' }}>
                        {emp.statut}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
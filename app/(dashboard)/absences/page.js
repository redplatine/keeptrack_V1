'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

const joursFeries = [
  '2024-01-01', '2024-04-01', '2024-05-01', '2024-05-08',
  '2024-05-09', '2024-05-20', '2024-07-14', '2024-08-15',
  '2024-11-01', '2024-11-11', '2024-12-25',
  '2025-01-01', '2025-04-21', '2025-05-01', '2025-05-08',
  '2025-05-29', '2025-06-09', '2025-07-14', '2025-08-15',
  '2025-11-01', '2025-11-11', '2025-12-25',
  '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08',
  '2026-05-14', '2026-05-25', '2026-07-14', '2026-08-15',
  '2026-11-01', '2026-11-11', '2026-12-25',
  '2027-01-01', '2027-03-29', '2027-05-01', '2027-05-08',
  '2027-05-17', '2027-05-28', '2027-07-14', '2027-08-15',
  '2027-11-01', '2027-11-11', '2027-12-25',
  '2028-01-01', '2028-04-17', '2028-05-01', '2028-05-08',
  '2028-05-25', '2028-06-05', '2028-07-14', '2028-08-15',
  '2028-11-01', '2028-11-11', '2028-12-25',
]

const ABSENCES_CALENDAIRE = ['Maladie', 'Maternité', 'Paternité']
const ABSENCES_AUTO_APPROUVEES = ['Maladie', 'Maternité', 'Paternité']
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const TYPE_CONFIG = {
  'CP':                  { bg: '#EFF6FF', color: '#2563EB' },
  'RTT':                 { bg: '#F9EEF1', color: '#6B2F42' },
  'Récupération':        { bg: '#FFFBEB', color: '#B45309' },
  'Maladie':             { bg: '#FEF2F2', color: '#DC2626' },
  'Maternité':           { bg: '#FDF4FF', color: '#A21CAF' },
  'Paternité':           { bg: '#F2E6E9', color: '#8B4A5A' },
  'Congé sans solde':    { bg: '#F0EDE9', color: '#78716C' },
  'Événement familial':  { bg: '#FFFBEB', color: '#B45309' },
  'Absence injustifiée': { bg: '#FEF2F2', color: '#991B1B' },
}

const STATUS_CONFIG = {
  'En attente': { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B', border: '#FDE68A' },
  'Approuvée':  { bg: '#F0FDF4', color: '#16A34A', dot: '#4ADE80', border: '#BBF7D0' },
  'Refusée':    { bg: '#FEF2F2', color: '#DC2626', dot: '#F87171', border: '#FECACA' },
}

function calculJoursOuvres(debut, fin) {
  let count = 0
  let current = new Date(debut)
  const end = new Date(fin)
  while (current <= end) {
    const day = current.getDay()
    const dateStr = current.toISOString().split('T')[0]
    if (day !== 0 && day !== 6 && !joursFeries.includes(dateStr)) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

function calculJoursCalendaires(debut, fin) {
  const start = new Date(debut)
  const end = new Date(fin)
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
}

function calculNbJours(typeAbsence, debut, fin, demiJournee) {
  if (demiJournee) return 0.5
  if (!debut || !fin) return 0
  if (ABSENCES_CALENDAIRE.includes(typeAbsence)) return calculJoursCalendaires(debut, fin)
  return calculJoursOuvres(debut, fin)
}

function genererOptionsMois() {
  const options = []
  const now = new Date()
  for (let i = -12; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${MOIS[d.getMonth()]} ${d.getFullYear()}`,
    })
  }
  return options
}

const S = {
  input: {
    width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px',
    padding: '9px 12px', fontSize: '13.5px', background: '#FAF8F6',
    outline: 'none', color: '#1C1917', fontFamily: 'inherit',
  },
  select: {
    border: '1px solid #E8E4E0', borderRadius: '10px',
    padding: '9px 12px', fontSize: '13.5px', background: '#FAF8F6',
    outline: 'none', color: '#1C1917', fontFamily: 'inherit', cursor: 'pointer',
  },
  label: {
    fontSize: '12px', fontWeight: 600, color: '#A8A29E', marginBottom: '6px',
    display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em',
  },
}

export default function AbsencesPage() {
  const [absences, setAbsences] = useState([])
  const [employes, setEmployes] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentEmploye, setCurrentEmploye] = useState(null)

  // Formulaire absence
  const [showForm, setShowForm] = useState(false)
  const [alerteForm, setAlerteForm] = useState(null)
  const [form, setForm] = useState({
    employe_id: '', type_absence: 'CP', date_debut: '',
    date_fin: '', demi_journee: false, commentaire_salarie: '',
  })

  // Formulaire demande récup
  const [showFormRecup, setShowFormRecup] = useState(false)
  const [formRecup, setFormRecup] = useState({ nb_jours: '', motif: '' })
  const [alerteRecup, setAlerteRecup] = useState(null)
  const [successRecup, setSuccessRecup] = useState(false)

  // Filtres
  const [filtreMois, setFiltreMois] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreEmployeId, setFiltreEmployeId] = useState('')

  const nbJoursCalcule = calculNbJours(form.type_absence, form.date_debut, form.date_fin, form.demi_journee)
  const optionsMois = useMemo(() => genererOptionsMois(), [])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: emp } = await supabase.from('employes').select('*').eq('email', user.email).single()
    setCurrentEmploye(emp)
    const { data: allEmployes } = await supabase.from('employes').select('id, nom, prenom, role').order('nom')
    setEmployes(allEmployes || [])
    let absData = []
    if (emp?.role === 'salarie') {
      const { data } = await supabase.from('absences').select('*').eq('employe_id', emp.id).order('date_debut', { ascending: false })
      absData = data || []
    } else {
      const { data } = await supabase.from('absences').select('*').order('date_debut', { ascending: false })
      absData = data || []
    }
    const { data: employesData } = await supabase.from('employes').select('id, nom, prenom, matricule')
    absData = absData.map(abs => ({ ...abs, employes: employesData?.find(e => e.id === abs.employe_id) || null }))
    setAbsences(absData)
    setLoading(false)
  }

  const isManager = currentEmploye?.role === 'manager' || currentEmploye?.role === 'admin'

  const absencesFiltrees = useMemo(() => {
    return absences.filter(abs => {
      if (filtreMois) {
        const dateDebut = abs.date_debut?.slice(0, 7)
        const dateFin = abs.date_fin?.slice(0, 7)
        if (dateDebut > filtreMois || dateFin < filtreMois) return false
      }
      if (filtreStatut && abs.statut !== filtreStatut) return false
      if (filtreEmployeId && abs.employe_id !== filtreEmployeId) return false
      return true
    })
  }, [absences, filtreMois, filtreStatut, filtreEmployeId])

  const typesDisponibles = isManager
    ? ['CP', 'RTT', 'Récupération', 'Maladie', 'Absence injustifiée', 'Congé sans solde', 'Événement familial', 'Maternité', 'Paternité']
    : ['CP', 'RTT', 'Récupération', 'Maladie', 'Congé sans solde', 'Événement familial', 'Maternité', 'Paternité']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlerteForm(null)
    const statut = ABSENCES_AUTO_APPROUVEES.includes(form.type_absence) ? 'Approuvée' : 'En attente'
    const employe_id = isManager && form.employe_id ? form.employe_id : currentEmploye?.id
    if (!employe_id) { setAlerteForm('Votre profil employé est introuvable.'); return }
    const date_fin_reelle = form.demi_journee ? form.date_debut : form.date_fin

    if (['CP', 'RTT', 'Récupération'].includes(form.type_absence)) {
      const annee = new Date().getFullYear()
      const { data: solde } = await supabase.from('soldes_conges').select('*').eq('employe_id', employe_id).eq('annee', annee).single()
      if (solde) {
        if (form.type_absence === 'RTT' && nbJoursCalcule > (solde.rtt_solde || 0)) {
          setAlerteForm(`Solde RTT insuffisant — Disponible : ${solde.rtt_solde} j, demande : ${nbJoursCalcule} j`); return
        } else if (form.type_absence === 'Récupération' && nbJoursCalcule > (solde.recup_solde || 0)) {
          setAlerteForm(`Solde Récupération insuffisant — Disponible : ${solde.recup_solde} j, demande : ${nbJoursCalcule} j`); return
        } else if (form.type_absence === 'CP') {
          const totalCp = (solde.cp_n1_solde || 0) + (solde.cp_n_solde || 0)
          if (nbJoursCalcule > totalCp) { setAlerteForm(`Solde CP insuffisant — Disponible : ${totalCp} j, demande : ${nbJoursCalcule} j`); return }
        }
      }
    }

    const { data: absExistantes } = await supabase.from('absences').select('id, date_debut, date_fin, type_absence').eq('employe_id', employe_id).neq('statut', 'Refusée')
    const chevauchement = absExistantes?.find(abs => {
      const finExist = abs.date_fin || abs.date_debut
      return form.date_debut <= finExist && date_fin_reelle >= abs.date_debut
    })
    if (chevauchement) { setAlerteForm(`Chevauchement avec une absence existante (${chevauchement.type_absence} du ${chevauchement.date_debut} au ${chevauchement.date_fin || chevauchement.date_debut})`); return }

    const { error } = await supabase.from('absences').insert([{
      employe_id, type_absence: form.type_absence, date_debut: form.date_debut,
      date_fin: date_fin_reelle, nb_jours: nbJoursCalcule, statut,
      commentaire_salarie: form.commentaire_salarie,
    }])
    if (!error) {
      setShowForm(false); setAlerteForm(null)
      setForm({ employe_id: '', type_absence: 'CP', date_debut: '', date_fin: '', demi_journee: false, commentaire_salarie: '' })
      fetchData()
    } else { setAlerteForm('Erreur : ' + error.message) }
  }

  const handleDemandeRecup = async (e) => {
    e.preventDefault()
    setAlerteRecup(null)
    const nb = parseFloat(formRecup.nb_jours)
    if (!nb || nb <= 0) { setAlerteRecup('Nombre de jours invalide.'); return }
    const { error } = await supabase.from('demandes_recup').insert([{
      employe_id: currentEmploye.id,
      nb_jours: nb,
      motif: formRecup.motif || null,
    }])
    if (error) { setAlerteRecup('Erreur : ' + error.message); return }
    setShowFormRecup(false)
    setFormRecup({ nb_jours: '', motif: '' })
    setSuccessRecup(true)
    setTimeout(() => setSuccessRecup(false), 4000)
  }

  const handleValidation = async (id, statut) => {
    const abs = absences.find(a => a.id === id)
    if (statut === 'Approuvée' && abs) {
      const annee = new Date().getFullYear()
      const { data: solde } = await supabase.from('soldes_conges').select('*').eq('employe_id', abs.employe_id).eq('annee', annee).single()
      if (solde) {
        const nbJours = abs.nb_jours
        if (abs.type_absence === 'RTT') {
          await supabase.from('soldes_conges').update({ rtt_solde: Math.max(0, (solde.rtt_solde || 0) - nbJours), rtt_pris: (solde.rtt_pris || 0) + nbJours }).eq('employe_id', abs.employe_id).eq('annee', annee)
        } else if (abs.type_absence === 'Récupération') {
          await supabase.from('soldes_conges').update({ recup_solde: Math.max(0, (solde.recup_solde || 0) - nbJours), recup_pris: (solde.recup_pris || 0) + nbJours }).eq('employe_id', abs.employe_id).eq('annee', annee)
        } else if (abs.type_absence === 'CP') {
          let r = nbJours, n1s = solde.cp_n1_solde || 0, ns = solde.cp_n_solde || 0, n1p = solde.cp_n1_pris || 0, np = solde.cp_n_pris || 0
          if (n1s >= r) { n1s -= r; n1p += r; r = 0 } else { r -= n1s; n1p += n1s; n1s = 0; ns = Math.max(0, ns - r); np += r }
          await supabase.from('soldes_conges').update({ cp_n1_solde: n1s, cp_n1_pris: n1p, cp_n_solde: ns, cp_n_pris: np }).eq('employe_id', abs.employe_id).eq('annee', annee)
        }
      }
    }
    await supabase.from('absences').update({ statut }).eq('id', id)
    if (abs) {
      const { data: empData } = await supabase.from('employes').select('email, prenom').eq('id', abs.employe_id).single()
      if (empData?.email) {
        await fetch('/api/notify-absence', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailSalarie: empData.email, prenomSalarie: empData.prenom, typeAbsence: abs.type_absence, dateDebut: abs.date_debut, dateFin: abs.date_fin || abs.date_debut, nbJours: abs.nb_jours, statut })
        })
      }
    }
    fetchData()
  }

  const handleSupprimer = async (abs) => {
    if (!window.confirm(`Supprimer cette absence de ${abs.nb_jours}j (${abs.type_absence}) ?`)) return
    if (abs.statut === 'Approuvée') {
      const annee = new Date().getFullYear()
      const { data: solde } = await supabase.from('soldes_conges').select('*').eq('employe_id', abs.employe_id).eq('annee', annee).single()
      if (solde) {
        const nbJours = abs.nb_jours
        if (abs.type_absence === 'RTT') {
          await supabase.from('soldes_conges').update({ rtt_solde: (solde.rtt_solde || 0) + nbJours, rtt_pris: Math.max(0, (solde.rtt_pris || 0) - nbJours) }).eq('employe_id', abs.employe_id).eq('annee', annee)
        } else if (abs.type_absence === 'Récupération') {
          await supabase.from('soldes_conges').update({ recup_solde: (solde.recup_solde || 0) + nbJours, recup_pris: Math.max(0, (solde.recup_pris || 0) - nbJours) }).eq('employe_id', abs.employe_id).eq('annee', annee)
        } else if (abs.type_absence === 'CP') {
          let r = nbJours, ns = solde.cp_n_solde || 0, n1s = solde.cp_n1_solde || 0, np = solde.cp_n_pris || 0, n1p = solde.cp_n1_pris || 0
          const d = Math.min(np, r); ns += d; np -= d; r -= d
          if (r > 0) { n1s += r; n1p = Math.max(0, n1p - r) }
          await supabase.from('soldes_conges').update({ cp_n_solde: ns, cp_n_pris: np, cp_n1_solde: n1s, cp_n1_pris: n1p }).eq('employe_id', abs.employe_id).eq('annee', annee)
        }
      }
    }
    await supabase.from('absences').delete().eq('id', abs.id)
    fetchData()
  }

  const handleExportExcel = () => {
    const data = absencesFiltrees.map(abs => ({
      'Matricule': abs.employes?.matricule || '—',
      'Employé': `${abs.employes?.prenom || ''} ${abs.employes?.nom || ''}`,
      'Type d\'absence': abs.type_absence,
      'Date début': abs.date_debut,
      'Date fin': abs.date_fin || abs.date_debut,
      'Nombre de jours': abs.nb_jours,
      'Statut': abs.statut,
      'Commentaire': abs.commentaire_salarie || '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Absences')
    ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 30 }]
    const suffixe = filtreMois ? `_${optionsMois.find(o => o.value === filtreMois)?.label.replace(' ', '_')}` : `_${new Date().toISOString().split('T')[0]}`
    XLSX.writeFile(wb, `absences${suffixe}.xlsx`)
  }

  const nbFiltresActifs = [filtreMois, filtreStatut, filtreEmployeId].filter(Boolean).length

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: '#78716C', margin: 0 }}>
          {absencesFiltrees.length} demande(s)
          {nbFiltresActifs > 0 && <span style={{ color: '#8B4A5A', marginLeft: '6px' }}>· {nbFiltresActifs} filtre(s) actif(s)</span>}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isManager && (
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
          )}

          {/* BOUTON RÉCUP — salarié uniquement */}
          {!isManager && (
            <button onClick={() => { setShowFormRecup(!showFormRecup); setShowForm(false); setAlerteRecup(null) }} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', borderRadius: '10px',
              border: '1px solid #FDE68A', background: showFormRecup ? '#FEF3C7' : '#FFFBEB',
              color: '#B45309', fontSize: '13.5px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEF3C7'}
              onMouseLeave={e => e.currentTarget.style.background = showFormRecup ? '#FEF3C7' : '#FFFBEB'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Demander des récups
            </button>
          )}

          <button onClick={() => { setShowForm(!showForm); setShowFormRecup(false); setAlerteForm(null) }} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', borderRadius: '10px', border: 'none',
            background: '#1C1917', color: 'white', fontSize: '13.5px', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#44403C'}
            onMouseLeave={e => e.currentTarget.style.background = '#1C1917'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvelle demande
          </button>
        </div>
      </div>

      {/* SUCCÈS RÉCUP */}
      {successRecup && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px',
          padding: '12px 16px', marginBottom: '16px', color: '#B45309', fontSize: '13.5px', fontWeight: 500
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Demande envoyée — votre administrateur va la traiter.
        </div>
      )}

      {/* FORMULAIRE DEMANDE RÉCUP — salarié */}
      {showFormRecup && !isManager && (
        <div style={{
          background: 'white', borderRadius: '14px', padding: '24px 28px',
          border: '1px solid #FDE68A', boxShadow: '0 2px 8px rgba(245,158,11,0.08)', marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: '0 0 4px' }}>
            Demander des jours de récupération
          </h2>
          <p style={{ fontSize: '13px', color: '#A8A29E', margin: '0 0 20px' }}>
            Votre administrateur validera la demande et créditera votre compteur Récup.
          </p>

          {alerteRecup && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#DC2626', fontSize: '13.5px' }}>
              {alerteRecup}
            </div>
          )}

          <form onSubmit={handleDemandeRecup}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={S.label}>Nombre de jours</label>
                <input required type="number" step="0.5" min="0.5"
                  value={formRecup.nb_jours}
                  onChange={e => setFormRecup({ ...formRecup, nb_jours: e.target.value })}
                  placeholder="Ex: 1, 0.5…" style={S.input} />
              </div>
              <div>
                <label style={S.label}>Motif (optionnel)</label>
                <input type="text"
                  value={formRecup.motif}
                  onChange={e => setFormRecup({ ...formRecup, motif: e.target.value })}
                  placeholder="Ex: Heures supplémentaires semaine 12…" style={S.input} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="submit" style={{
                  padding: '10px 20px', borderRadius: '10px', border: 'none',
                  background: '#B45309', color: 'white', fontSize: '13.5px', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Envoyer la demande</button>
                <button type="button" onClick={() => { setShowFormRecup(false); setAlerteRecup(null) }} style={{
                  padding: '10px 20px', borderRadius: '10px', border: '1px solid #E8E4E0',
                  background: 'white', color: '#78716C', fontSize: '13.5px', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Annuler</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* FILTRES */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '18px 22px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={S.label}>Mois</label>
            <select value={filtreMois} onChange={e => setFiltreMois(e.target.value)} style={S.select}>
              <option value="">Tous les mois</option>
              {optionsMois.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Statut</label>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={S.select}>
              <option value="">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="Approuvée">Approuvée</option>
              <option value="Refusée">Refusée</option>
            </select>
          </div>
          {isManager && (
            <div>
              <label style={S.label}>Employé</label>
              <select value={filtreEmployeId} onChange={e => setFiltreEmployeId(e.target.value)} style={S.select}>
                <option value="">Tous les employés</option>
                {employes.map(emp => <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>)}
              </select>
            </div>
          )}
          {nbFiltresActifs > 0 && (
            <button onClick={() => { setFiltreMois(''); setFiltreStatut(''); setFiltreEmployeId('') }} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 14px', borderRadius: '10px', border: '1px solid #E8E4E0',
              background: '#FAF8F6', color: '#78716C', fontSize: '13px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* FORMULAIRE NOUVELLE ABSENCE */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '24px 28px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: '0 0 20px' }}>Nouvelle demande d'absence</h2>

          {alerteForm && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#DC2626', fontSize: '13.5px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {alerteForm}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {isManager && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={S.label}>Employé concerné</label>
                  <select required value={form.employe_id} onChange={e => setForm({...form, employe_id: e.target.value})} style={{ ...S.input, cursor: 'pointer' }}>
                    <option value="">-- Sélectionner un employé --</option>
                    {employes.map(emp => <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={S.label}>Type d'absence</label>
                <select value={form.type_absence} onChange={e => setForm({...form, type_absence: e.target.value, demi_journee: false})} style={{ ...S.input, cursor: 'pointer' }}>
                  {typesDisponibles.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '22px' }}>
                <input type="checkbox" id="demi_journee" checked={form.demi_journee}
                  onChange={e => setForm({...form, demi_journee: e.target.checked, date_fin: ''})}
                  style={{ width: '16px', height: '16px', accentColor: '#8B4A5A', cursor: 'pointer' }} />
                <label htmlFor="demi_journee" style={{ fontSize: '13.5px', color: '#44403C', cursor: 'pointer', fontWeight: 500 }}>Demi-journée</label>
              </div>
              <div>
                <label style={S.label}>{form.demi_journee ? 'Date' : 'Date de début'}</label>
                <input required type="date" value={form.date_debut} onChange={e => setForm({...form, date_debut: e.target.value})} style={S.input} />
              </div>
              {!form.demi_journee && (
                <div>
                  <label style={S.label}>Date de fin</label>
                  <input required type="date" value={form.date_fin} min={form.date_debut} onChange={e => setForm({...form, date_fin: e.target.value})} style={S.input} />
                </div>
              )}
              {(form.date_debut && (form.date_fin || form.demi_journee)) && (
                <div style={{ gridColumn: '1 / -1', background: '#F0EDE9', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #E8E4E0' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#1C1917', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {nbJoursCalcule}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1C1917', margin: 0 }}>
                      {nbJoursCalcule} jour(s) {form.demi_journee ? '' : ABSENCES_CALENDAIRE.includes(form.type_absence) ? 'calendaires' : 'ouvrés'}
                    </p>
                    {ABSENCES_AUTO_APPROUVEES.includes(form.type_absence) && (
                      <span style={{ fontSize: '12px', background: '#F0FDF4', color: '#16A34A', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>
                        ✓ Approuvée automatiquement
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Commentaire (optionnel)</label>
                <textarea value={form.commentaire_salarie} onChange={e => setForm({...form, commentaire_salarie: e.target.value})}
                  rows={2} placeholder="Précisez si nécessaire…"
                  style={{ ...S.input, resize: 'none', lineHeight: 1.5 }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#1C1917', color: 'white', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Envoyer la demande
                </button>
                <button type="button" onClick={() => { setShowForm(false); setAlerteForm(null) }} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #E8E4E0', background: 'white', color: '#78716C', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Annuler
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TABLEAU */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : absencesFiltrees.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
            <p style={{ color: '#A8A29E', fontSize: '14px' }}>Aucune absence pour cette période</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAF8F6' }}>
                {['Employé', 'Type', 'Période', 'Jours', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0EDE9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {absencesFiltrees.map(abs => {
                const tc = TYPE_CONFIG[abs.type_absence] || { bg: '#F0EDE9', color: '#78716C' }
                const sc = STATUS_CONFIG[abs.statut] || STATUS_CONFIG['En attente']
                return (
                  <tr key={abs.id} style={{ borderBottom: '1px solid #FAF8F6', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '15px 24px', fontSize: '14px', fontWeight: 500, color: '#1C1917' }}>
                      {abs.employes?.prenom} {abs.employes?.nom}
                    </td>
                    <td style={{ padding: '15px 24px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: tc.bg, color: tc.color }}>
                        {abs.type_absence}
                      </span>
                    </td>
                    <td style={{ padding: '15px 24px', fontSize: '13px', color: '#78716C' }}>
                      {abs.nb_jours === 0.5 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {abs.date_debut}
                          <span style={{ fontSize: '11px', background: '#F0EDE9', color: '#78716C', padding: '2px 6px', borderRadius: '4px' }}>½ j</span>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {abs.date_debut}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C4B5A5" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          {abs.date_fin}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '15px 24px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', height: '28px', borderRadius: '8px', padding: '0 10px', fontSize: '13px', fontWeight: 700, background: '#F0EDE9', color: '#44403C' }}>
                        {abs.nb_jours}
                      </span>
                    </td>
                    <td style={{ padding: '15px 24px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                        {abs.statut}
                      </span>
                    </td>
                    <td style={{ padding: '15px 24px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {isManager && abs.statut === 'En attente' && (
                          <>
                            <button onClick={() => handleValidation(abs.id, 'Approuvée')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
                              onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                              Approuver
                            </button>
                            <button onClick={() => handleValidation(abs.id, 'Refusée')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                              onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Refuser
                            </button>
                          </>
                        )}
                        <button onClick={() => handleSupprimer(abs)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #E8E4E0', background: '#FAF8F6', color: '#A8A29E', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#FAF8F6'; e.currentTarget.style.color = '#A8A29E'; e.currentTarget.style.borderColor = '#E8E4E0' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          Supprimer
                        </button>
                      </div>
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
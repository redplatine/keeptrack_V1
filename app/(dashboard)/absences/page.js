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

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

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

const statusColors = {
  'En attente': 'bg-orange-50 text-orange-500',
  'Approuvée': 'bg-green-50 text-green-600',
  'Refusée': 'bg-red-50 text-red-500',
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

export default function AbsencesPage() {
  const [absences, setAbsences] = useState([])
  const [employes, setEmployes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [currentEmploye, setCurrentEmploye] = useState(null)
  const [alerteForm, setAlerteForm] = useState(null)

  const [filtreMois, setFiltreMois] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreEmployeId, setFiltreEmployeId] = useState('')

  const [form, setForm] = useState({
    employe_id: '',
    type_absence: 'CP',
    date_debut: '',
    date_fin: '',
    demi_journee: false,
    commentaire_salarie: '',
  })

  const nbJoursCalcule = calculNbJours(form.type_absence, form.date_debut, form.date_fin, form.demi_journee)
  const optionsMois = useMemo(() => genererOptionsMois(), [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: emp } = await supabase
      .from('employes')
      .select('*')
      .eq('email', user.email)
      .single()

    setCurrentEmploye(emp)

    const { data: allEmployes } = await supabase
      .from('employes')
      .select('id, nom, prenom, role')
      .order('nom')
    setEmployes(allEmployes || [])

    let absData = []
    if (emp?.role === 'salarie') {
      const { data } = await supabase
        .from('absences')
        .select('*')
        .eq('employe_id', emp.id)
        .order('date_debut', { ascending: false })
      absData = data || []
    } else {
      const { data } = await supabase
        .from('absences')
        .select('*')
        .order('date_debut', { ascending: false })
      absData = data || []
    }

    const { data: employesData } = await supabase
      .from('employes')
      .select('id, nom, prenom, matricule')
    absData = absData.map(abs => ({
      ...abs,
      employes: employesData?.find(e => e.id === abs.employe_id) || null
    }))

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
    ? ['CP', 'RTT', 'Maladie', 'Absence injustifiée', 'Congé sans solde', 'Événement familial', 'Maternité', 'Paternité']
    : ['CP', 'RTT', 'Maladie', 'Congé sans solde', 'Événement familial', 'Maternité', 'Paternité']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlerteForm(null)

    const statut = ABSENCES_AUTO_APPROUVEES.includes(form.type_absence) ? 'Approuvée' : 'En attente'
    const employe_id = isManager && form.employe_id ? form.employe_id : currentEmploye?.id
    if (!employe_id) { setAlerteForm('Votre profil employé est introuvable.'); return }

    const date_fin_reelle = form.demi_journee ? form.date_debut : form.date_fin

    // Vérification solde suffisant pour CP et RTT
    if (form.type_absence === 'CP' || form.type_absence === 'RTT') {
      const annee = new Date().getFullYear()
      const { data: solde } = await supabase
        .from('soldes_conges')
        .select('*')
        .eq('employe_id', employe_id)
        .eq('annee', annee)
        .single()

      if (solde) {
        if (form.type_absence === 'RTT') {
          if (nbJoursCalcule > (solde.rtt_solde || 0)) {
            setAlerteForm(`Solde RTT insuffisant — Disponible : ${solde.rtt_solde} j, demande : ${nbJoursCalcule} j`)
            return
          }
        } else if (form.type_absence === 'CP') {
          const totalCp = (solde.cp_n1_solde || 0) + (solde.cp_n_solde || 0)
          if (nbJoursCalcule > totalCp) {
            setAlerteForm(`Solde CP insuffisant — Disponible : ${totalCp} j (CP N-1 : ${solde.cp_n1_solde} j + CP N : ${solde.cp_n_solde} j), demande : ${nbJoursCalcule} j`)
            return
          }
        }
      }
    }

    // Vérification chevauchement de dates
    const { data: absExistantes } = await supabase
      .from('absences')
      .select('id, date_debut, date_fin, type_absence')
      .eq('employe_id', employe_id)
      .neq('statut', 'Refusée')

    const chevauchement = absExistantes?.find(abs => {
      const debutExist = abs.date_debut
      const finExist = abs.date_fin || abs.date_debut
      return form.date_debut <= finExist && date_fin_reelle >= debutExist
    })

    if (chevauchement) {
      setAlerteForm(`Chevauchement détecté avec une absence existante (${chevauchement.type_absence} du ${chevauchement.date_debut} au ${chevauchement.date_fin || chevauchement.date_debut})`)
      return
    }

    const { error } = await supabase.from('absences').insert([{
      employe_id,
      type_absence: form.type_absence,
      date_debut: form.date_debut,
      date_fin: date_fin_reelle,
      nb_jours: nbJoursCalcule,
      statut,
      commentaire_salarie: form.commentaire_salarie,
    }])

    if (!error) {
      setShowForm(false)
      setAlerteForm(null)
      setForm({ employe_id: '', type_absence: 'CP', date_debut: '', date_fin: '', demi_journee: false, commentaire_salarie: '' })
      fetchData()
    } else {
      setAlerteForm('Erreur : ' + error.message)
    }
  }

  const handleValidation = async (id, statut) => {
    const abs = absences.find(a => a.id === id)

    if (statut === 'Approuvée' && abs) {
      const annee = new Date().getFullYear()
      const { data: solde } = await supabase
        .from('soldes_conges').select('*')
        .eq('employe_id', abs.employe_id).eq('annee', annee).single()

      if (solde) {
        const nbJours = abs.nb_jours
        if (abs.type_absence === 'RTT') {
          await supabase.from('soldes_conges').update({
            rtt_solde: Math.max(0, (solde.rtt_solde || 0) - nbJours),
            rtt_pris: (solde.rtt_pris || 0) + nbJours,
          }).eq('employe_id', abs.employe_id).eq('annee', annee)
        } else if (abs.type_absence === 'CP') {
          let resteADeduire = nbJours
          let newCpN1Solde = solde.cp_n1_solde || 0
          let newCpNSolde = solde.cp_n_solde || 0
          let newCpN1Pris = solde.cp_n1_pris || 0
          let newCpNPris = solde.cp_n_pris || 0
          if (newCpN1Solde >= resteADeduire) {
            newCpN1Solde -= resteADeduire; newCpN1Pris += resteADeduire; resteADeduire = 0
          } else {
            resteADeduire -= newCpN1Solde; newCpN1Pris += newCpN1Solde; newCpN1Solde = 0
            newCpNSolde = Math.max(0, newCpNSolde - resteADeduire); newCpNPris += resteADeduire
          }
          await supabase.from('soldes_conges').update({
            cp_n1_solde: newCpN1Solde, cp_n1_pris: newCpN1Pris,
            cp_n_solde: newCpNSolde, cp_n_pris: newCpNPris,
          }).eq('employe_id', abs.employe_id).eq('annee', annee)
        }
      }
    }

    await supabase.from('absences').update({ statut }).eq('id', id)

    // Envoi notification email
    if (abs) {
      const { data: empData } = await supabase
        .from('employes')
        .select('email, prenom')
        .eq('id', abs.employe_id)
        .single()

      if (empData?.email) {
        await fetch('/api/notify-absence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailSalarie: empData.email,
            prenomSalarie: empData.prenom,
            typeAbsence: abs.type_absence,
            dateDebut: abs.date_debut,
            dateFin: abs.date_fin || abs.date_debut,
            nbJours: abs.nb_jours,
            statut,
          }),
        })
      }
    }

    fetchData()
  }

  const handleSupprimer = async (abs) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer cette absence de ${abs.nb_jours}j (${abs.type_absence}) ? Cette action est irréversible.`
    )
    if (!confirmation) return

    if (abs.statut === 'Approuvée') {
      const annee = new Date().getFullYear()
      const { data: solde } = await supabase
        .from('soldes_conges').select('*')
        .eq('employe_id', abs.employe_id).eq('annee', annee).single()

      if (solde) {
        const nbJours = abs.nb_jours
        if (abs.type_absence === 'RTT') {
          await supabase.from('soldes_conges').update({
            rtt_solde: (solde.rtt_solde || 0) + nbJours,
            rtt_pris: Math.max(0, (solde.rtt_pris || 0) - nbJours),
          }).eq('employe_id', abs.employe_id).eq('annee', annee)
        } else if (abs.type_absence === 'CP') {
          let resteARecréditer = nbJours
          let newCpNSolde = solde.cp_n_solde || 0
          let newCpN1Solde = solde.cp_n1_solde || 0
          let newCpNPris = solde.cp_n_pris || 0
          let newCpN1Pris = solde.cp_n1_pris || 0
          const cpNPrisDisponible = Math.min(newCpNPris, resteARecréditer)
          newCpNSolde += cpNPrisDisponible; newCpNPris -= cpNPrisDisponible; resteARecréditer -= cpNPrisDisponible
          if (resteARecréditer > 0) {
            newCpN1Solde += resteARecréditer
            newCpN1Pris = Math.max(0, newCpN1Pris - resteARecréditer)
          }
          await supabase.from('soldes_conges').update({
            cp_n_solde: newCpNSolde, cp_n_pris: newCpNPris,
            cp_n1_solde: newCpN1Solde, cp_n1_pris: newCpN1Pris,
          }).eq('employe_id', abs.employe_id).eq('annee', annee)
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
    ws['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 30 }
    ]
    const suffixe = filtreMois
      ? `_${optionsMois.find(o => o.value === filtreMois)?.label.replace(' ', '_')}`
      : `_${new Date().toISOString().split('T')[0]}`
    XLSX.writeFile(wb, `absences${suffixe}.xlsx`)
  }

  const nbFiltresActifs = [filtreMois, filtreStatut, filtreEmployeId].filter(Boolean).length

  return (
    <div className="p-8">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Absences</h1>
          <p className="text-gray-500">
            {absencesFiltrees.length} demande(s)
            {nbFiltresActifs > 0 && <span className="text-blue-500 ml-1">(filtrées)</span>}
          </p>
        </div>
        <div className="flex gap-3">
          {isManager && (
            <button onClick={handleExportExcel}
              className="bg-green-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-green-700 transition">
              📊 Exporter Excel
            </button>
          )}
          <button onClick={() => { setShowForm(!showForm); setAlerteForm(null) }}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700 transition">
            + Nouvelle demande
          </button>
        </div>
      </div>

      {/* FILTRES */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mois</label>
            <select value={filtreMois} onChange={e => setFiltreMois(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les mois</option>
              {optionsMois.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="Approuvée">Approuvée</option>
              <option value="Refusée">Refusée</option>
            </select>
          </div>
          {isManager && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Employé</label>
              <select value={filtreEmployeId} onChange={e => setFiltreEmployeId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tous les employés</option>
                {employes.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>
                ))}
              </select>
            </div>
          )}
          {nbFiltresActifs > 0 && (
            <button
              onClick={() => { setFiltreMois(''); setFiltreStatut(''); setFiltreEmployeId('') }}
              className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition">
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* FORMULAIRE */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Nouvelle demande d'absence</h2>

          {alerteForm && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              ⚠️ {alerteForm}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

            {isManager && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employé concerné</label>
                <select required value={form.employe_id} onChange={e => setForm({...form, employe_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Sélectionner un employé --</option>
                  {employes.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'absence</label>
              <select value={form.type_absence} onChange={e => setForm({...form, type_absence: e.target.value, demi_journee: false})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {typesDisponibles.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <input type="checkbox" id="demi_journee" checked={form.demi_journee}
                onChange={e => setForm({...form, demi_journee: e.target.checked, date_fin: ''})}
                className="w-4 h-4 accent-blue-600" />
              <label htmlFor="demi_journee" className="text-sm font-medium text-gray-700">Demi-journée</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.demi_journee ? 'Date' : 'Date de début'}
              </label>
              <input required type="date" value={form.date_debut} onChange={e => setForm({...form, date_debut: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {!form.demi_journee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                <input required type="date" value={form.date_fin} min={form.date_debut}
                  onChange={e => setForm({...form, date_fin: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}

            {(form.date_debut && (form.date_fin || form.demi_journee)) && (
              <div className="col-span-2 bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-blue-600 font-bold text-xl">{nbJoursCalcule}</span>
                <span className="text-blue-700 text-sm">
                  jour(s) {form.demi_journee ? '' : ABSENCES_CALENDAIRE.includes(form.type_absence) ? 'calendaires' : 'ouvrés'}
                  {ABSENCES_AUTO_APPROUVEES.includes(form.type_absence) && (
                    <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">Approuvée automatiquement</span>
                  )}
                </span>
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</label>
              <textarea value={form.commentaire_salarie} onChange={e => setForm({...form, commentaire_salarie: e.target.value})}
                rows={2} placeholder="Précisez si nécessaire..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="col-span-2 flex gap-3">
              <button type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition">
                Envoyer la demande
              </button>
              <button type="button" onClick={() => { setShowForm(false); setAlerteForm(null) }}
                className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-medium hover:bg-gray-200 transition">
                Annuler
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TABLEAU */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : absencesFiltrees.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucune absence pour cette période.</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Employé</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Période</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Jours</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Statut</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {absencesFiltrees.map((abs) => (
                <tr key={abs.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {abs.employes?.prenom} {abs.employes?.nom}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{abs.type_absence}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {abs.nb_jours === 0.5 ? (
                      <span>{abs.date_debut} <span className="text-blue-500">(½ journée)</span></span>
                    ) : (
                      <span>{abs.date_debut} → {abs.date_fin}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">{abs.nb_jours}j</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[abs.statut]}`}>
                      {abs.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {isManager && abs.statut === 'En attente' && (
                        <>
                          <button onClick={() => handleValidation(abs.id, 'Approuvée')}
                            className="bg-green-50 text-green-600 text-xs px-3 py-1 rounded-lg hover:bg-green-100 transition font-medium">
                            ✓ Approuver
                          </button>
                          <button onClick={() => handleValidation(abs.id, 'Refusée')}
                            className="bg-red-50 text-red-500 text-xs px-3 py-1 rounded-lg hover:bg-red-100 transition font-medium">
                            ✗ Refuser
                          </button>
                        </>
                      )}
                      <button onClick={() => handleSupprimer(abs)}
                        className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-lg hover:bg-gray-200 transition font-medium">
                        🗑️ Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
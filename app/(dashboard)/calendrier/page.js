'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const COULEURS_TYPE = {
  'CP': 'bg-blue-500',
  'RTT': 'bg-green-500',
  'Maladie': 'bg-red-400',
  'Absence injustifiée': 'bg-gray-500',
  'Congé sans solde': 'bg-yellow-500',
  'Événement familial': 'bg-purple-500',
  'Maternité': 'bg-pink-400',
  'Paternité': 'bg-indigo-400',
}

const COULEURS_STATUT = {
  'En attente': 'opacity-60 border-2 border-dashed',
  'Approuvée': 'opacity-100',
  'Refusée': 'opacity-30 line-through',
}

export default function CalendrierPage() {
  const [absences, setAbsences] = useState([])
  const [employe, setEmploye] = useState(null)
  const [moisActuel, setMoisActuel] = useState(new Date())
  const [loading, setLoading] = useState(true)

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
    setEmploye(emp)

    // Fetch absences sans jointure
    let absData = []
    if (emp.role === 'salarie') {
      const { data } = await supabase
        .from('absences')
        .select('*')
        .eq('employe_id', emp.id)
        .neq('statut', 'Refusée')
      absData = data || []
    } else {
      const { data } = await supabase
        .from('absences')
        .select('*')
        .neq('statut', 'Refusée')
      absData = data || []
    }

    // Enrichir avec les noms des employés
    const { data: employesData } = await supabase.from('employes').select('id, nom, prenom')
    absData = absData.map(abs => ({
      ...abs,
      employes: employesData?.find(e => e.id === abs.employe_id) || null
    }))

    setAbsences(absData)
    setLoading(false)
  }

  const annee = moisActuel.getFullYear()
  const mois = moisActuel.getMonth()

  const premierJour = new Date(annee, mois, 1)
  const dernierJour = new Date(annee, mois + 1, 0)

  let debutSemaine = premierJour.getDay() - 1
  if (debutSemaine < 0) debutSemaine = 6

  const jours = []
  for (let i = 0; i < debutSemaine; i++) {
    jours.push(null)
  }
  for (let i = 1; i <= dernierJour.getDate(); i++) {
    jours.push(new Date(annee, mois, i))
  }

  const getAbsencesDuJour = (jour) => {
    if (!jour) return []
    return absences.filter(abs => {
      const debut = new Date(abs.date_debut)
      const fin = new Date(abs.date_fin || abs.date_debut)
      debut.setHours(0, 0, 0, 0)
      fin.setHours(23, 59, 59, 999)
      const jourCopy = new Date(jour)
      jourCopy.setHours(12, 0, 0, 0)
      return jourCopy >= debut && jourCopy <= fin
    })
  }

  const moisPrecedent = () => setMoisActuel(new Date(annee, mois - 1, 1))
  const moisSuivant = () => setMoisActuel(new Date(annee, mois + 1, 1))

  const nomMois = moisActuel.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const isAujourdhui = (jour) => {
    if (!jour) return false
    const today = new Date()
    return jour.getDate() === today.getDate() &&
      jour.getMonth() === today.getMonth() &&
      jour.getFullYear() === today.getFullYear()
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Calendrier</h1>
          <p className="text-gray-500">
            {employe?.role === 'salarie' ? 'Vos absences' : "Absences de l'équipe"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={moisPrecedent}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition text-gray-600 font-bold">
            ‹
          </button>
          <span className="text-base font-semibold text-gray-800 capitalize w-40 text-center">
            {nomMois}
          </span>
          <button onClick={moisSuivant}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition text-gray-600 font-bold">
            ›
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(COULEURS_TYPE).map(([type, couleur]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${couleur}`}></div>
            <span className="text-xs text-gray-500">{type}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          <div className="w-3 h-3 rounded-full bg-blue-400 opacity-60"></div>
          <span className="text-xs text-gray-500">En attente</span>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* En-têtes jours */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(j => (
            <div key={j} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {j}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7">
          {jours.map((jour, index) => {
            const absencesDuJour = getAbsencesDuJour(jour)
            const estWeekend = jour && (jour.getDay() === 0 || jour.getDay() === 6)

            return (
              <div key={index}
                className={`min-h-24 p-2 border-b border-r border-gray-50 ${
                  !jour ? 'bg-gray-50' : estWeekend ? 'bg-gray-50/50' : 'bg-white'
                } ${isAujourdhui(jour) ? 'ring-2 ring-inset ring-blue-500' : ''}`}>

                {jour && (
                  <>
                    <span className={`text-sm font-medium ${
                      isAujourdhui(jour) ? 'text-blue-600' :
                      estWeekend ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {jour.getDate()}
                    </span>

                    <div className="mt-1 space-y-1">
                      {absencesDuJour.slice(0, 3).map((abs, i) => (
                        <div key={i}
                          title={`${abs.employes?.prenom} ${abs.employes?.nom} — ${abs.type_absence} (${abs.statut})`}
                          className={`text-xs text-white px-1 py-0.5 rounded truncate cursor-default
                            ${COULEURS_TYPE[abs.type_absence] || 'bg-gray-400'}
                            ${COULEURS_STATUT[abs.statut] || ''}
                          `}>
                          {employe?.role !== 'salarie'
                            ? abs.employes?.prenom
                            : abs.type_absence}
                        </div>
                      ))}
                      {absencesDuJour.length > 3 && (
                        <div className="text-xs text-gray-400 pl-1">
                          +{absencesDuJour.length - 3}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

      </div>

    </div>
  )
}
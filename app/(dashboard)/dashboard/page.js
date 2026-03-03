'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function DashboardPage() {
  const [soldes, setSoldes] = useState(null)
  const [employe, setEmploye] = useState(null)
  const [equipe, setEquipe] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: emp } = await supabase
      .from('employes')
      .select('*')
      .eq('email', user.email)
      .single()
    setEmploye(emp)

    if (emp) {
      const annee = new Date().getFullYear()
      const isManager = emp.role === 'manager' || emp.role === 'admin'

      if (isManager) {
        const { data: employes } = await supabase
          .from('employes')
          .select('id, nom, prenom, poste, matricule')
          .order('nom')

        const { data: tousLesSoldes } = await supabase
          .from('soldes_conges')
          .select('*')
          .eq('annee', annee)

        const { data: absEnAttente } = await supabase
          .from('absences')
          .select('employe_id')
          .eq('statut', 'En attente')

        const equipeData = (employes || []).map(e => {
          const solde = tousLesSoldes?.find(s => s.employe_id === e.id)
          const demandesEnAttente = absEnAttente?.filter(a => a.employe_id === e.id).length || 0
          // Génération URL avatar
          const { data: avatarData } = supabase.storage
            .from('avatars')
            .getPublicUrl(`${e.id}/avatar`)
          return { ...e, solde, demandesEnAttente, avatarUrl: avatarData.publicUrl }
        })

        setEquipe(equipeData)

      } else {
        const { data: soldesData } = await supabase
          .from('soldes_conges')
          .select('*')
          .eq('employe_id', emp.id)
          .eq('annee', annee)
          .single()
        setSoldes(soldesData)
      }
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Chargement...</div>
  }

  const isManager = employe?.role === 'manager' || employe?.role === 'admin'

  return (
    <div className="p-8">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Bonjour {employe?.prenom} 👋
        </h1>
        <p className="text-gray-500">
          {isManager ? "Espace manager — vue d'ensemble de votre équipe" : 'Votre espace personnel'}
        </p>
      </div>

      {/* VUE MANAGER / ADMIN */}
      {isManager && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Compteurs de l'équipe — {new Date().getFullYear()}</h2>
            <p className="text-sm text-gray-400">{equipe.length} salarié(s)</p>
          </div>
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Matricule</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Salarié</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Poste</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-blue-500">CP N-1</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-indigo-500">CP N</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-green-500">RTT</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-orange-500">Demandes à valider</th>
              </tr>
            </thead>
            <tbody>
              {equipe.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.matricule || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={emp.avatarUrl}
                          alt={`${emp.prenom} ${emp.nom}`}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                        />
                        <span className="text-gray-400 text-xs hidden items-center justify-center w-full h-full">
                          {emp.prenom?.[0]}{emp.nom?.[0]}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">{emp.prenom} {emp.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.poste || '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {emp.solde?.cp_n1_solde ?? emp.solde?.cp_n1_force ?? '—'}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">j</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-indigo-600 font-bold text-lg">
                      {emp.solde?.cp_n_solde ?? emp.solde?.cp_n_force ?? '—'}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">j</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-bold text-lg">
                      {emp.solde?.rtt_solde ?? emp.solde?.rtt_force ?? '—'}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">j</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {emp.demandesEnAttente > 0 ? (
                      <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                        {emp.demandesEnAttente} en attente
                      </span>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VUE SALARIÉ */}
      {!isManager && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">CP N-1 restants</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {soldes?.cp_n1_solde ?? soldes?.cp_n1_force ?? '—'}
            </p>
            <div className="mt-3 text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Acquis</span>
                <span className="font-medium text-gray-600">{soldes?.cp_n1_acquis ?? '—'} j</span>
              </div>
              <div className="flex justify-between">
                <span>Pris</span>
                <span className="font-medium text-gray-600">{soldes?.cp_n1_pris ?? '—'} j</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">CP N restants</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">
              {soldes?.cp_n_solde ?? soldes?.cp_n_force ?? '—'}
            </p>
            <div className="mt-3 text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Acquis</span>
                <span className="font-medium text-gray-600">{soldes?.cp_n_acquis ?? '—'} j</span>
              </div>
              <div className="flex justify-between">
                <span>Pris</span>
                <span className="font-medium text-gray-600">{soldes?.cp_n_pris ?? '—'} j</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">RTT restants</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {soldes?.rtt_solde ?? soldes?.rtt_force ?? '—'}
            </p>
            <div className="mt-3 text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Acquis</span>
                <span className="font-medium text-gray-600">{soldes?.rtt_acquis ?? '—'} j</span>
              </div>
              <div className="flex justify-between">
                <span>Pris</span>
                <span className="font-medium text-gray-600">{soldes?.rtt_pris ?? '—'} j</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
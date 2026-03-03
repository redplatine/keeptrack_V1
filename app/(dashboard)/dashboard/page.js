'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function StatCard({ label, value, acquis, pris, gradient, icon }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6" style={{
      background: 'white',
      boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
      border: '1px solid rgba(37,99,235,0.08)'
    }}>
      {/* Cercle décoratif */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10" style={{ background: gradient }} />
      <div className="absolute -bottom-4 -right-2 w-16 h-16 rounded-full opacity-5" style={{ background: gradient }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
            style={{ background: gradient, boxShadow: `0 4px 12px rgba(37,99,235,0.3)` }}>
            {icon}
          </div>
        </div>

        <p className="text-4xl font-bold mb-1" style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {value ?? '—'}
          <span className="text-lg ml-1" style={{ WebkitTextFillColor: '#9ca3af' }}>j</span>
        </p>

        <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-400 mb-0.5">Acquis</p>
            <p className="text-sm font-bold text-gray-700">{acquis ?? '—'} j</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-400 mb-0.5">Pris</p>
            <p className="text-sm font-bold text-gray-700">{pris ?? '—'} j</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [soldes, setSoldes] = useState(null)
  const [employe, setEmploye] = useState(null)
  const [equipe, setEquipe] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboard() }, [])

  const fetchDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: emp } = await supabase.from('employes').select('*').eq('email', user.email).single()
    setEmploye(emp)

    if (emp) {
      const annee = new Date().getFullYear()
      const isManager = emp.role === 'manager' || emp.role === 'admin'

      if (isManager) {
        const { data: employes } = await supabase.from('employes')
          .select('id, nom, prenom, poste, matricule').order('nom')
        const { data: tousLesSoldes } = await supabase.from('soldes_conges')
          .select('*').eq('annee', annee)
        const { data: absEnAttente } = await supabase.from('absences')
          .select('employe_id').eq('statut', 'En attente')

        const equipeData = (employes || []).map(e => {
          const solde = tousLesSoldes?.find(s => s.employe_id === e.id)
          const demandesEnAttente = absEnAttente?.filter(a => a.employe_id === e.id).length || 0
          const { data: avatarData } = supabase.storage.from('avatars').getPublicUrl(`${e.id}/avatar`)
          return { ...e, solde, demandesEnAttente, avatarUrl: avatarData.publicUrl }
        })
        setEquipe(equipeData)
      } else {
        const { data: soldesData } = await supabase.from('soldes_conges').select('*')
          .eq('employe_id', emp.id).eq('annee', annee).single()
        setSoldes(soldesData)
      }
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-gray-400 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  const isManager = employe?.role === 'manager' || employe?.role === 'admin'
  const heure = new Date().getHours()
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>
            {employe?.prenom?.[0]}{employe?.nom?.[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {salutation}, {employe?.prenom} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {isManager ? `Vue d'ensemble de votre équipe · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : `Votre espace personnel · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
          </div>
        </div>
      </div>

      {/* VUE MANAGER / ADMIN */}
      {isManager && (
        <div>
          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}>
              <p className="text-blue-100 text-sm mb-1">Salariés</p>
              <p className="text-4xl font-bold">{equipe.length}</p>
            </div>
            <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
              <p className="text-amber-100 text-sm mb-1">Demandes en attente</p>
              <p className="text-4xl font-bold">{equipe.reduce((acc, e) => acc + e.demandesEnAttente, 0)}</p>
            </div>
            <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
              <p className="text-emerald-100 text-sm mb-1">Année en cours</p>
              <p className="text-4xl font-bold">{new Date().getFullYear()}</p>
            </div>
          </div>

          {/* Tableau équipe */}
          <div className="rounded-2xl overflow-hidden" style={{
            background: 'white',
            boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
            border: '1px solid rgba(37,99,235,0.08)'
          }}>
            <div className="px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="font-bold text-gray-800 text-lg">Compteurs de l'équipe</h2>
              <p className="text-sm text-gray-400">{equipe.length} salarié(s) · {new Date().getFullYear()}</p>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8faff' }}>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Matricule</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Salarié</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Poste</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b82f6' }}>CP N-1</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6366f1' }}>CP N</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#10b981' }}>RTT</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#f59e0b' }}>À valider</th>
                </tr>
              </thead>
              <tbody>
                {equipe.map((emp, i) => (
                  <tr key={emp.id} className="transition-colors duration-100"
                    style={{ borderTop: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-semibold px-2 py-1 rounded-lg" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        {emp.matricule || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
                          <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                          <span className="text-white text-xs font-bold hidden items-center justify-center w-full h-full">
                            {emp.prenom?.[0]}{emp.nom?.[0]}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-800">{emp.prenom} {emp.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{emp.poste || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold text-sm"
                        style={{ background: '#eff6ff', color: '#2563eb' }}>
                        {emp.solde?.cp_n1_solde ?? emp.solde?.cp_n1_force ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold text-sm"
                        style={{ background: '#eef2ff', color: '#4f46e5' }}>
                        {emp.solde?.cp_n_solde ?? emp.solde?.cp_n_force ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold text-sm"
                        style={{ background: '#ecfdf5', color: '#059669' }}>
                        {emp.solde?.rtt_solde ?? emp.solde?.rtt_force ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {emp.demandesEnAttente > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: '#fff7ed', color: '#d97706' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          {emp.demandesEnAttente} en attente
                        </span>
                      ) : (
                        <span className="text-gray-200 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VUE SALARIÉ */}
      {!isManager && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="CP N-1 restants"
            value={soldes?.cp_n1_solde ?? soldes?.cp_n1_force}
            acquis={soldes?.cp_n1_acquis}
            pris={soldes?.cp_n1_pris}
            gradient="linear-gradient(135deg, #2563eb, #3b82f6)"
            icon="📅"
          />
          <StatCard
            label="CP N restants"
            value={soldes?.cp_n_solde ?? soldes?.cp_n_force}
            acquis={soldes?.cp_n_acquis}
            pris={soldes?.cp_n_pris}
            gradient="linear-gradient(135deg, #4f46e5, #818cf8)"
            icon="🗓️"
          />
          <StatCard
            label="RTT restants"
            value={soldes?.rtt_solde ?? soldes?.rtt_force}
            acquis={soldes?.rtt_acquis}
            pris={soldes?.rtt_pris}
            gradient="linear-gradient(135deg, #059669, #34d399)"
            icon="✨"
          />
        </div>
      )}
    </div>
  )
}
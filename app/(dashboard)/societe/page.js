'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function SocietePage() {
  const [societe, setSociete] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    raison_sociale: '',
    numero_voie: '',
    nom_rue: '',
    code_postal: '',
    ville: '',
    siret: '',
    code_naf: ''
  })
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: emp } = await supabase
      .from('employes')
      .select('role')
      .eq('email', user.email)
      .single()
    setRole(emp?.role)

    const { data: soc } = await supabase
      .from('societe')
      .select('*')
      .single()
    setSociete(soc)
    if (soc) {
      setForm({
        raison_sociale: soc.raison_sociale || '',
        numero_voie: soc.numero_voie || '',
        nom_rue: soc.nom_rue || '',
        code_postal: soc.code_postal || '',
        ville: soc.ville || '',
        siret: soc.siret || '',
        code_naf: soc.code_naf || ''
      })
    }
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    await supabase.from('societe').update(form).eq('id', societe.id)
    setSociete({ ...societe, ...form })
    setEditing(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <div className="p-8 max-w-3xl">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Société</h1>
          <p className="text-gray-500">Informations de votre entreprise</p>
        </div>
        {role === 'admin' && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            ✏️ Modifier
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg mb-6">
          ✅ Informations enregistrées avec succès !
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

        {!editing ? (
          <div className="grid grid-cols-2 gap-6">
            <InfoField label="Raison sociale" value={societe?.raison_sociale} />
            <InfoField label="SIRET" value={societe?.siret} />
            <InfoField label="Code NAF" value={societe?.code_naf} />
            <InfoField label="Adresse" value={
              [societe?.numero_voie, societe?.nom_rue, societe?.code_postal, societe?.ville]
                .filter(Boolean).join(' ') || null
            } />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale</label>
              <input value={form.raison_sociale} onChange={e => setForm({...form, raison_sociale: e.target.value})}
                placeholder="Ex: KeepTrack SAS"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de voie</label>
                <input value={form.numero_voie} onChange={e => setForm({...form, numero_voie: e.target.value})}
                  placeholder="Ex: 12"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de rue</label>
                <input value={form.nom_rue} onChange={e => setForm({...form, nom_rue: e.target.value})}
                  placeholder="Ex: Rue de la Paix"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                <input value={form.code_postal} onChange={e => setForm({...form, code_postal: e.target.value})}
                  placeholder="Ex: 75001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}
                placeholder="Ex: Paris"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                <input value={form.siret} onChange={e => setForm({...form, siret: e.target.value})}
                  placeholder="Ex: 123 456 789 00010"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code NAF</label>
                <input value={form.code_naf} onChange={e => setForm({...form, code_naf: e.target.value})}
                  placeholder="Ex: 6201Z"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition">
                Enregistrer
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-medium hover:bg-gray-200 transition">
                Annuler
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  )
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  )
}
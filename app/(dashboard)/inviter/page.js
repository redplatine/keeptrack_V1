'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function InviterPage() {
  const router = useRouter()
  const [etape, setEtape] = useState(1)
  const [employeId, setEmployeId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [invite, setInvite] = useState({
    email: '', nom: '', prenom: '', role: 'salarie'
  })

  const [fiche, setFiche] = useState({
    matricule: '', date_naissance: '', numero_voie: '', nom_rue: '',
    code_postal: '', ville: '', poste: '', departement: '',
    date_entree: '', type_contrat: 'CDI', statut: 'Non-cadre',
    temps_travail: 'Temps plein', rtt_annuel: 0, salaire_brut: ''
  })

  // Étape 1 — Invitation
  const handleInviter = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

const res = await fetch('/api/inviter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: invite.email })
})

const result = await res.json()

if (result.error) {
  setError('Erreur : ' + result.error)
  setLoading(false)
  return
}

    const { data: emp, error: empError } = await supabase
      .from('employes')
      .insert([{
        nom: invite.nom,
        prenom: invite.prenom,
        email: invite.email,
        role: invite.role,
        date_entree: new Date().toISOString().split('T')[0],
        type_contrat: 'CDI',
        statut: 'Non-cadre',
        temps_travail: 'Temps plein',
      }])
      .select()
      .single()

    if (empError) {
      setError('Erreur fiche employé : ' + empError.message)
      setLoading(false)
      return
    }

    setEmployeId(emp.id)
    setEtape(2)
    setLoading(false)
  }

  // Étape 2 — Complétion fiche
  const handleFiche = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('employes')
      .update(fiche)
      .eq('id', employeId)

    if (error) {
      setError('Erreur : ' + error.message)
      setLoading(false)
      return
    }

    // Créer le solde initial
    await supabase.from('soldes_conges').insert([{
      employe_id: employeId,
      annee: new Date().getFullYear(),
      cp_n1_acquis: 0, cp_n1_pris: 0, cp_n1_solde: 0,
      cp_n_acquis: 0, cp_n_pris: 0, cp_n_solde: 0,
      rtt_acquis: 0, rtt_pris: 0, rtt_solde: 0,
    }])

    // Lancer le calcul automatique
    await supabase.rpc('calculer_acquisitions')

    router.push('/employes')
  }

  return (
    <div className="p-8 max-w-3xl">

      {/* Header avec étapes */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Inviter un employé</h1>
        <div className="flex items-center gap-3 mt-4">
          <div className={`flex items-center gap-2 text-sm font-medium ${etape === 1 ? 'text-blue-600' : 'text-green-600'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${etape === 1 ? 'bg-blue-600' : 'bg-green-500'}`}>
              {etape === 1 ? '1' : '✓'}
            </span>
            Invitation
          </div>
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className={`flex items-center gap-2 text-sm font-medium ${etape === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${etape === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}>
              2
            </span>
            Fiche salarié
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

        {/* ÉTAPE 1 */}
        {etape === 1 && (
          <form onSubmit={handleInviter} className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Informations de connexion</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input required value={invite.nom} onChange={e => setInvite({...invite, nom: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input required value={invite.prenom} onChange={e => setInvite({...invite, prenom: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" value={invite.email} onChange={e => setInvite({...invite, email: e.target.value})}
                placeholder="salarié@entreprise.fr"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select value={invite.role} onChange={e => setInvite({...invite, role: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="salarie">Salarié</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Envoi...' : '📧 Envoyer l\'invitation et continuer →'}
            </button>
          </form>
        )}

        {/* ÉTAPE 2 */}
        {etape === 2 && (
          <form onSubmit={handleFiche} className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800 mb-2">Compléter la fiche salarié</h2>
            <p className="text-sm text-gray-400 mb-4">Ces informations pourront être modifiées ultérieurement.</p>

            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Informations personnelles</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
                <input value={fiche.matricule} onChange={e => setFiche({...fiche, matricule: e.target.value})}
                  placeholder="Ex: MAT001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input type="date" value={fiche.date_naissance} onChange={e => setFiche({...fiche, date_naissance: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-2 mb-1">Adresse</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de voie</label>
                <input value={fiche.numero_voie} onChange={e => setFiche({...fiche, numero_voie: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de rue</label>
                <input value={fiche.nom_rue} onChange={e => setFiche({...fiche, nom_rue: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                <input value={fiche.code_postal} onChange={e => setFiche({...fiche, code_postal: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input value={fiche.ville} onChange={e => setFiche({...fiche, ville: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-2 mb-1">Contrat & Rémunération</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                <input value={fiche.poste} onChange={e => setFiche({...fiche, poste: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                <input value={fiche.departement} onChange={e => setFiche({...fiche, departement: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'entrée</label>
                <input required type="date" value={fiche.date_entree} onChange={e => setFiche({...fiche, date_entree: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
                <select value={fiche.type_contrat} onChange={e => setFiche({...fiche, type_contrat: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>CDI</option>
                  <option>CDD</option>
                  <option>Alternance</option>
                  <option>Stage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select value={fiche.statut} onChange={e => setFiche({...fiche, statut: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Cadre</option>
                  <option>Non-cadre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temps de travail</label>
                <select value={fiche.temps_travail} onChange={e => setFiche({...fiche, temps_travail: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Temps plein</option>
                  <option>Temps partiel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RTT annuel</label>
                <input type="number" value={fiche.rtt_annuel} onChange={e => setFiche({...fiche, rtt_annuel: e.target.value})}
                  placeholder="0 si pas de RTT"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salaire brut annuel (€)</label>
                <input type="number" value={fiche.salaire_brut} onChange={e => setFiche({...fiche, salaire_brut: e.target.value})}
                  placeholder="Ex: 35000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {loading ? 'Enregistrement...' : '✅ Enregistrer la fiche'}
              </button>
              <button type="button" onClick={() => router.push('/employes')}
                className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-medium hover:bg-gray-200 transition">
                Passer
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function getAvatarUrl(id) {
  const { data } = supabase.storage.from('avatars').getPublicUrl(`${id}/avatar`)
  return data.publicUrl
}

function Avatar({ id, prenom, nom }) {
  const [error, setError] = useState(false)
  const url = getAvatarUrl(id)

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
      {!error ? (
        <img
          src={`${url}?t=${id}`}
          alt={`${prenom} ${nom}`}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span className="text-gray-400 text-xs font-medium">
          {prenom?.[0]}{nom?.[0]}
        </span>
      )}
    </div>
  )
}

export default function EmployesPage() {
  const [employes, setEmployes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [employeSelectionne, setEmployeSelectionne] = useState(null)
  const [invitationEnvoyee, setInvitationEnvoyee] = useState(false)
  const [invitationLoading, setInvitationLoading] = useState(false)
  const [form, setForm] = useState({
    matricule: '', nom: '', prenom: '', email: '', poste: '',
    departement: '', type_contrat: 'CDI', statut: 'Non-cadre',
    temps_travail: 'Temps plein', date_entree: '', salaire_brut: '',
    numero_voie: '', nom_rue: '', code_postal: '', ville: '',
    date_naissance: '', rtt_annuel: 0,
    cp_n1_force: 0, cp_n_force: 0, rtt_force: 0,
  })

  useEffect(() => {
    fetchEmployes()
  }, [])

  const fetchEmployes = async () => {
    const { data, error } = await supabase
      .from('employes')
      .select('*')
      .order('nom')
    if (!error) setEmployes(data)
    setLoading(false)
  }

  const resetForm = () => {
    setForm({
      matricule: '', nom: '', prenom: '', email: '', poste: '',
      departement: '', type_contrat: 'CDI', statut: 'Non-cadre',
      temps_travail: 'Temps plein', date_entree: '', salaire_brut: '',
      numero_voie: '', nom_rue: '', code_postal: '', ville: '',
      date_naissance: '', rtt_annuel: 0,
      cp_n1_force: 0, cp_n_force: 0, rtt_force: 0,
    })
  }

  const handleEnvoyerInvitation = async () => {
    if (!form.email) return
    setInvitationLoading(true)
    const response = await fetch('/api/inviter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      matricule: form.matricule || null,
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      poste: form.poste || null,
      departement: form.departement || null,
      type_contrat: form.type_contrat,
      statut: form.statut,
      temps_travail: form.temps_travail,
      date_entree: form.date_entree || null,
      salaire_brut: form.salaire_brut || null,
      numero_voie: form.numero_voie || null,
      nom_rue: form.nom_rue || null,
      code_postal: form.code_postal || null,
      ville: form.ville || null,
      date_naissance: form.date_naissance || null,
      rtt_annuel: form.rtt_annuel || 0,
    }

    const cp_n1 = parseFloat(form.cp_n1_force) || 0
    const cp_n = parseFloat(form.cp_n_force) || 0
    const rtt = parseFloat(form.rtt_force) || 0
    const annee = new Date().getFullYear()

    if (employeSelectionne) {
      const { error } = await supabase
        .from('employes')
        .update(formNettoye)
        .eq('id', employeSelectionne.id)
      if (error) { alert('Erreur modification : ' + error.message); return }

      if (
        form.date_entree !== employeSelectionne.date_entree ||
        parseFloat(form.rtt_annuel) !== parseFloat(employeSelectionne.rtt_annuel)
      ) {
        await supabase.rpc('calculer_acquisitions')
      }

      if (cp_n1 > 0 || cp_n > 0 || rtt > 0) {
        const { data: existingSolde } = await supabase
          .from('soldes_conges').select('*')
          .eq('employe_id', employeSelectionne.id).eq('annee', annee).single()

        if (existingSolde) {
          await supabase.from('soldes_conges').update({
            cp_n1_acquis: (existingSolde.cp_n1_acquis || 0) + cp_n1,
            cp_n1_solde: (existingSolde.cp_n1_solde || 0) + cp_n1,
            cp_n_acquis: (existingSolde.cp_n_acquis || 0) + cp_n,
            cp_n_solde: (existingSolde.cp_n_solde || 0) + cp_n,
            rtt_acquis: (existingSolde.rtt_acquis || 0) + rtt,
            rtt_solde: (existingSolde.rtt_solde || 0) + rtt,
            cp_n1_force: cp_n1, cp_n_force: cp_n, rtt_force: rtt,
          }).eq('employe_id', employeSelectionne.id).eq('annee', annee)
        } else {
          await supabase.from('soldes_conges').insert({
            employe_id: employeSelectionne.id, annee,
            cp_n1_acquis: cp_n1, cp_n1_solde: cp_n1,
            cp_n_acquis: cp_n, cp_n_solde: cp_n,
            rtt_acquis: rtt, rtt_solde: rtt,
            cp_n1_force: cp_n1, cp_n_force: cp_n, rtt_force: rtt,
          })
        }
      }
    } else {
      const { data: newEmp, error } = await supabase
        .from('employes').insert([formNettoye]).select().single()
      if (error) { alert('Erreur création : ' + error.message); return }

      await supabase.rpc('calculer_acquisitions')

      if (cp_n1 > 0 || cp_n > 0 || rtt > 0) {
        const { data: existingSolde } = await supabase
          .from('soldes_conges').select('*')
          .eq('employe_id', newEmp.id).eq('annee', annee).single()

        if (existingSolde) {
          await supabase.from('soldes_conges').update({
            cp_n1_acquis: (existingSolde.cp_n1_acquis || 0) + cp_n1,
            cp_n1_solde: (existingSolde.cp_n1_solde || 0) + cp_n1,
            cp_n_acquis: (existingSolde.cp_n_acquis || 0) + cp_n,
            cp_n_solde: (existingSolde.cp_n_solde || 0) + cp_n,
            rtt_acquis: (existingSolde.rtt_acquis || 0) + rtt,
            rtt_solde: (existingSolde.rtt_solde || 0) + rtt,
            cp_n1_force: cp_n1, cp_n_force: cp_n, rtt_force: rtt,
          }).eq('employe_id', newEmp.id).eq('annee', annee)
        } else {
          await supabase.from('soldes_conges').insert({
            employe_id: newEmp.id, annee,
            cp_n1_acquis: cp_n1, cp_n1_solde: cp_n1,
            cp_n_acquis: cp_n, cp_n_solde: cp_n,
            rtt_acquis: rtt, rtt_solde: rtt,
            cp_n1_force: cp_n1, cp_n_force: cp_n, rtt_force: rtt,
          })
        }
      }
    }

    setShowForm(false)
    setEmployeSelectionne(null)
    setInvitationEnvoyee(false)
    resetForm()
    fetchEmployes()
  }

  const handleDoubleClick = (emp) => {
    setEmployeSelectionne(emp)
    setInvitationEnvoyee(false)
    setForm({
      matricule: emp.matricule || '',
      nom: emp.nom || '',
      prenom: emp.prenom || '',
      email: emp.email || '',
      poste: emp.poste || '',
      departement: emp.departement || '',
      type_contrat: emp.type_contrat || 'CDI',
      statut: emp.statut || 'Non-cadre',
      temps_travail: emp.temps_travail || 'Temps plein',
      date_entree: emp.date_entree || '',
      salaire_brut: emp.salaire_brut || '',
      numero_voie: emp.numero_voie || '',
      nom_rue: emp.nom_rue || '',
      code_postal: emp.code_postal || '',
      ville: emp.ville || '',
      date_naissance: emp.date_naissance || '',
      rtt_annuel: emp.rtt_annuel || 0,
      cp_n1_force: 0, cp_n_force: 0, rtt_force: 0,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSupprimer = async () => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer ${employeSelectionne.prenom} ${employeSelectionne.nom} ? Cette action est irréversible.`
    )
    if (!confirmation) return
    await supabase.from('soldes_conges').delete().eq('employe_id', employeSelectionne.id)
    await supabase.from('absences').delete().eq('employe_id', employeSelectionne.id)
    await supabase.from('employes').delete().eq('id', employeSelectionne.id)
    setShowForm(false)
    setEmployeSelectionne(null)
    resetForm()
    fetchEmployes()
  }

  return (
    <div className="p-8">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employés</h1>
          <p className="text-gray-500">{employes.length} salarié(s) — double-cliquez pour ouvrir une fiche</p>
        </div>
        <button
          onClick={() => { setEmployeSelectionne(null); setInvitationEnvoyee(false); resetForm(); setShowForm(!showForm) }}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700 transition"
        >
          + Ajouter un employé
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">

          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {employeSelectionne ? `Fiche — ${employeSelectionne.prenom} ${employeSelectionne.nom}` : 'Nouvel employé'}
            </h2>
            {employeSelectionne && (
              <button
                onClick={handleEnvoyerInvitation}
                disabled={invitationLoading || invitationEnvoyee}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  invitationEnvoyee
                    ? 'bg-green-50 text-green-600 cursor-default'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {invitationLoading ? '⏳ Envoi...' : invitationEnvoyee ? '✅ Invitation envoyée !' : '✉️ Envoyer invitation'}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Informations personnelles</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
              <input value={form.matricule} onChange={e => setForm({...form, matricule: e.target.value})}
                placeholder="Ex: MAT001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input required value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
              <input type="date" value={form.date_naissance} onChange={e => setForm({...form, date_naissance: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Adresse</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de voie</label>
              <input value={form.numero_voie} onChange={e => setForm({...form, numero_voie: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de rue</label>
              <input value={form.nom_rue} onChange={e => setForm({...form, nom_rue: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
              <input value={form.code_postal} onChange={e => setForm({...form, code_postal: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contrat & Rémunération</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
              <input value={form.poste} onChange={e => setForm({...form, poste: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
              <input value={form.departement} onChange={e => setForm({...form, departement: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'entrée</label>
              <input required type="date" value={form.date_entree} onChange={e => setForm({...form, date_entree: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
              <select value={form.type_contrat} onChange={e => setForm({...form, type_contrat: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>CDI</option><option>CDD</option><option>Alternance</option><option>Stage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Cadre</option><option>Non-cadre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temps de travail</label>
              <select value={form.temps_travail} onChange={e => setForm({...form, temps_travail: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Temps plein</option><option>Temps partiel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RTT annuel</label>
              <input type="number" value={form.rtt_annuel} onChange={e => setForm({...form, rtt_annuel: e.target.value})}
                placeholder="0 si pas de RTT"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salaire brut annuel (€)</label>
              <input type="number" value={form.salaire_brut} onChange={e => setForm({...form, salaire_brut: e.target.value})}
                placeholder="Ex: 35000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {employeSelectionne ? 'Modifier les compteurs' : 'Reprise des compteurs (optionnel)'}
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                {employeSelectionne
                  ? 'Les valeurs saisies seront additionnées aux compteurs existants'
                  : 'À remplir uniquement pour les salariés ayant déjà des compteurs existants'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CP N-1 à ajouter (jours)</label>
              <input type="number" step="0.5" value={form.cp_n1_force}
                onChange={e => setForm({...form, cp_n1_force: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CP N à ajouter (jours)</label>
              <input type="number" step="0.5" value={form.cp_n_force}
                onChange={e => setForm({...form, cp_n_force: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RTT à ajouter (jours)</label>
              <input type="number" step="0.5" value={form.rtt_force}
                onChange={e => setForm({...form, rtt_force: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="col-span-2 flex gap-3 mt-2">
              <button type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition">
                {employeSelectionne ? 'Enregistrer les modifications' : 'Enregistrer'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEmployeSelectionne(null); setInvitationEnvoyee(false); resetForm() }}
                className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-medium hover:bg-gray-200 transition">
                Annuler
              </button>
              {employeSelectionne && (
                <button type="button" onClick={handleSupprimer}
                  className="ml-auto bg-red-50 text-red-500 px-6 py-2 rounded-xl font-medium hover:bg-red-100 transition">
                  🗑️ Supprimer
                </button>
              )}
            </div>

          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : employes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucun employé pour l'instant.</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Matricule</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Nom</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Poste</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Contrat</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Entrée</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Statut</th>
              </tr>
            </thead>
            <tbody>
              {employes.map((emp) => (
                <tr
                  key={emp.id}
                  onDoubleClick={() => handleDoubleClick(emp)}
                  className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="px-6 py-4 text-gray-500 text-sm">{emp.matricule || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar id={emp.id} prenom={emp.prenom} nom={emp.nom} />
                      <div>
                        <div className="font-medium text-gray-800">{emp.prenom} {emp.nom}</div>
                        <div className="text-sm text-gray-400">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{emp.poste || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                      {emp.type_contrat}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{emp.date_entree}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      emp.statut === 'Cadre' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {emp.statut}
                    </span>
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
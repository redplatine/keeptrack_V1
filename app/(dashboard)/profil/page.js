'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function ProfilPage() {
  const [employe, setEmploye] = useState(null)
  const [soldes, setSoldes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avatar, setAvatar] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchProfil()
  }, [])

  const fetchProfil = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: emp } = await supabase
      .from('employes')
      .select('*')
      .eq('email', user.email)
      .single()
    setEmploye(emp)

    if (emp) {
      const annee = new Date().getFullYear()
      const { data: soldesData } = await supabase
        .from('soldes_conges')
        .select('*')
        .eq('employe_id', emp.id)
        .eq('annee', annee)
        .single()
      setSoldes(soldesData)

      // Récupération de la photo de profil
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${emp.id}/avatar`)
      // Vérifier si le fichier existe avec un timestamp pour éviter le cache
      setAvatar(`${data.publicUrl}?t=${Date.now()}`)
    }

    setLoading(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Vérification type et taille
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('La photo ne doit pas dépasser 2 MB.')
      return
    }

    setUploadLoading(true)

    const { error } = await supabase.storage
      .from('avatars')
      .upload(`${employe.id}/avatar`, file, {
        upsert: true,
        contentType: file.type,
      })

    if (error) {
      alert('Erreur upload : ' + error.message)
    } else {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${employe.id}/avatar`)
      setAvatar(`${data.publicUrl}?t=${Date.now()}`)
    }

    setUploadLoading(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Chargement...</div>
  }

  if (!employe) {
    return (
      <div className="p-8 text-center text-gray-400">
        Profil introuvable. Contactez votre administrateur.
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Mon profil</h1>
        <p className="text-gray-500">Vos informations personnelles et contractuelles</p>
      </div>

      {/* Bloc Photo + Identité rapide */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition bg-gray-50"
          >
            {uploadLoading ? (
              <span className="text-gray-400 text-xs">⏳</span>
            ) : avatar ? (
              <img
                src={avatar}
                alt="Photo de profil"
                className="w-full h-full object-cover"
                onError={() => setAvatar(null)}
              />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <p className="text-xs text-gray-400 text-center">
            {uploadLoading ? 'Upload...' : 'Cliquez pour changer'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-800">{employe.prenom} {employe.nom}</p>
          <p className="text-gray-500 text-sm">{employe.poste || '—'}</p>
          <p className="text-gray-400 text-sm">{employe.email}</p>
          <span className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full ${
            employe.statut === 'Cadre' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {employe.statut}
          </span>
        </div>
      </div>

      {/* Bloc Identité */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">👤 Identité</h2>
        <div className="grid grid-cols-2 gap-4">
          <InfoField label="Matricule" value={employe.matricule} />
          <InfoField label="Nom" value={employe.nom} />
          <InfoField label="Prénom" value={employe.prenom} />
          <InfoField label="Email" value={employe.email} />
          <InfoField label="Date de naissance" value={employe.date_naissance} />
          <InfoField label="Adresse" value={
            [employe.numero_voie, employe.nom_rue, employe.code_postal, employe.ville]
              .filter(Boolean).join(' ') || null
          } />
        </div>
      </div>

      {/* Bloc Contrat */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">📋 Contrat</h2>
        <div className="grid grid-cols-2 gap-4">
          <InfoField label="Poste" value={employe.poste} />
          <InfoField label="Département" value={employe.departement} />
          <InfoField label="Type de contrat" value={employe.type_contrat} />
          <InfoField label="Statut" value={employe.statut} />
          <InfoField label="Temps de travail" value={employe.temps_travail} />
          <InfoField label="Date d'entrée" value={employe.date_entree} />
          <InfoField label="RTT annuel" value={employe.rtt_annuel ? `${employe.rtt_annuel} jours` : null} />
          <InfoField label="Salaire brut annuel" value={
            employe.salaire_brut
              ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(employe.salaire_brut)
              : null
          } />
        </div>
      </div>

      {/* Bloc Soldes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          📅 Soldes de congés {new Date().getFullYear()}
        </h2>
        {!soldes ? (
          <p className="text-gray-400 text-sm">Aucun solde disponible pour cette année.</p>
        ) : (
          <div className="grid grid-cols-3 gap-6">

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-700 mb-3">Congés Payés N-1</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Acquis</span>
                  <span className="font-medium text-gray-800">{soldes.cp_n1_acquis} j</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pris</span>
                  <span className="font-medium text-gray-800">{soldes.cp_n1_pris} j</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-blue-100 pt-2">
                  <span className="text-blue-700">Restants</span>
                  <span className="text-blue-700 text-lg">{soldes.cp_n1_solde} j</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-sm font-medium text-indigo-700 mb-3">Congés Payés N</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Acquis</span>
                  <span className="font-medium text-gray-800">{soldes.cp_n_acquis} j</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pris</span>
                  <span className="font-medium text-gray-800">{soldes.cp_n_pris} j</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-indigo-100 pt-2">
                  <span className="text-indigo-700">Restants</span>
                  <span className="text-indigo-700 text-lg">{soldes.cp_n_solde} j</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm font-medium text-green-700 mb-3">RTT</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Acquis</span>
                  <span className="font-medium text-gray-800">{soldes.rtt_acquis} j</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pris</span>
                  <span className="font-medium text-gray-800">{soldes.rtt_pris} j</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-green-100 pt-2">
                  <span className="text-green-700">Restants</span>
                  <span className="text-green-700 text-lg">{soldes.rtt_solde} j</span>
                </div>
              </div>
            </div>

          </div>
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
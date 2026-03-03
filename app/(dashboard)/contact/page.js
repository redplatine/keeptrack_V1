'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ContactPage() {
  const [employe, setEmploye] = useState(null)
  const [messages, setMessages] = useState([])
  const [form, setForm] = useState({ sujet: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: emp } = await supabase
      .from('employes').select('*').eq('email', user.email).single()
    setEmploye(emp)

    if (emp) {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('employe_id', emp.id)
        .order('created_at', { ascending: false })
      setMessages(data || [])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur(null)

    const { error } = await supabase.from('messages').insert([{
      employe_id: employe.id,
      sujet: form.sujet,
      message: form.message,
    }])

    if (error) {
      setErreur('Erreur lors de l\'envoi. Veuillez réessayer.')
      setLoading(false)
      return
    }

    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prenomSalarie: employe.prenom,
        nomSalarie: employe.nom,
        emailSalarie: employe.email,
        sujet: form.sujet,
        message: form.message,
      }),
    })

    setEnvoye(true)
    setShowForm(false)
    setForm({ sujet: '', message: '' })
    setLoading(false)
    fetchData()
  }

  const statutColors = {
    'Ouvert': 'bg-orange-50 text-orange-500',
    'Clôturé': 'bg-green-50 text-green-600',
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contact & Support</h1>
          <p className="text-gray-500">Échangez avec votre service RH</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEnvoye(false); setErreur(null) }}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700 transition">
          + Nouveau message
        </button>
      </div>

      {envoye && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
          ✅ Votre message a bien été envoyé au service RH !
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nouveau message</h2>

          {erreur && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              ⚠️ {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
              <select required value={form.sujet} onChange={e => setForm({...form, sujet: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Sélectionner un sujet --</option>
                <option>Question sur mes congés</option>
                <option>Problème avec mes compteurs</option>
                <option>Demande de document</option>
                <option>Signalement d'une erreur</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea required value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                rows={5} placeholder="Décrivez votre demande..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {loading ? '⏳ Envoi...' : '📨 Envoyer'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-medium hover:bg-gray-200 transition">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
            Aucun message pour l'instant.
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{msg.sujet}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statutColors[msg.statut]}`}>
                  {msg.statut}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
              </div>

              {msg.reponse_admin && (
                <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
                  <p className="text-xs font-medium text-blue-600 mb-1">💬 Réponse du service RH</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.reponse_admin}</p>
                  {msg.repondu_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(msg.repondu_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
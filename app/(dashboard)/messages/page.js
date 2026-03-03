'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [reponses, setReponses] = useState({})
  const [filtreStatut, setFiltreStatut] = useState('')

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: employesData } = await supabase
      .from('employes').select('id, nom, prenom, email')

    const enriched = (data || []).map(msg => ({
      ...msg,
      employe: employesData?.find(e => e.id === msg.employe_id) || null
    }))

    setMessages(enriched)
    setLoading(false)
  }

  const handleRepondre = async (msg) => {
    const reponse = reponses[msg.id]
    if (!reponse?.trim()) return

    await supabase.from('messages').update({
      reponse_admin: reponse,
      statut: 'Clôturé',
      repondu_at: new Date().toISOString(),
    }).eq('id', msg.id)

    // Notif email au salarié
    await fetch('/api/contact-reponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailSalarie: msg.employe?.email,
        prenomSalarie: msg.employe?.prenom,
        sujet: msg.sujet,
        messageOriginal: msg.message,
        reponse,
      }),
    })

    setReponses(prev => ({ ...prev, [msg.id]: '' }))
    fetchMessages()
  }

  const handleCloture = async (id) => {
    await supabase.from('messages').update({ statut: 'Clôturé' }).eq('id', id)
    fetchMessages()
  }

  const handleSupprimer = async (id) => {
    const confirmation = window.confirm('Voulez-vous vraiment supprimer cette conversation ?')
    if (!confirmation) return
    await supabase.from('messages').delete().eq('id', id)
    fetchMessages()
  }

  const messagesFiltres = filtreStatut
    ? messages.filter(m => m.statut === filtreStatut)
    : messages

  const nbOuverts = messages.filter(m => m.statut === 'Ouvert').length

  const statutColors = {
    'Ouvert': 'bg-orange-50 text-orange-500',
    'Clôturé': 'bg-green-50 text-green-600',
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Messages & Support</h1>
          <p className="text-gray-500">{nbOuverts} message(s) ouvert(s)</p>
        </div>
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les messages</option>
          <option value="Ouvert">Ouverts</option>
          <option value="Clôturé">Clôturés</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Chargement...</div>
      ) : messagesFiltres.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
          Aucun message.
        </div>
      ) : (
        <div className="space-y-4">
          {messagesFiltres.map(msg => (
            <div key={msg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-800">{msg.sujet}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statutColors[msg.statut]}`}>
                      {msg.statut}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    De <span className="font-medium text-gray-700">{msg.employe?.prenom} {msg.employe?.nom}</span>
                    {' · '}
                    {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {msg.statut === 'Ouvert' && (
                    <button onClick={() => handleCloture(msg.id)}
                      className="bg-green-50 text-green-600 text-xs px-3 py-1 rounded-lg hover:bg-green-100 transition font-medium">
                      ✓ Clôturer
                    </button>
                  )}
                  <button onClick={() => handleSupprimer(msg.id)}
                    className="bg-red-50 text-red-500 text-xs px-3 py-1 rounded-lg hover:bg-red-100 transition font-medium">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
              </div>

              {msg.reponse_admin ? (
                <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
                  <p className="text-xs font-medium text-blue-600 mb-1">💬 Votre réponse</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.reponse_admin}</p>
                  {msg.repondu_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(msg.repondu_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <textarea
                    value={reponses[msg.id] || ''}
                    onChange={e => setReponses(prev => ({ ...prev, [msg.id]: e.target.value }))}
                    rows={3}
                    placeholder="Rédigez votre réponse..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <button
                    onClick={() => handleRepondre(msg)}
                    disabled={!reponses[msg.id]?.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                    📨 Répondre et clôturer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
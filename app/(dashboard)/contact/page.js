'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useEntreprise } from '../../../lib/EntrepriseContext'

const STATUS_CONFIG = {
  'Ouvert':  { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B', border: '#FDE68A' },
  'Clôturé': { bg: '#F0FDF4', color: '#16A34A', dot: '#4ADE80', border: '#BBF7D0' },
}

const S = {
  input: { width: '100%', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '9px 12px', fontSize: '13.5px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: '12px', fontWeight: 600, color: '#A8A29E', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
}

const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function ContactPage() {
  const [employe, setEmploye] = useState(null)
  const [messages, setMessages] = useState([])
  const [form, setForm] = useState({ sujet: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const { entrepriseId } = useEntreprise()

  useEffect(() => { if (entrepriseId) fetchData() }, [entrepriseId])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: emp } = await supabase
      .from('employes').select('*')
      .eq('email', user.email)
      .eq('entreprise_id', entrepriseId)
      .single()
    setEmploye(emp)

    if (emp) {
      const { data } = await supabase
        .from('messages').select('*')
        .eq('employe_id', emp.id)
        .eq('entreprise_id', entrepriseId)
        .order('created_at', { ascending: false })
      setMessages(data || [])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setErreur(null)
    const { error } = await supabase.from('messages').insert([{
      employe_id: employe.id,
      entreprise_id: entrepriseId,
      sujet: form.sujet,
      message: form.message
    }])
    if (error) { setErreur("Erreur lors de l'envoi. Veuillez réessayer."); setLoading(false); return }
    await fetch('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prenomSalarie: employe.prenom, nomSalarie: employe.nom, emailSalarie: employe.email, sujet: form.sujet, message: form.message }),
    })
    setEnvoye(true); setShowForm(false); setForm({ sujet: '', message: '' }); setLoading(false)
    fetchData()
  }

  const nbOuverts = messages.filter(m => m.statut === 'Ouvert').length

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>
      <div style={{ maxWidth: '760px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: '#78716C', margin: 0 }}>
            {nbOuverts > 0 ? `${nbOuverts} message(s) en attente de réponse` : 'Échangez avec votre service RH'}
          </p>
          <button onClick={() => { setShowForm(!showForm); setEnvoye(false); setErreur(null) }} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#1C1917', color: 'white', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = '#44403C'}
            onMouseLeave={e => e.currentTarget.style.background = '#1C1917'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau message
          </button>
        </div>

        {envoye && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', color: '#16A34A', fontSize: '13.5px', fontWeight: 500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Votre message a bien été envoyé au service RH !
          </div>
        )}

        {showForm && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px 28px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: '0 0 20px' }}>Nouveau message</h2>
            {erreur && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#DC2626', fontSize: '13.5px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {erreur}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={S.label}>Sujet</label>
                <select required value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })} style={{ ...S.input, cursor: 'pointer' }}>
                  <option value="">-- Sélectionner un sujet --</option>
                  <option>Question sur mes congés</option>
                  <option>Problème avec mes compteurs</option>
                  <option>Demande de document</option>
                  <option>Signalement d'une erreur</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Message</label>
                <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={5} placeholder="Décrivez votre demande…"
                  style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = '#8B4A5A'}
                  onBlur={e => e.target.style.borderColor = '#E8E4E0'} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: loading ? '#E8E4E0' : '#1C1917', color: loading ? '#A8A29E' : 'white', fontSize: '13.5px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  {loading ? 'Envoi…' : 'Envoyer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #E8E4E0', background: 'white', color: '#78716C', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {messages.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
            <p style={{ color: '#A8A29E', fontSize: '14px', margin: 0 }}>Aucun message pour l'instant</p>
            <p style={{ color: '#C4B5A5', fontSize: '13px', margin: '4px 0 0' }}>Envoyez votre premier message au service RH</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(msg => {
              const sc = STATUS_CONFIG[msg.statut] || STATUS_CONFIG['Ouvert']
              return (
                <div key={msg.id} style={{ background: 'white', borderRadius: '16px', border: `1px solid ${msg.statut === 'Ouvert' && !msg.reponse_admin ? '#FDE68A' : '#E8E4E0'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 22px', borderBottom: '1px solid #F0EDE9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1C1917', margin: 0 }}>{msg.sujet}</h3>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.dot }} />
                          {msg.statut}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>{formatDate(msg.created_at)}</p>
                    </div>
                  </div>
                  <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Votre message</p>
                      <div style={{ background: '#FAF8F6', borderRadius: '12px', padding: '12px 16px', border: '1px solid #F0EDE9' }}>
                        <p style={{ fontSize: '13.5px', color: '#44403C', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                      </div>
                    </div>
                    {msg.reponse_admin ? (
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Réponse du service RH</p>
                        <div style={{ background: '#F9EEF1', borderRadius: '12px', padding: '12px 16px', border: '1px solid #DDB8C2', borderLeft: '3px solid #8B4A5A' }}>
                          <p style={{ fontSize: '13.5px', color: '#44403C', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.reponse_admin}</p>
                          {msg.repondu_at && <p style={{ fontSize: '11px', color: '#A8A29E', margin: '8px 0 0' }}>{formatDate(msg.repondu_at)}</p>}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                        <p style={{ fontSize: '12px', color: '#B45309', fontWeight: 500, margin: 0 }}>En attente de réponse du service RH</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
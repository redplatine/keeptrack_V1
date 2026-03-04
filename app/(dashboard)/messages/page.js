'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_CONFIG = {
  'Ouvert':   { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B', border: '#FDE68A' },
  'Clôturé':  { bg: '#F0FDF4', color: '#16A34A', dot: '#4ADE80', border: '#BBF7D0' },
}

function Avatar({ prenom, nom }) {
  const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
      background: '#F2E6E9', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 700, color: '#6B2F42'
    }}>
      {initiales || '?'}
    </div>
  )
}

export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [reponses, setReponses] = useState({})
  const [filtreStatut, setFiltreStatut] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => { fetchMessages() }, [])

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false })
    const { data: employesData } = await supabase.from('employes').select('id, nom, prenom, email')
    const enriched = (data || []).map(msg => ({
      ...msg, employe: employesData?.find(e => e.id === msg.employe_id) || null
    }))
    setMessages(enriched)
    setLoading(false)
  }

  const handleRepondre = async (msg) => {
    const reponse = reponses[msg.id]
    if (!reponse?.trim()) return
    await supabase.from('messages').update({
      reponse_admin: reponse, statut: 'Clôturé', repondu_at: new Date().toISOString(),
    }).eq('id', msg.id)
    await fetch('/api/contact-reponse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailSalarie: msg.employe?.email, prenomSalarie: msg.employe?.prenom, sujet: msg.sujet, messageOriginal: msg.message, reponse }),
    })
    setReponses(prev => ({ ...prev, [msg.id]: '' }))
    fetchMessages()
  }

  const handleCloture = async (id) => {
    await supabase.from('messages').update({ statut: 'Clôturé' }).eq('id', id)
    fetchMessages()
  }

  const handleSupprimer = async (id) => {
    if (!window.confirm('Supprimer cette conversation ?')) return
    await supabase.from('messages').delete().eq('id', id)
    fetchMessages()
  }

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const messagesFiltres = filtreStatut ? messages.filter(m => m.statut === filtreStatut) : messages
  const nbOuverts = messages.filter(m => m.statut === 'Ouvert').length

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* ACTIONS — sans titre */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: '#78716C', margin: 0 }}>
          {nbOuverts > 0
            ? <><span style={{ color: '#B45309', fontWeight: 600 }}>{nbOuverts}</span> message(s) en attente de réponse</>
            : 'Aucun message en attente'}
        </p>
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{
          border: '1px solid #E8E4E0', borderRadius: '10px', padding: '9px 12px',
          fontSize: '13.5px', background: 'white', outline: 'none',
          color: '#44403C', fontFamily: 'inherit', cursor: 'pointer',
        }}>
          <option value="">Tous les messages</option>
          <option value="Ouvert">Ouverts</option>
          <option value="Clôturé">Clôturés</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : messagesFiltres.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
          <p style={{ color: '#A8A29E', fontSize: '14px' }}>Aucun message pour l'instant</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messagesFiltres.map(msg => {
            const sc = STATUS_CONFIG[msg.statut] || STATUS_CONFIG['Ouvert']
            const isExpanded = expanded[msg.id] !== false
            const isOpen = msg.statut === 'Ouvert'

            return (
              <div key={msg.id} style={{
                background: 'white', borderRadius: '16px',
                border: `1px solid ${isOpen ? '#FDE68A' : '#E8E4E0'}`,
                boxShadow: isOpen ? '0 2px 12px rgba(245,158,11,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}>
                {/* Header message */}
                <div
                  onClick={() => toggleExpand(msg.id)}
                  style={{
                    padding: '18px 24px', display: 'flex', alignItems: 'center',
                    gap: '14px', cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid #F0EDE9' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  <Avatar prenom={msg.employe?.prenom} nom={msg.employe?.nom} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1C1917', margin: 0 }}>{msg.sujet}</h3>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px',
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, flexShrink: 0
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.dot }} />
                        {msg.statut}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>
                      <span style={{ color: '#78716C', fontWeight: 500 }}>{msg.employe?.prenom} {msg.employe?.nom}</span>
                      {' · '}{formatDate(msg.created_at)}
                    </p>
                  </div>

                  {/* Actions rapides */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {isOpen && (
                      <button onClick={() => handleCloture(msg.id)} style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '8px', border: '1px solid #BBF7D0',
                        background: '#F0FDF4', color: '#16A34A', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Clôturer
                      </button>
                    )}
                    <button onClick={() => handleSupprimer(msg.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 12px', borderRadius: '8px', border: '1px solid #E8E4E0',
                      background: '#FAF8F6', color: '#A8A29E', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FAF8F6'; e.currentTarget.style.color = '#A8A29E'; e.currentTarget.style.borderColor = '#E8E4E0' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      Supprimer
                    </button>
                    <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A8A29E' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Corps du message */}
                {isExpanded && (
                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
                        Message
                      </p>
                      <div style={{ background: '#FAF8F6', borderRadius: '12px', padding: '14px 16px', border: '1px solid #F0EDE9' }}>
                        <p style={{ fontSize: '14px', color: '#44403C', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                      </div>
                    </div>

                    {msg.reponse_admin && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
                          Votre réponse
                        </p>
                        <div style={{ background: '#F9EEF1', borderRadius: '12px', padding: '14px 16px', border: '1px solid #DDB8C2', borderLeft: '3px solid #8B4A5A' }}>
                          <p style={{ fontSize: '14px', color: '#44403C', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.reponse_admin}</p>
                          {msg.repondu_at && (
                            <p style={{ fontSize: '11px', color: '#A8A29E', margin: '8px 0 0' }}>{formatDate(msg.repondu_at)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {!msg.reponse_admin && (
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
                          Répondre
                        </p>
                        <textarea
                          value={reponses[msg.id] || ''}
                          onChange={e => setReponses(prev => ({ ...prev, [msg.id]: e.target.value }))}
                          rows={3}
                          placeholder="Rédigez votre réponse…"
                          style={{
                            width: '100%', border: '1px solid #E8E4E0', borderRadius: '12px',
                            padding: '12px 14px', fontSize: '13.5px', background: '#FAF8F6',
                            outline: 'none', color: '#1C1917', fontFamily: 'inherit',
                            resize: 'vertical', marginBottom: '10px', boxSizing: 'border-box', lineHeight: 1.6,
                          }}
                          onFocus={e => e.target.style.borderColor = '#8B4A5A'}
                          onBlur={e => e.target.style.borderColor = '#E8E4E0'}
                        />
                        <button
                          onClick={() => handleRepondre(msg)}
                          disabled={!reponses[msg.id]?.trim()}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '7px',
                            padding: '9px 16px', borderRadius: '10px', border: 'none',
                            background: reponses[msg.id]?.trim() ? '#1C1917' : '#E8E4E0',
                            color: reponses[msg.id]?.trim() ? 'white' : '#A8A29E',
                            fontSize: '13.5px', fontWeight: 500,
                            cursor: reponses[msg.id]?.trim() ? 'pointer' : 'not-allowed',
                            fontFamily: 'inherit', transition: 'background 0.15s',
                          }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                          Répondre et clôturer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TYPE_CONFIG = {
  'CP':                  { bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6' },
  'RTT':                 { bg: '#EDE9FE', color: '#4F46E5', dot: '#6366F1' },
  'Maladie':             { bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
  'Absence injustifiée': { bg: '#F0EDE9', color: '#78716C', dot: '#A8A29E' },
  'Congé sans solde':    { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  'Événement familial':  { bg: '#FDF4FF', color: '#A21CAF', dot: '#C026D3' },
  'Maternité':           { bg: '#FCE7F3', color: '#BE185D', dot: '#EC4899' },
  'Paternité':           { bg: '#F9EEF1', color: '#6B2F42', dot: '#8B4A5A' },
}

const JOURS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function CalendrierPage() {
  const [absences, setAbsences] = useState([])
  const [employe, setEmploye] = useState(null)
  const [moisActuel, setMoisActuel] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: emp } = await supabase.from('employes').select('*').eq('email', user.email).single()
    setEmploye(emp)
    let absData = []
    if (emp.role === 'salarie') {
      const { data } = await supabase.from('absences').select('*').eq('employe_id', emp.id).neq('statut', 'Refusée')
      absData = data || []
    } else {
      const { data } = await supabase.from('absences').select('*').neq('statut', 'Refusée')
      absData = data || []
    }
    const { data: employesData } = await supabase.from('employes').select('id, nom, prenom')
    absData = absData.map(abs => ({ ...abs, employes: employesData?.find(e => e.id === abs.employe_id) || null }))
    setAbsences(absData)
    setLoading(false)
  }

  const annee = moisActuel.getFullYear()
  const mois = moisActuel.getMonth()
  const premierJour = new Date(annee, mois, 1)
  const dernierJour = new Date(annee, mois + 1, 0)

  let debutSemaine = premierJour.getDay() - 1
  if (debutSemaine < 0) debutSemaine = 6

  const jours = []
  for (let i = 0; i < debutSemaine; i++) jours.push(null)
  for (let i = 1; i <= dernierJour.getDate(); i++) jours.push(new Date(annee, mois, i))

  const getAbsencesDuJour = (jour) => {
    if (!jour) return []
    return absences.filter(abs => {
      const debut = new Date(abs.date_debut); debut.setHours(0, 0, 0, 0)
      const fin = new Date(abs.date_fin || abs.date_debut); fin.setHours(23, 59, 59, 999)
      const j = new Date(jour); j.setHours(12, 0, 0, 0)
      return j >= debut && j <= fin
    })
  }

  const isAujourdhui = (jour) => {
    if (!jour) return false
    const today = new Date()
    return jour.getDate() === today.getDate() && jour.getMonth() === today.getMonth() && jour.getFullYear() === today.getFullYear()
  }

  const nomMois = moisActuel.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const isManager = employe?.role !== 'salarie'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* ACTIONS — navigation mois uniquement, sans titre */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setMoisActuel(new Date(annee, mois - 1, 1))}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              border: '1px solid #E8E4E0', background: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78716C',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <span style={{
            fontSize: '14px', fontWeight: 600, color: '#1C1917',
            width: '160px', textAlign: 'center', textTransform: 'capitalize'
          }}>
            {nomMois}
          </span>

          <button onClick={() => setMoisActuel(new Date(annee, mois + 1, 1))}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              border: '1px solid #E8E4E0', background: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78716C',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <button onClick={() => setMoisActuel(new Date())}
            style={{
              padding: '8px 14px', borderRadius: '10px', border: '1px solid #E8E4E0',
              background: 'white', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '13px', fontWeight: 500, color: '#78716C',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* LÉGENDE */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        {Object.entries(TYPE_CONFIG).map(([type, conf]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: conf.bg }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: conf.dot, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: conf.color }}>{type}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: '#F0EDE9' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C4B5A5', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#78716C' }}>En attente</span>
        </div>
      </div>

      {/* CALENDRIER */}
      <div style={{
        background: 'white', borderRadius: '16px',
        border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden'
      }}>
        {/* En-têtes jours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #F0EDE9' }}>
          {JOURS_FR.map((j, i) => (
            <div key={j} style={{
              padding: '12px', textAlign: 'center',
              fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em',
              color: i >= 5 ? '#C4B5A5' : '#A8A29E',
              textTransform: 'uppercase',
              background: i >= 5 ? '#FAF8F6' : 'transparent',
            }}>{j}</div>
          ))}
        </div>

        {/* Grille jours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {jours.map((jour, index) => {
            const absencesDuJour = getAbsencesDuJour(jour)
            const estWeekend = jour && (jour.getDay() === 0 || jour.getDay() === 6)
            const estAujourdhui = isAujourdhui(jour)

            return (
              <div key={index} style={{
                minHeight: '110px', padding: '8px',
                borderRight: '1px solid #FAF8F6',
                borderBottom: '1px solid #FAF8F6',
                background: !jour ? '#FAFAF9' : estWeekend ? '#FAF8F6' : 'white',
                position: 'relative',
                outline: estAujourdhui ? '2px solid #8B4A5A' : 'none',
                outlineOffset: '-2px',
                borderRadius: estAujourdhui ? '4px' : '0',
              }}>
                {jour && (
                  <>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: estAujourdhui ? 700 : 400,
                        color: estAujourdhui ? 'white' : estWeekend ? '#C4B5A5' : '#44403C',
                        width: '24px', height: '24px', borderRadius: '8px',
                        background: estAujourdhui ? '#8B4A5A' : 'transparent',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {jour.getDate()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {absencesDuJour.slice(0, 3).map((abs, i) => {
                        const conf = TYPE_CONFIG[abs.type_absence] || { bg: '#F0EDE9', color: '#78716C', dot: '#A8A29E' }
                        const enAttente = abs.statut === 'En attente'
                        return (
                          <div key={i}
                            title={`${abs.employes?.prenom} ${abs.employes?.nom} — ${abs.type_absence} (${abs.statut})`}
                            style={{
                              fontSize: '11px', fontWeight: 500,
                              padding: '2px 6px', borderRadius: '4px',
                              background: conf.bg, color: conf.color,
                              opacity: enAttente ? 0.6 : 1,
                              border: enAttente ? `1px dashed ${conf.dot}` : 'none',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              cursor: 'default',
                            }}>
                            {isManager ? (abs.employes?.prenom || '?') : abs.type_absence}
                          </div>
                        )
                      })}
                      {absencesDuJour.length > 3 && (
                        <div style={{ fontSize: '11px', color: '#A8A29E', padding: '1px 4px', fontWeight: 500 }}>
                          +{absencesDuJour.length - 3} autre(s)
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* RÉSUMÉ DU MOIS */}
      {absences.length > 0 && (() => {
        const absencesDuMois = absences.filter(abs => {
          const debut = new Date(abs.date_debut)
          const fin = new Date(abs.date_fin || abs.date_debut)
          return (debut.getMonth() === mois && debut.getFullYear() === annee) ||
                 (fin.getMonth() === mois && fin.getFullYear() === annee)
        })
        if (absencesDuMois.length === 0) return null
        const parType = absencesDuMois.reduce((acc, abs) => {
          acc[abs.type_absence] = (acc[abs.type_absence] || 0) + 1
          return acc
        }, {})
        return (
          <div style={{
            marginTop: '20px', background: 'white', borderRadius: '16px',
            border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            padding: '18px 24px'
          }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
              Résumé — {nomMois}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(parType).map(([type, count]) => {
                const conf = TYPE_CONFIG[type] || { bg: '#F0EDE9', color: '#78716C', dot: '#A8A29E' }
                return (
                  <div key={type} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 12px', borderRadius: '10px', background: conf.bg
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: conf.dot }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: conf.color }}>{type}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: conf.color }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useEntreprise } from '../../lib/EntrepriseContext'

const TYPE_CONFIG = {
  'CP':                  { bg: '#F0F7FF', color: '#2563EB', dot: '#3B82F6', initBg: '#DBEAFE', initColor: '#1D4ED8' },
  'RTT':                 { bg: '#F0FDF4', color: '#16A34A', dot: '#4ADE80', initBg: '#DCFCE7', initColor: '#15803D' },
  'Maladie':             { bg: '#FFF7ED', color: '#C2410C', dot: '#FB923C', initBg: '#FED7AA', initColor: '#9A3412' },
  'Absence injustifiée': { bg: '#F9F9F9', color: '#78716C', dot: '#A8A29E', initBg: '#F0EDE9', initColor: '#57534E' },
  'Congé sans solde':    { bg: '#F9EEF1', color: '#6B2F42', dot: '#8B4A5A', initBg: '#F2D4DA', initColor: '#4A2330' },
  'Événement familial':  { bg: '#FDF4FF', color: '#A21CAF', dot: '#C026D3', initBg: '#F5D0FE', initColor: '#86198F' },
  'Maternité':           { bg: '#FCE7F3', color: '#BE185D', dot: '#EC4899', initBg: '#FBCFE8', initColor: '#9D174D' },
  'Paternité':           { bg: '#EFF6FF', color: '#1D4ED8', dot: '#60A5FA', initBg: '#DBEAFE', initColor: '#1E40AF' },
  'Récupération':        { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B', initBg: '#FEF3C7', initColor: '#92400E' },
}

const JOURS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function AbsenceBadge({ abs, isManager }) {
  const conf =
    TYPE_CONFIG[abs.type_absence] || {
      bg: '#F0EDE9',
      color: '#78716C',
      dot: '#A8A29E',
      initBg: '#E8E4E0',
      initColor: '#57534E',
    }

  const enAttente = abs.statut === 'En attente'
  const prenom = abs.employes?.prenom || '?'
  const nom = abs.employes?.nom || ''
  const initiales = `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase()

  return (
    <div
      title={`${prenom} ${nom} — ${abs.type_absence} (${abs.statut})`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 7px 3px 4px',
        borderRadius: '7px',
        background: enAttente ? 'transparent' : conf.bg,
        border: enAttente ? `1.5px dashed ${conf.dot}` : '1px solid transparent',
        opacity: enAttente ? 0.75 : 1,
        overflow: 'hidden',
        cursor: 'default',
        maxWidth: '100%',
      }}
    >
      <span
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '5px',
          flexShrink: 0,
          background: conf.initBg,
          color: conf.initColor,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
          fontWeight: 800,
          letterSpacing: '0',
        }}
      >
        {isManager ? initiales : abs.type_absence.slice(0, 2).toUpperCase()}
      </span>

      <span
        style={{
          fontSize: '11.5px',
          fontWeight: 700,
          color: conf.color,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}
      >
        {isManager ? `${prenom} ${nom[0] ? `${nom[0]}.` : ''}` : abs.type_absence}
      </span>
    </div>
  )
}

export default function CalendrierPage() {
  const [absences, setAbsences] = useState([])
  const [employe, setEmploye] = useState(null)
  const [moisActuel, setMoisActuel] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const { entrepriseId } = useEntreprise()

  useEffect(() => {
    if (entrepriseId) {
      fetchData()
    }
  }, [entrepriseId])

  const fetchData = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !entrepriseId) {
        setEmploye(null)
        setAbsences([])
        setLoading(false)
        return
      }

      const { data: emp, error: empError } = await supabase
        .from('employes')
        .select('*')
        .eq('email', user.email)
        .eq('entreprise_id', entrepriseId)
        .maybeSingle()

      if (empError) {
        console.error('Erreur récupération employé :', empError)
      }

      setEmploye(emp || null)

      let absData = []

      if (emp?.role === 'salarie') {
        const { data, error } = await supabase
          .from('absences')
          .select('*')
          .eq('employe_id', emp.id)
          .eq('entreprise_id', entrepriseId)
          .neq('statut', 'Refusée')

        if (error) {
          console.error('Erreur récupération absences salarié :', error)
        }

        absData = data || []
      } else {
        const { data, error } = await supabase
          .from('absences')
          .select('*')
          .eq('entreprise_id', entrepriseId)
          .neq('statut', 'Refusée')

        if (error) {
          console.error('Erreur récupération absences entreprise :', error)
        }

        absData = data || []
      }

      const { data: employesData, error: employesError } = await supabase
        .from('employes')
        .select('id, nom, prenom, matricule')
        .eq('entreprise_id', entrepriseId)

      if (employesError) {
        console.error('Erreur récupération employés :', employesError)
      }

      const employesMap = Object.fromEntries(
        (employesData || []).map((e) => [e.id, e])
      )

      const absencesEnrichies = absData.map((abs) => ({
        ...abs,
        employes: employesMap[abs.employe_id] || null,
      }))

      setAbsences(absencesEnrichies)
    } catch (error) {
      console.error('Erreur calendrier :', error)
      setAbsences([])
    } finally {
      setLoading(false)
    }
  }

  const annee = moisActuel.getFullYear()
  const mois = moisActuel.getMonth()
  const premierJour = new Date(annee, mois, 1)
  const dernierJour = new Date(annee, mois + 1, 0)

  let debutSemaine = premierJour.getDay() - 1
  if (debutSemaine < 0) debutSemaine = 6

  const joursAvant = []
  for (let i = 0; i < debutSemaine; i++) {
    const d = new Date(annee, mois, -debutSemaine + 1 + i)
    joursAvant.push({ date: d, autresMois: true })
  }

  const joursMois = []
  for (let i = 1; i <= dernierJour.getDate(); i++) {
    joursMois.push({ date: new Date(annee, mois, i), autresMois: false })
  }

  const total = joursAvant.length + joursMois.length
  const joursApres = []
  for (let i = 1; joursApres.length < (7 - (total % 7)) % 7; i++) {
    joursApres.push({ date: new Date(annee, mois + 1, i), autresMois: true })
  }

  const jours = [...joursAvant, ...joursMois, ...joursApres]

  const getAbsencesDuJour = (date) => {
    return absences.filter((abs) => {
      const debut = new Date(abs.date_debut)
      debut.setHours(0, 0, 0, 0)

      const fin = new Date(abs.date_fin || abs.date_debut)
      fin.setHours(23, 59, 59, 999)

      const j = new Date(date)
      j.setHours(12, 0, 0, 0)

      return j >= debut && j <= fin
    })
  }

  const isAujourdhui = (date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const nomMois = moisActuel.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  const isManager = employe?.role !== 'salarie'

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid #E8E4E0',
            borderTopColor: '#8B4A5A',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '0 40px 40px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setMoisActuel(new Date(annee, mois - 1, 1))}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'white',
              width: '168px',
              textAlign: 'center',
              textTransform: 'capitalize',
              textShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}
          >
            {nomMois}
          </span>

          <button
            onClick={() => setMoisActuel(new Date(annee, mois + 1, 1))}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            onClick={() => setMoisActuel(new Date())}
            style={{
              padding: '7px 14px',
              borderRadius: '9px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 500,
              color: 'white',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            Aujourd&apos;hui
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {Object.entries(TYPE_CONFIG).map(([type, conf]) => (
          <div
            key={type}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: conf.dot,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
              {type}
            </span>
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.18)',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
            En attente
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          marginBottom: '6px',
        }}
      >
        {JOURS_FR.map((j, i) => (
          <div
            key={j}
            style={{
              padding: '10px 6px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: i >= 5 ? '#A8A29E' : '#6B2F42',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: i >= 5 ? '#F5F0F1' : '#F2E6E9',
              borderRadius: '10px',
            }}
          >
            {j}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {jours.map(({ date, autresMois }, index) => {
          const absencesDuJour = getAbsencesDuJour(date)
          const estWeekend = date.getDay() === 0 || date.getDay() === 6
          const estAujourdhui = isAujourdhui(date)

          return (
            <div
              key={index}
              style={{
                minHeight: '100px',
                padding: '9px 9px 7px',
                borderRadius: '12px',
                background: autresMois ? 'rgba(255,255,255,0.45)' : estWeekend ? '#FDFBFA' : 'white',
                boxShadow: estAujourdhui
                  ? '0 2px 8px rgba(74,35,48,0.18), 0 0 0 2px #8B4A5A'
                  : autresMois
                  ? '0 1px 3px rgba(0,0,0,0.04)'
                  : '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                transition: 'box-shadow 0.15s',
              }}
            >
              <div style={{ marginBottom: '3px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: estAujourdhui ? 700 : 500,
                    color: estAujourdhui
                      ? 'white'
                      : autresMois
                      ? '#C4B5A5'
                      : estWeekend
                      ? '#B8B0AA'
                      : '#44403C',
                    width: '22px',
                    height: '22px',
                    borderRadius: '7px',
                    background: estAujourdhui ? '#8B4A5A' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {date.getDate()}
                </span>
              </div>

              {absencesDuJour.slice(0, 3).map((abs) => (
                <AbsenceBadge key={abs.id} abs={abs} isManager={isManager} />
              ))}

              {absencesDuJour.length > 3 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#A8A29E',
                    paddingLeft: '4px',
                  }}
                >
                  +{absencesDuJour.length - 3} autres
                </span>
              )}
            </div>
          )
        })}
      </div>

      {absences.length > 0 &&
        (() => {
          const absencesDuMois = absences.filter((abs) => {
            const debut = new Date(abs.date_debut)
            const fin = new Date(abs.date_fin || abs.date_debut)

            const debutDansMois = debut.getMonth() === mois && debut.getFullYear() === annee
            const finDansMois = fin.getMonth() === mois && fin.getFullYear() === annee
            const chevaucheLeMois =
              debut < new Date(annee, mois + 1, 1) && fin >= new Date(annee, mois, 1)

            return debutDansMois || finDansMois || chevaucheLeMois
          })

          if (absencesDuMois.length === 0) return null

          const parType = absencesDuMois.reduce((acc, abs) => {
            acc[abs.type_absence] = (acc[abs.type_absence] || 0) + 1
            return acc
          }, {})

          return (
            <div
              style={{
                marginTop: '16px',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #E8E4E0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                padding: '16px 22px',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#A8A29E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  margin: '0 0 10px',
                }}
              >
                Résumé — {nomMois}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(parType).map(([type, count]) => {
                  const conf = TYPE_CONFIG[type] || {
                    bg: '#F0EDE9',
                    color: '#78716C',
                    dot: '#A8A29E',
                  }

                  return (
                    <div
                      key={type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        background: conf.bg,
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: conf.dot,
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: conf.color }}>
                        {type}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: conf.color }}>
                        {count}
                      </span>
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
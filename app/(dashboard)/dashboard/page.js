'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function StatCard({ label, value, acquis, pris, accent, iconBg }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #EAECF0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div className="flex items-center justify-between mb-5">
        <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>{label}</p>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: accent }} />
        </div>
      </div>

      <div className="flex items-end gap-1.5 mb-5">
        <span style={{ fontSize: '42px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
          {value ?? '—'}
        </span>
        <span style={{ fontSize: '16px', color: '#9CA3AF', marginBottom: '4px' }}>j</span>
      </div>

      <div style={{ borderTop: '1px solid #F2F4F7', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '10px 12px' }}>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>Acquis</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{acquis ?? '—'} j</p>
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '10px 12px' }}>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>Pris</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{pris ?? '—'} j</p>
        </div>
      </div>

      {/* Barre de progression */}
      {acquis > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ height: '4px', background: '#F2F4F7', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px', background: accent,
              width: `${Math.min(100, ((pris || 0) / acquis) * 100)}%`,
              transition: 'width 0.6s ease'
            }} />
          </div>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
            {acquis > 0 ? Math.round(((pris || 0) / acquis) * 100) : 0}% utilisés
          </p>
        </div>
      )}
    </div>
  )
}

function QuickStat({ label, value, icon, accent, bg }) {
  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '20px 24px',
      border: '1px solid #EAECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: '16px'
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500, marginBottom: '2px' }}>{label}</p>
        <p style={{ fontSize: '28px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [soldes, setSoldes] = useState(null)
  const [employe, setEmploye] = useState(null)
  const [equipe, setEquipe] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboard() }, [])

  const fetchDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: emp } = await supabase.from('employes').select('*').eq('email', user.email).single()
    setEmploye(emp)

    if (emp) {
      const annee = new Date().getFullYear()
      const isManager = emp.role === 'manager' || emp.role === 'admin'

      if (isManager) {
        const { data: employes } = await supabase.from('employes').select('id, nom, prenom, poste, matricule').order('nom')
        const { data: tousLesSoldes } = await supabase.from('soldes_conges').select('*').eq('annee', annee)
        const { data: absEnAttente } = await supabase.from('absences').select('employe_id').eq('statut', 'En attente')

        const equipeData = (employes || []).map(e => {
          const solde = tousLesSoldes?.find(s => s.employe_id === e.id)
          const demandesEnAttente = absEnAttente?.filter(a => a.employe_id === e.id).length || 0
          const { data: avatarData } = supabase.storage.from('avatars').getPublicUrl(`${e.id}/avatar`)
          return { ...e, solde, demandesEnAttente, avatarUrl: avatarData.publicUrl }
        })
        setEquipe(equipeData)
      } else {
        const { data: soldesData } = await supabase.from('soldes_conges').select('*').eq('employe_id', emp.id).eq('annee', annee).single()
        setSoldes(soldesData)
      }
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '3px solid #E5E7EB', borderTopColor: '#4F7EF7',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
          }} />
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Chargement…</p>
        </div>
      </div>
    )
  }

  const isManager = employe?.role === 'manager' || employe?.role === 'admin'
  const heure = new Date().getHours()
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const initiales = `${employe?.prenom?.[0] || ''}${employe?.nom?.[0] || ''}`.toUpperCase()

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* HEADER */}
      <div style={{ marginBottom: '36px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
          background: '#EEF2FF', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#4F46E5'
        }}>
          {initiales}
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
            {salutation}, {employe?.prenom} 👋
          </h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>
            {isManager ? "Vue d'ensemble de votre équipe" : "Votre espace personnel"} · {dateStr}
          </p>
        </div>
      </div>

      {/* VUE MANAGER */}
      {isManager && (
        <div>
          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <QuickStat label="Salariés" value={equipe.length} icon="👥" accent="#4F7EF7" bg="#EEF2FF" />
            <QuickStat label="Demandes en attente" value={equipe.reduce((a, e) => a + e.demandesEnAttente, 0)} icon="⏳" accent="#F59E0B" bg="#FFFBEB" />
            <QuickStat label="Année en cours" value={new Date().getFullYear()} icon="📆" accent="#10B981" bg="#F0FDF4" />
          </div>

          {/* Tableau */}
          <div style={{
            background: 'white', borderRadius: '16px',
            border: '1px solid #EAECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F2F4F7' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Compteurs de l'équipe</h2>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{equipe.length} salarié(s) · {new Date().getFullYear()}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  {['Matricule', 'Salarié', 'Poste', 'CP N-1', 'CP N', 'RTT', 'À valider'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 20px', textAlign: i >= 3 ? 'center' : 'left',
                      fontSize: '11px', fontWeight: 600, color: '#9CA3AF',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: '1px solid #F2F4F7'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipe.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, fontFamily: 'monospace',
                        background: '#F3F4F6', color: '#6B7280',
                        padding: '3px 8px', borderRadius: '6px'
                      }}>
                        {emp.matricule || '—'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                          background: '#EEF2FF', overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <img src={emp.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#4F46E5', display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            {emp.prenom?.[0]}{emp.nom?.[0]}
                          </span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{emp.prenom} {emp.nom}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px', fontSize: '13px', color: '#6B7280' }}>{emp.poste || '—'}</td>

                    {[
                      { val: emp.solde?.cp_n1_solde ?? emp.solde?.cp_n1_force, bg: '#EFF6FF', color: '#2563EB' },
                      { val: emp.solde?.cp_n_solde ?? emp.solde?.cp_n_force, bg: '#EEF2FF', color: '#4F46E5' },
                      { val: emp.solde?.rtt_solde ?? emp.solde?.rtt_force, bg: '#F0FDF4', color: '#16A34A' },
                    ].map(({ val, bg, color }, i) => (
                      <td key={i} style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '44px', height: '28px', borderRadius: '8px',
                          fontSize: '13px', fontWeight: 700, background: bg, color
                        }}>
                          {val ?? '—'}
                        </span>
                      </td>
                    ))}

                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      {emp.demandesEnAttente > 0 ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: '#FFFBEB', color: '#B45309',
                          fontSize: '12px', fontWeight: 600,
                          padding: '4px 10px', borderRadius: '20px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }} />
                          {emp.demandesEnAttente}
                        </span>
                      ) : (
                        <span style={{ color: '#E5E7EB', fontSize: '14px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VUE SALARIÉ */}
      {!isManager && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <StatCard
            label="CP N-1 restants"
            value={soldes?.cp_n1_solde ?? soldes?.cp_n1_force}
            acquis={soldes?.cp_n1_acquis}
            pris={soldes?.cp_n1_pris}
            accent="#4F7EF7"
            iconBg="#EEF2FF"
          />
          <StatCard
            label="CP N restants"
            value={soldes?.cp_n_solde ?? soldes?.cp_n_force}
            acquis={soldes?.cp_n_acquis}
            pris={soldes?.cp_n_pris}
            accent="#6366F1"
            iconBg="#EEF2FF"
          />
          <StatCard
            label="RTT restants"
            value={soldes?.rtt_solde ?? soldes?.rtt_force}
            acquis={soldes?.rtt_acquis}
            pris={soldes?.rtt_pris}
            accent="#10B981"
            iconBg="#F0FDF4"
          />
        </div>
      )}
    </div>
  )
}
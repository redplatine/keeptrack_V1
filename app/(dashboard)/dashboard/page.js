'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function StatCard({ label, value, acquis, pris, accent, iconBg }) {
  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '24px',
      border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: '#8C8480', fontWeight: 500, margin: 0 }}>{label}</p>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: accent }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '20px' }}>
        <span style={{ fontSize: '42px', fontWeight: 700, color: '#1C1917', lineHeight: 1 }}>{value ?? '—'}</span>
        <span style={{ fontSize: '16px', color: '#A8A29E', marginBottom: '4px' }}>j</span>
      </div>
      <div style={{ borderTop: '1px solid #F0EDE9', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ background: '#FAF8F6', borderRadius: '10px', padding: '10px 12px' }}>
          <p style={{ fontSize: '11px', color: '#A8A29E', margin: '0 0 2px' }}>Acquis</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#44403C', margin: 0 }}>{acquis ?? '—'} j</p>
        </div>
        <div style={{ background: '#FAF8F6', borderRadius: '10px', padding: '10px 12px' }}>
          <p style={{ fontSize: '11px', color: '#A8A29E', margin: '0 0 2px' }}>Pris</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#44403C', margin: 0 }}>{pris ?? '—'} j</p>
        </div>
      </div>
      {acquis > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ height: '4px', background: '#F0EDE9', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', background: accent, width: `${Math.min(100, ((pris || 0) / acquis) * 100)}%`, transition: 'width 0.6s ease' }} />
          </div>
          <p style={{ fontSize: '11px', color: '#A8A29E', marginTop: '4px' }}>
            {Math.round(((pris || 0) / acquis) * 100)}% utilisés
          </p>
        </div>
      )}
    </div>
  )
}

function QuickStat({ label, value, icon, bg }) {
  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '20px 24px',
      border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: '16px'
    }}>
      <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '12px', color: '#A8A29E', fontWeight: 500, margin: '0 0 3px' }}>{label}</p>
        <p style={{ fontSize: '30px', fontWeight: 700, color: '#1C1917', lineHeight: 1, margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

// Cellule avec solde + détail acquis/pris
function SoldeCell({ solde, acquis, pris, color, bg }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        title="Cliquer pour voir le détail"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '44px', height: '28px', borderRadius: '8px',
          fontSize: '14px', fontWeight: 700, background: bg, color, padding: '0 10px',
          cursor: 'pointer', border: `1px solid ${open ? color : 'transparent'}`,
          transition: 'border 0.15s',
        }}>
        {solde ?? '—'}
      </div>
      {open && (
        <div style={{ display: 'flex', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#A8A29E', background: '#FAF8F6', padding: '2px 6px', borderRadius: '5px' }}>
            A: {acquis ?? '—'}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#A8A29E', background: '#FAF8F6', padding: '2px 6px', borderRadius: '5px' }}>
            P: {pris ?? '—'}
          </span>
        </div>
      )}
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
        }).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
        setEquipe(equipeData)
      } else {
        const { data: soldesData } = await supabase.from('soldes_conges').select('*').eq('employe_id', emp.id).eq('annee', annee).single()
        setSoldes(soldesData)
      }
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#A8A29E', fontSize: '14px' }}>Chargement…</p>
      </div>
    </div>
  )

  const isManager = employe?.role === 'manager' || employe?.role === 'admin'

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* VUE MANAGER */}
      {isManager && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <QuickStat label="Salariés"            value={equipe.length}                                       icon="👥" bg="#F0EDE9" />
            <QuickStat label="Demandes en attente" value={equipe.reduce((a, e) => a + e.demandesEnAttente, 0)} icon="⏳" bg="#FFFBEB" />
            <QuickStat label="Année en cours"      value={new Date().getFullYear()}                            icon="📆" bg="#F0FDF4" />
          </div>

          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '22px 28px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: 0 }}>Compteurs de l'équipe</h2>
                <p style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px' }}>
                  {equipe.length} salarié(s) · {new Date().getFullYear()} · cliquez sur un solde pour voir acquis / pris
                </p>
              </div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} title="Données à jour" />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAF8F6' }}>
                  {[
                    { label: 'Matricule', align: 'left' },
                    { label: 'Salarié',   align: 'left' },
                    { label: 'Poste',     align: 'left' },
                    { label: 'CP N-1',    align: 'center', color: '#8B4A5A' },
                    { label: 'CP N',      align: 'center', color: '#4F7EF7' },
                    { label: 'RTT',       align: 'center', color: '#16A34A' },
                    { label: 'Récup',     align: 'center', color: '#B45309' },
                    { label: 'À valider', align: 'center', color: '#78716C' },
                  ].map(h => (
                    <th key={h.label} style={{
                      padding: '13px 20px', textAlign: h.align,
                      fontSize: '11px', fontWeight: 600, color: h.color || '#A8A29E',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      borderBottom: '1px solid #F0EDE9'
                    }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipe.map((emp) => (
                  <tr key={emp.id}
                    style={{ borderBottom: '1px solid #FAF8F6', transition: 'background 0.1s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'monospace', background: '#F0EDE9', color: '#78716C', padding: '4px 9px', borderRadius: '6px' }}>
                        {emp.matricule || '—'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: '#F2E6E9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={emp.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B2F42', display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            {emp.prenom?.[0]}{emp.nom?.[0]}
                          </span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917' }}>{emp.prenom} {emp.nom}</span>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#78716C' }}>{emp.poste || '—'}</td>

                    {/* CP N-1, CP N, RTT avec détail acquis/pris au clic */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <SoldeCell solde={emp.solde?.cp_n1_solde} acquis={emp.solde?.cp_n1_acquis} pris={emp.solde?.cp_n1_pris} color="#8B4A5A" bg="#F9EEF1" />
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <SoldeCell solde={emp.solde?.cp_n_solde} acquis={emp.solde?.cp_n_acquis} pris={emp.solde?.cp_n_pris} color="#4F7EF7" bg="#EFF6FF" />
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <SoldeCell solde={emp.solde?.rtt_solde} acquis={emp.solde?.rtt_acquis} pris={emp.solde?.rtt_pris} color="#16A34A" bg="#F0FDF4" />
                    </td>

                    {/* Récup — solde uniquement, pas de détail */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: '44px', height: '28px', borderRadius: '8px',
                        fontSize: '14px', fontWeight: 700, background: '#FFFBEB', color: '#B45309', padding: '0 10px'
                      }}>
                        {emp.solde?.recup_solde ?? '—'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      {emp.demandesEnAttente > 0 ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          background: '#FFFBEB', color: '#B45309', fontSize: '12px', fontWeight: 600,
                          padding: '5px 12px', borderRadius: '20px', border: '1px solid #FDE68A'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }} />
                          {emp.demandesEnAttente} en attente
                        </span>
                      ) : (
                        <span style={{ color: '#D6D3D1', fontSize: '14px' }}>—</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <StatCard label="CP N-1 restants"      value={soldes?.cp_n1_solde}  acquis={soldes?.cp_n1_acquis} pris={soldes?.cp_n1_pris}  accent="#8B4A5A" iconBg="#F9EEF1" />
          <StatCard label="CP N restants"         value={soldes?.cp_n_solde}   acquis={soldes?.cp_n_acquis}  pris={soldes?.cp_n_pris}   accent="#4F7EF7" iconBg="#EFF6FF" />
          <StatCard label="RTT restants"          value={soldes?.rtt_solde}    acquis={soldes?.rtt_acquis}   pris={soldes?.rtt_pris}    accent="#16A34A" iconBg="#F0FDF4" />
          <StatCard label="Récupération restants" value={soldes?.recup_solde}  acquis={soldes?.recup_acquis} pris={soldes?.recup_pris}  accent="#B45309" iconBg="#FFFBEB" />
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function Avatar({ id, prenom, nom, size = 36 }) {
  const [error, setError] = useState(false)
  const { data } = supabase.storage.from('avatars').getPublicUrl(`${id}/avatar`)
  const url = data.publicUrl
  const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0, background: 'linear-gradient(135deg, #F2E6E9, #E8D5D9)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!error
        ? <img src={`${url}?t=${id}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setError(true)} />
        : <span style={{ fontSize: size * 0.32, fontWeight: 800, color: '#6B2F42', letterSpacing: '-0.5px' }}>{initiales}</span>
      }
    </div>
  )
}

function StatCard({ label, value, acquis, pris, accent, bg }) {
  const pct = acquis > 0 ? Math.min(100, Math.round(((pris || 0) / acquis) * 100)) : 0
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8E4E0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
      <div style={{ padding: '22px 22px 18px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
          <span style={{ fontSize: 11, color: '#A8A29E', fontWeight: 500 }}>{pct}% utilisés</span>
        </div>
        <p style={{ fontSize: 46, fontWeight: 800, color: '#1C1917', margin: '0 0 4px', lineHeight: 1 }}>
          {value ?? '—'}<span style={{ fontSize: 18, color: '#C4B5A5', fontWeight: 400, marginLeft: 5 }}>j</span>
        </p>
        <p style={{ fontSize: 12, color: '#A8A29E', margin: '0 0 16px' }}>jours restants</p>
        <div style={{ height: 6, background: `${accent}22`, borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', background: accent, borderRadius: 99, width: `${pct}%`, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Acquis', acquis], ['Pris', pris]].map(([l, v]) => (
            <div key={l} style={{ background: bg, borderRadius: 10, padding: '9px 12px' }}>
              <p style={{ fontSize: 10, color: accent, margin: '0 0 2px', fontWeight: 700, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: accent, margin: 0 }}>{v ?? '—'} j</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LigneSalarie({ emp }) {
  const [open, setOpen] = useState(false)
  const compteurs = [
    { label: 'SOLDE CP N-1', s: emp.solde?.cp_n1_solde, a: emp.solde?.cp_n1_acquis, p: emp.solde?.cp_n1_pris, color: '#8B4A5A', bg: '#F9EEF1' },
    { label: 'SOLDE CP N',   s: emp.solde?.cp_n_solde,  a: emp.solde?.cp_n_acquis,  p: emp.solde?.cp_n_pris,  color: '#4F7EF7', bg: '#EFF6FF' },
    { label: 'SOLDE RTT',    s: emp.solde?.rtt_solde,   a: emp.solde?.rtt_acquis,   p: emp.solde?.rtt_pris,   color: '#16A34A', bg: '#F0FDF4' },
    { label: 'SOLDE Récup',  s: emp.solde?.recup_solde, a: emp.solde?.recup_acquis, p: emp.solde?.recup_pris, color: '#B45309', bg: '#FFFBEB' },
  ]
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,35,48,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>

      {/* Ligne principale */}
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 110px 110px 28px', gap: 8, padding: '13px 16px', alignItems: 'center', cursor: 'pointer' }}>

        {/* Identité */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar id={emp.id} prenom={emp.prenom} nom={emp.nom} size={34} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1917', margin: 0 }}>{emp.prenom} {emp.nom}</p>
            <p style={{ fontSize: 11, color: '#A8A29E', margin: 0 }}>{emp.poste} · <span style={{ fontFamily: 'monospace', fontSize: 10, background: '#F0EDE9', color: '#78716C', padding: '1px 5px', borderRadius: 4 }}>{emp.matricule || '—'}</span></p>
          </div>
        </div>

        {/* Soldes */}
        {compteurs.map((x, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: x.color, background: x.bg, padding: '3px 10px', borderRadius: 8, minWidth: 40, textAlign: 'center', display: 'block' }}>
              {x.s ?? '—'}
            </span>
            {x.a > 0 && (
              <div style={{ width: 40, height: 3, background: '#F0EDE9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: x.color, borderRadius: 99, width: `${Math.min(100, ((x.p || 0) / x.a) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}

        {/* Demandes */}
        <div style={{ textAlign: 'center' }}>
          {emp.demandesEnAttente > 0
            ? <span style={{ fontSize: 11, fontWeight: 700, background: '#FFFBEB', color: '#B45309', padding: '4px 10px', borderRadius: 20, border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>⏳ {emp.demandesEnAttente}</span>
            : <span style={{ color: '#BBF7D0', fontSize: 16 }}>✓</span>
          }
        </div>

        {/* Chevron */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4B5A5" strokeWidth="2.5"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Détail dépliable */}
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #F5F0F2' }}>
          {compteurs.map((x, i) => (
            <div key={i} style={{ padding: '14px 16px', background: x.bg, borderRight: i < 3 ? '1px solid rgba(255,255,255,0.7)' : 'none' }}>
              <p style={{ fontSize: 10, color: x.color, margin: '0 0 10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>{x.label}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[['Acquis', x.a], ['Pris', x.p], ['Solde', x.s]].map(([l, v]) => (
                  <div key={l}>
                    <p style={{ fontSize: 9, color: x.color, margin: '0 0 2px', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>{l}</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: x.color, margin: 0 }}>{v ?? '—'}</p>
                  </div>
                ))}
              </div>
              {x.a > 0 && (
                <div style={{ marginTop: 10, height: 4, background: `${x.color}22`, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: x.color, borderRadius: 99, width: `${Math.min(100, ((x.p || 0) / x.a) * 100)}%` }} />
                </div>
              )}
            </div>
          ))}
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
        const equipeData = (employes || []).map(e => ({
          ...e,
          solde: tousLesSoldes?.find(s => s.employe_id === e.id),
          demandesEnAttente: absEnAttente?.filter(a => a.employe_id === e.id).length || 0,
        })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
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
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const isManager = employe?.role === 'manager' || employe?.role === 'admin'

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* ── VUE MANAGER ── */}
      {isManager && (
        <div>
          {/* Stats rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Salariés',            value: equipe.length, color: '#6B2F42', bg: '#F9EEF1', icon: '👥' },
              { label: 'Demandes en attente', value: equipe.reduce((a, e) => a + e.demandesEnAttente, 0), color: '#B45309', bg: '#FFFBEB', icon: '⏳' },
              { label: 'Année en cours',      value: new Date().getFullYear(), color: '#16A34A', bg: '#F0FDF4', icon: '📆' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 14, padding: '16px 20px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <p style={{ fontSize: 10, color: '#A8A29E', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#1C1917', margin: 0, lineHeight: 1 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Labels colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 110px 110px 28px', gap: 8, padding: '10px 16px', marginBottom: 6, background: 'white', borderRadius: 10, border: '1px solid #E8E4E0' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Salarié</span>
            {['Solde CP N-1', 'Solde CP N', 'Solde RTT', 'Solde Récup'].map((l, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, color: ['#8B4A5A', '#4F7EF7', '#16A34A', '#B45309'][i], textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>{l}</span>
            ))}
            <span style={{ fontSize: 11, fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>Statut</span>
            <span />
          </div>

          {/* Lignes salariés */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {equipe.map(emp => <LigneSalarie key={emp.id} emp={emp} />)}
          </div>

          <p style={{ fontSize: 11, color: '#C4B5A5', textAlign: 'center', marginTop: 12 }}>
            Cliquez sur une ligne pour afficher le détail acquis / pris / solde
          </p>
        </div>
      )}

      {/* ── VUE SALARIÉ ── */}
      {!isManager && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Solde CP N-1', value: soldes?.cp_n1_solde, acquis: soldes?.cp_n1_acquis, pris: soldes?.cp_n1_pris, accent: '#8B4A5A', bg: '#F9EEF1' },
            { label: 'Solde CP N',   value: soldes?.cp_n_solde,  acquis: soldes?.cp_n_acquis,  pris: soldes?.cp_n_pris,  accent: '#4F7EF7', bg: '#EFF6FF' },
            { label: 'Solde RTT',    value: soldes?.rtt_solde,   acquis: soldes?.rtt_acquis,   pris: soldes?.rtt_pris,   accent: '#16A34A', bg: '#F0FDF4' },
            { label: 'Solde Récup',  value: soldes?.recup_solde, acquis: soldes?.recup_acquis, pris: soldes?.recup_pris, accent: '#B45309', bg: '#FFFBEB' },
          ].map((s, i) => <StatCard key={i} {...s} />)}
        </div>
      )}
    </div>
  )
}
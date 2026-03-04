'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useState, useEffect, useRef } from 'react'

const NAV_ICONS = {
  '/profil': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  '/dashboard': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  '/calendrier': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  '/employes': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  '/absences': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  ),
  '/messages': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  '/contact': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.48 2 2 0 0 1 3.58 2.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  '/societe': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
}

const SIDEBAR = {
  bg:          '#4A2330',
  border:      '#5E2D3C',
  hoverBg:     '#5C2D3A',
  activeBg:    '#6B2F42',
  activeColor: '#F9C7D0',
  textPrimary: '#E8D5D9',
  textMuted:   '#9E737D',
  iconMuted:   '#7A5560',
  logoBg:      'rgba(255,255,255,0.08)',
  userCardBg:  'rgba(0,0,0,0.15)',
  logoutHover: 'rgba(220,38,38,0.18)',
}

const ROLE_CONFIG = {
  admin:   { label: 'Administrateur', bg: 'rgba(249,199,208,0.18)', color: '#F9C7D0' },
  manager: { label: 'Manager',        bg: 'rgba(147,197,253,0.18)', color: '#BAD9FC' },
  salarie: { label: 'Salarié',        bg: 'rgba(134,239,172,0.18)', color: '#A7F3C0' },
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [absencesEnAttente, setAbsencesEnAttente] = useState(0)
  const [messagesOuverts, setMessagesOuverts] = useState(0)
  const [clochePaneau, setClochePaneau] = useState(false)
  const clocheRef = useRef(null)

  const totalNotifs = absencesEnAttente + messagesOuverts

  useEffect(() => { fetchRole() }, [])

  // Fermer le panneau si clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (clocheRef.current && !clocheRef.current.contains(e.target)) {
        setClochePaneau(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase.from('employes').select('role, prenom, nom').eq('email', user.email).single()
    if (emp) {
      setRole(emp.role)
      setPrenom(emp.prenom || '')
      setNom(emp.nom || '')
      if (emp.role === 'admin' || emp.role === 'manager') {
        fetchAbsencesEnAttente()
        setupRealtimeAbsences()
      }
      if (emp.role === 'admin') {
        fetchMessagesOuverts()
        setupRealtimeMessages()
      }
    }
  }

  const fetchAbsencesEnAttente = async () => {
    const { count } = await supabase.from('absences').select('*', { count: 'exact', head: true }).eq('statut', 'En attente')
    setAbsencesEnAttente(count || 0)
  }

  const fetchMessagesOuverts = async () => {
    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('statut', 'Ouvert')
    setMessagesOuverts(count || 0)
  }

  // Realtime — absences
  const setupRealtimeAbsences = () => {
    supabase.channel('absences-notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences' }, () => {
        fetchAbsencesEnAttente()
      })
      .subscribe()
  }

  // Realtime — messages
  const setupRealtimeMessages = () => {
    supabase.channel('messages-notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessagesOuverts()
      })
      .subscribe()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/profil',    label: 'Mon profil',        roles: ['salarie'] },
    { href: '/dashboard', label: 'Tableau de bord',   roles: ['admin', 'manager'] },
    { href: '/calendrier',label: 'Calendrier',         roles: ['admin', 'manager', 'salarie'] },
    { href: '/employes',  label: 'Employés',           roles: ['admin'] },
    { href: '/absences',  label: 'Absences',           roles: ['admin', 'manager', 'salarie'], badge: absencesEnAttente },
    { href: '/messages',  label: 'Messages',           roles: ['admin'], badge: messagesOuverts },
    { href: '/contact',   label: 'Contact & Support',  roles: ['salarie'] },
    { href: '/societe',   label: 'Société',            roles: ['admin', 'manager', 'salarie'] },
  ]

  const navFiltres = navItems.filter(item => role && item.roles.includes(role))
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.salarie
  const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
  const isAdmin = role === 'admin' || role === 'manager'

  return (
    <div className="min-h-screen flex" style={{ background: '#F7F5F3', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* SIDEBAR */}
      <div className="w-60 flex flex-col fixed h-full" style={{
        background: SIDEBAR.bg,
        borderRight: `1px solid ${SIDEBAR.border}`,
        boxShadow: '2px 0 16px rgba(0,0,0,0.12)'
      }}>

        {/* LOGO + CLOCHE */}
        <div className="px-5 pt-7 pb-5" style={{ borderBottom: `1px solid ${SIDEBAR.border}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: SIDEBAR.logoBg, border: '1px solid rgba(255,255,255,0.12)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SIDEBAR.activeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="8" y1="14" x2="16" y2="14"/>
                  <line x1="8" y1="18" x2="12" y2="18"/>
                </svg>
              </div>
              <div>
                <h1 className="font-bold leading-tight" style={{ fontSize: '15px', color: '#F0E8EA', letterSpacing: '-0.3px' }}>KeepTrack</h1>
                <p style={{ fontSize: '11px', color: SIDEBAR.textMuted, lineHeight: 1.3 }}>GTA Specialist App</p>
              </div>
            </div>

            {/* CLOCHE — visible admin/manager uniquement */}
            {isAdmin && (
              <div ref={clocheRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setClochePaneau(p => !p)}
                  style={{
                    position: 'relative', width: '32px', height: '32px',
                    borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: clochePaneau ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = clochePaneau ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={totalNotifs > 0 ? '#F9C7D0' : SIDEBAR.iconMuted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {/* Badge total */}
                  {totalNotifs > 0 && (
                    <span style={{
                      position: 'absolute', top: '-4px', right: '-4px',
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: '#DC2626', color: 'white',
                      fontSize: '10px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid ${SIDEBAR.bg}`,
                    }}>
                      {totalNotifs > 9 ? '9+' : totalNotifs}
                    </span>
                  )}
                </button>

                {/* PANNEAU DÉROULANT */}
                {clochePaneau && (
                  <div style={{
                    position: 'absolute', top: '40px', right: '-8px',
                    width: '220px', background: 'white', borderRadius: '14px',
                    border: '1px solid #E8E4E0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 100, overflow: 'hidden',
                  }}>
{/* MAIN CONTENT */}
      <div className="flex-1 ml-60 overflow-auto min-h-screen" style={{ background: '#F7F5F3' }}>

        {/* BANDEAU DÉCORATIF */}
        <div style={{
          position: 'relative', height: '72px', overflow: 'hidden',
          background: 'linear-gradient(135deg, #4A2330 0%, #6B2F42 60%, #8B4A5A 100%)',
          flexShrink: 0,
        }}>
          {/* Motifs SVG incrustés — formes géométriques transparentes style Outlook */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.13 }}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Cercles */}
            <circle cx="40"  cy="20" r="28" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="40"  cy="20" r="14" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="130" cy="55" r="20" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="280" cy="10" r="32" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="280" cy="10" r="18" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="500" cy="60" r="24" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="720" cy="15" r="30" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="720" cy="15" r="15" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="920" cy="50" r="22" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="1100" cy="20" r="28" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="1300" cy="45" r="20" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="1500" cy="10" r="34" fill="none" stroke="white" strokeWidth="1.5"/>

            {/* Hexagones */}
            <polygon points="90,5 108,15 108,35 90,45 72,35 72,15"   fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="200,20 214,28 214,44 200,52 186,44 186,28" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="370,0 388,10 388,30 370,40 352,30 352,10" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="600,15 618,25 618,45 600,55 582,45 582,25" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="820,5 838,15 838,35 820,45 802,35 802,15"  fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="1020,20 1038,30 1038,50 1020,60 1002,50 1002,30" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="1200,0 1218,10 1218,30 1200,40 1182,30 1182,10" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="1400,10 1418,20 1418,40 1400,50 1382,40 1382,20" fill="none" stroke="white" strokeWidth="1.5"/>

            {/* Carrés / losanges */}
            <rect x="155" y="8"  width="26" height="26" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(15 168 21)"/>
            <rect x="320" y="30" width="22" height="22" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(30 331 41)"/>
            <rect x="450" y="5"  width="28" height="28" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(20 464 19)"/>
            <rect x="660" y="35" width="20" height="20" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(45 670 45)"/>
            <rect x="860" y="8"  width="26" height="26" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(10 873 21)"/>
            <rect x="1060" y="28" width="24" height="24" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(35 1072 40)"/>
            <rect x="1250" y="5"  width="28" height="28" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(22 1264 19)"/>
            <rect x="1450" y="30" width="22" height="22" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(40 1461 41)"/>

            {/* Triangles */}
            <polygon points="240,50 256,22 272,50" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="410,15 426,42 394,42" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="550,5  566,32 534,32" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="750,40 766,12 782,40" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="980,8  996,35 964,35" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="1150,45 1166,18 1182,45" fill="none" stroke="white" strokeWidth="1.5"/>
            <polygon points="1350,5  1366,32 1334,32" fill="none" stroke="white" strokeWidth="1.5"/>

            {/* Croix / plus */}
            <line x1="340" y1="8"  x2="340" y2="24" stroke="white" strokeWidth="1.5"/>
            <line x1="332" y1="16" x2="348" y2="16" stroke="white" strokeWidth="1.5"/>
            <line x1="640" y1="5"  x2="640" y2="21" stroke="white" strokeWidth="1.5"/>
            <line x1="632" y1="13" x2="648" y2="13" stroke="white" strokeWidth="1.5"/>
            <line x1="880" y1="30" x2="880" y2="46" stroke="white" strokeWidth="1.5"/>
            <line x1="872" y1="38" x2="888" y2="38" stroke="white" strokeWidth="1.5"/>
            <line x1="1120" y1="8"  x2="1120" y2="24" stroke="white" strokeWidth="1.5"/>
            <line x1="1112" y1="16" x2="1128" y2="16" stroke="white" strokeWidth="1.5"/>
            <line x1="1460" y1="50" x2="1460" y2="66" stroke="white" strokeWidth="1.5"/>
            <line x1="1452" y1="58" x2="1468" y2="58" stroke="white" strokeWidth="1.5"/>
          </svg>

          {/* Dégradé de fondu bas pour transition douce vers le contenu */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '32px',
            background: 'linear-gradient(to bottom, transparent, #F7F5F3)'
          }} />
        </div>

        {children}
      </div>


                    {/* Header panneau */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0EDE9' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#1C1917', margin: 0 }}>Notifications</p>
                      <p style={{ fontSize: '11px', color: '#A8A29E', margin: '2px 0 0' }}>
                        {totalNotifs > 0 ? `${totalNotifs} en attente` : 'Tout est à jour'}
                      </p>
                    </div>

                    {/* Ligne absences */}
                    <Link href="/absences" onClick={() => setClochePaneau(false)}
                      style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '12px 16px', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', cursor: 'pointer',
                        borderBottom: '1px solid #FAF8F6', transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 500, color: '#1C1917', margin: 0 }}>Absences</p>
                            <p style={{ fontSize: '11px', color: '#A8A29E', margin: 0 }}>en attente de validation</p>
                          </div>
                        </div>
                        <span style={{
                          background: absencesEnAttente > 0 ? 'rgba(220,38,38,0.1)' : '#F0EDE9',
                          color: absencesEnAttente > 0 ? '#DC2626' : '#A8A29E',
                          fontSize: '12px', fontWeight: 700,
                          padding: '2px 8px', borderRadius: '20px', minWidth: '24px', textAlign: 'center'
                        }}>
                          {absencesEnAttente}
                        </span>
                      </div>
                    </Link>

                    {/* Ligne messages — admin seulement */}
                    {role === 'admin' && (
                      <Link href="/messages" onClick={() => setClochePaneau(false)}
                        style={{ textDecoration: 'none' }}>
                        <div style={{
                          padding: '12px 16px', display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 500, color: '#1C1917', margin: 0 }}>Messages</p>
                              <p style={{ fontSize: '11px', color: '#A8A29E', margin: 0 }}>ouverts sans réponse</p>
                            </div>
                          </div>
                          <span style={{
                            background: messagesOuverts > 0 ? '#FFFBEB' : '#F0EDE9',
                            color: messagesOuverts > 0 ? '#B45309' : '#A8A29E',
                            fontSize: '12px', fontWeight: 700,
                            padding: '2px 8px', borderRadius: '20px', minWidth: '24px', textAlign: 'center'
                          }}>
                            {messagesOuverts}
                          </span>
                        </div>
                      </Link>
                    )}

                    {/* Footer — tout à jour */}
                    {totalNotifs === 0 && (
                      <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '20px' }}>✅</span>
                        <p style={{ fontSize: '12px', color: '#A8A29E', margin: '6px 0 0' }}>Aucune action requise</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p style={{
            fontSize: '10px', fontWeight: 600,
            color: SIDEBAR.textMuted,
            letterSpacing: '0.08em',
            padding: '4px 10px 8px',
            textTransform: 'uppercase'
          }}>
            Navigation
          </p>

          {navFiltres.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center justify-between rounded-xl transition-all duration-150"
                style={{
                  padding: '8px 10px',
                  background: isActive ? SIDEBAR.activeBg : 'transparent',
                  color: isActive ? SIDEBAR.activeColor : SIDEBAR.textPrimary,
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '13.5px',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = SIDEBAR.hoverBg
                    e.currentTarget.style.color = '#F0E8EA'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = SIDEBAR.textPrimary
                  }
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span style={{ color: isActive ? SIDEBAR.activeColor : SIDEBAR.iconMuted }}>
                    {NAV_ICONS[item.href]}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span style={{
                    background: 'rgba(220,38,38,0.25)',
                    color: '#FCA5A5',
                    fontSize: '11px', fontWeight: 700,
                    padding: '1px 7px', borderRadius: '20px'
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* USER + LOGOUT */}
        <div className="px-3 pb-5" style={{ borderTop: `1px solid ${SIDEBAR.border}`, paddingTop: '12px' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1" style={{ background: SIDEBAR.userCardBg }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: roleConfig.bg, color: roleConfig.color, border: '1px solid rgba(255,255,255,0.1)' }}>
              {initiales || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#F0E8EA', lineHeight: 1.3 }} className="truncate">
                {prenom} {nom}
              </p>
              <p style={{ fontSize: '11px', color: SIDEBAR.textMuted, lineHeight: 1.3 }}>{roleConfig.label}</p>
            </div>
          </div>

          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-xl transition-all duration-150"
            style={{ padding: '8px 10px', color: SIDEBAR.textMuted, fontSize: '13.5px', fontWeight: 400 }}
            onMouseEnter={e => {
              e.currentTarget.style.background = SIDEBAR.logoutHover
              e.currentTarget.style.color = '#FCA5A5'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = SIDEBAR.textMuted
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-60 overflow-auto min-h-screen" style={{ background: '#F7F5F3' }}>
        {children}
      </div>
    </div>
  )
}
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useState, useEffect, useRef } from 'react'
const SUPER_ADMIN_EMAIL = 'alexandre.aubry.dumand@gmail.com'
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
  '/compteurs': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
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
  '/documents': (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
  ),
  '/superadmin': (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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

const PAGE_META = {
  '/dashboard':  { title: 'Tableau de bord',    sub: (p, r) => r === 'admin' || r === 'manager' ? "Vue d'ensemble de votre équipe" : 'Votre espace personnel' },
  '/profil':     { title: 'Mon profil',          sub: () => 'Vos informations personnelles et contractuelles' },
  '/calendrier': { title: 'Calendrier',           sub: () => 'Visualisez les absences de votre équipe' },
  '/employes':   { title: 'Employés',             sub: () => 'Gérez les membres de votre équipe' },
  '/absences':   { title: 'Absences',             sub: () => "Gérez et suivez les demandes d'absence" },
  '/compteurs':  { title: 'Compteurs',            sub: () => 'Ajustez les soldes de congés de votre équipe' },
  '/messages':   { title: 'Messages & Support',   sub: () => 'Consultez et répondez aux messages' },
  '/contact':    { title: 'Contact & Support',    sub: () => 'Envoyez un message à votre service RH' },
  '/societe':    { title: 'Société',              sub: () => 'Informations de votre entreprise' },
  '/superadmin': { title: 'Super Admin', sub: () => 'Gestion des entreprises KeepTrack' },
}

const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [absencesEnAttente, setAbsencesEnAttente] = useState(0)
  const [messagesOuverts, setMessagesOuverts] = useState(0)
  const [demandesRecup, setDemandesRecup] = useState(0)
  const [clochePaneau, setClochePaneau] = useState(false)
  const clocheRef = useRef(null)

  const totalNotifs = absencesEnAttente + messagesOuverts + demandesRecup

  useEffect(() => { fetchRole() }, [])

  useEffect(() => {
    const handler = (e) => {
      if (clocheRef.current && !clocheRef.current.contains(e.target)) setClochePaneau(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchRole = async () => {
    const [userEmail, setUserEmail] = useState('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserEmail(user.email)
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
        fetchDemandesRecup()
        setupRealtimeMessages()
        setupRealtimeRecup()
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

  const fetchDemandesRecup = async () => {
    const { count } = await supabase.from('demandes_recup').select('*', { count: 'exact', head: true }).eq('statut', 'En attente')
    setDemandesRecup(count || 0)
  }

  const setupRealtimeAbsences = () => {
    supabase.channel('absences-notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences' }, () => fetchAbsencesEnAttente())
      .subscribe()
  }

  const setupRealtimeMessages = () => {
    supabase.channel('messages-notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchMessagesOuverts())
      .subscribe()
  }

  const setupRealtimeRecup = () => {
    supabase.channel('recup-notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demandes_recup' }, () => fetchDemandesRecup())
      .subscribe()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/profil',     label: 'Mon profil',       roles: ['salarie'] },
    { href: '/dashboard',  label: 'Tableau de bord',  roles: ['admin', 'manager'] },
    { href: '/calendrier', label: 'Calendrier',        roles: ['admin', 'manager', 'salarie'] },
    { href: '/employes',   label: 'Employés',          roles: ['admin'] },
    { href: '/absences',   label: 'Absences',          roles: ['admin', 'manager', 'salarie'], badge: absencesEnAttente },
    { href: '/compteurs',  label: 'Compteurs',         roles: ['admin'], badge: demandesRecup },
    { href: '/messages',   label: 'Messages',          roles: ['admin'], badge: messagesOuverts },
    { href: '/contact',    label: 'Contact & Support', roles: ['salarie'] },
    { href: '/societe',    label: 'Société',           roles: ['admin', 'manager', 'salarie'] },
    { href: '/documents', label: 'Documents', roles: ['admin', 'manager', 'salarie'] },
    { href: '/superadmin', label: 'Super Admin', roles: ['__superadmin__'] },
  ]

  const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL
const navFiltres = [
  ...navItems.filter(item => role && item.roles.includes(role)),
  ...(isSuperAdmin ? [{ href: '/superadmin', label: 'Super Admin', roles: [] }] : [])
]
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.salarie
  const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
  const isAdmin = role === 'admin' || role === 'manager'

  const pageMeta = PAGE_META[pathname]
  const pageTitle = pageMeta?.title || ''
  const pageSub   = pageMeta?.sub ? pageMeta.sub(prenom, role) : ''

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ===================== SIDEBAR ===================== */}
      <div className="w-60 flex flex-col fixed h-full" style={{
        background: SIDEBAR.bg,
        borderRight: `1px solid ${SIDEBAR.border}`,
        boxShadow: '2px 0 16px rgba(0,0,0,0.12)',
        zIndex: 10,
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

            {/* CLOCHE */}
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
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0EDE9' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#1C1917', margin: 0 }}>Notifications</p>
                      <p style={{ fontSize: '11px', color: '#A8A29E', margin: '2px 0 0' }}>
                        {totalNotifs > 0 ? `${totalNotifs} en attente` : 'Tout est à jour'}
                      </p>
                    </div>

                    {/* Absences */}
                    <Link href="/absences" onClick={() => setClochePaneau(false)} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid #FAF8F6', transition: 'background 0.1s' }}
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
                        <span style={{ background: absencesEnAttente > 0 ? 'rgba(220,38,38,0.1)' : '#F0EDE9', color: absencesEnAttente > 0 ? '#DC2626' : '#A8A29E', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', minWidth: '24px', textAlign: 'center' }}>
                          {absencesEnAttente}
                        </span>
                      </div>
                    </Link>

                    {/* Récup */}
                    {role === 'admin' && (
                      <Link href="/compteurs" onClick={() => setClochePaneau(false)} style={{ textDecoration: 'none' }}>
                        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid #FAF8F6', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAF8F6'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 500, color: '#1C1917', margin: 0 }}>Récupérations</p>
                              <p style={{ fontSize: '11px', color: '#A8A29E', margin: 0 }}>demandes en attente</p>
                            </div>
                          </div>
                          <span style={{ background: demandesRecup > 0 ? '#FFFBEB' : '#F0EDE9', color: demandesRecup > 0 ? '#B45309' : '#A8A29E', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', minWidth: '24px', textAlign: 'center' }}>
                            {demandesRecup}
                          </span>
                        </div>
                      </Link>
                    )}

                    {/* Messages */}
                    {role === 'admin' && (
                      <Link href="/messages" onClick={() => setClochePaneau(false)} style={{ textDecoration: 'none' }}>
                        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.1s' }}
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
                          <span style={{ background: messagesOuverts > 0 ? '#FFFBEB' : '#F0EDE9', color: messagesOuverts > 0 ? '#B45309' : '#A8A29E', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', minWidth: '24px', textAlign: 'center' }}>
                            {messagesOuverts}
                          </span>
                        </div>
                      </Link>
                    )}

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
          <p style={{ fontSize: '10px', fontWeight: 600, color: SIDEBAR.textMuted, letterSpacing: '0.08em', padding: '4px 10px 8px', textTransform: 'uppercase' }}>Navigation</p>
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
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = SIDEBAR.hoverBg; e.currentTarget.style.color = '#F0E8EA' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = SIDEBAR.textPrimary } }}
              >
                <div className="flex items-center gap-2.5">
                  <span style={{ color: isActive ? SIDEBAR.activeColor : SIDEBAR.iconMuted }}>
                    {NAV_ICONS[item.href]}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span style={{ background: 'rgba(220,38,38,0.25)', color: '#FCA5A5', fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px' }}>
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
            onMouseEnter={e => { e.currentTarget.style.background = SIDEBAR.logoutHover; e.currentTarget.style.color = '#FCA5A5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = SIDEBAR.textMuted }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* ===================== MAIN CONTENT ===================== */}
      <div className="flex-1 ml-60 min-h-screen" style={{ display: 'flex', flexDirection: 'column', position: 'relative', background: '#F7F5F3' }}>

        {/* FOND C3 */}
        <svg style={{ position: 'fixed', top: 0, left: '240px', right: 0, width: 'calc(100% - 240px)', height: '100vh', pointerEvents: 'none', zIndex: 0 }} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYTop slice">
          <defs>
            <linearGradient id="bgFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#4A2330" stopOpacity="0.72"/>
              <stop offset="22%"  stopColor="#4A2330" stopOpacity="0.28"/>
              <stop offset="45%"  stopColor="#4A2330" stopOpacity="0.07"/>
              <stop offset="100%" stopColor="#4A2330" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="shapeR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#4A2330" stopOpacity="0.85"/>
              <stop offset="100%" stopColor="#4A2330" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="shapeL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6B2F42" stopOpacity="0.75"/>
              <stop offset="100%" stopColor="#6B2F42" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bgFade)"/>
          <circle cx="95%" cy="-20" r="320" fill="none" stroke="url(#shapeR)" strokeWidth="2.5"/>
          <circle cx="95%" cy="-20" r="230" fill="none" stroke="url(#shapeR)" strokeWidth="2"/>
          <circle cx="95%" cy="-20" r="150" fill="none" stroke="url(#shapeR)" strokeWidth="1.5"/>
          <circle cx="95%" cy="-20" r="80"  fill="none" stroke="url(#shapeR)" strokeWidth="1"/>
          <circle cx="5%"  cy="-15" r="280" fill="none" stroke="url(#shapeL)" strokeWidth="2.5"/>
          <circle cx="5%"  cy="-15" r="190" fill="none" stroke="url(#shapeL)" strokeWidth="2"/>
          <circle cx="5%"  cy="-15" r="110" fill="none" stroke="url(#shapeL)" strokeWidth="1.5"/>
          <circle cx="5%"  cy="-15" r="50"  fill="none" stroke="url(#shapeL)" strokeWidth="1"/>
          <circle cx="50%" cy="8"   r="160" fill="none" stroke="#8B4A5A" strokeWidth="1.5" opacity="0.5"/>
          <circle cx="50%" cy="8"   r="90"  fill="none" stroke="#8B4A5A" strokeWidth="1"   opacity="0.35"/>
          <polygon points="62%,0 70%,4% 66%,11% 58%,11% 54%,4%"  fill="none" stroke="#4A2330" strokeWidth="2.5" opacity="0.65"/>
          <polygon points="22%,-1% 27%,5% 17%,5%"                 fill="none" stroke="#4A2330" strokeWidth="2.5" opacity="0.65"/>
          <polygon points="77%,1% 82%,8% 72%,8%"                  fill="none" stroke="#4A2330" strokeWidth="2"   opacity="0.58"/>
          <polygon points="39%,-1% 43%,4% 35%,4%"                 fill="none" stroke="#6B2F42" strokeWidth="2"   opacity="0.52"/>
          <rect x="3%"  y="0.5%" width="64" height="64" fill="none" stroke="#6B2F42" strokeWidth="2.2" opacity="0.58" transform="rotate(18 60 55)"/>
          <rect x="35%" y="0.8%" width="46" height="46" fill="none" stroke="#4A2330" strokeWidth="2"   opacity="0.52" transform="rotate(30 400 38)"/>
          <rect x="53%" y="2%"   width="38" height="38" fill="none" stroke="#8B4A5A" strokeWidth="1.8" opacity="0.45" transform="rotate(12 560 38)"/>
          <rect x="83%" y="1%"   width="42" height="42" fill="none" stroke="#4A2330" strokeWidth="1.8" opacity="0.42" transform="rotate(25 840 36)"/>
          <line x1="16%" y1="-1%" x2="16%" y2="7%"    strokeWidth="2.5" stroke="#4A2330" opacity="0.65"/>
          <line x1="13%" y1="3%"  x2="19%" y2="3%"    strokeWidth="2.5" stroke="#4A2330" opacity="0.65"/>
          <line x1="43%" y1="-1%" x2="43%" y2="6%"    strokeWidth="2"   stroke="#4A2330" opacity="0.58"/>
          <line x1="40%" y1="2.5%" x2="46%" y2="2.5%" strokeWidth="2"   stroke="#4A2330" opacity="0.58"/>
          <line x1="70%" y1="0%"  x2="70%" y2="7%"    strokeWidth="2"   stroke="#4A2330" opacity="0.52"/>
          <line x1="67%" y1="3.5%" x2="73%" y2="3.5%" strokeWidth="2"   stroke="#4A2330" opacity="0.52"/>
          <line x1="87%" y1="1%"  x2="87%" y2="8%"    strokeWidth="1.8" stroke="#4A2330" opacity="0.48"/>
          <line x1="84%" y1="4.5%" x2="90%" y2="4.5%" strokeWidth="1.8" stroke="#4A2330" opacity="0.48"/>
        </svg>

        {/* HEADER PAGE */}
        {pageMeta && (
          <div style={{ position: 'relative', zIndex: 2, padding: '32px 40px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', fontWeight: 700, color: 'white',
              }}>
                {initiales || '?'}
              </div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.3px', textShadow: '0 1px 6px rgba(0,0,0,0.15)' }}>
                  {pageTitle}
                </h1>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '3px 0 0' }}>
                  {pageSub} · {dateStr}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CONTENU PAGE */}
        <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'

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

const ROLE_CONFIG = {
  admin:   { label: 'Administrateur', bg: '#EEF2FF', color: '#4F46E5' },
  manager: { label: 'Manager',        bg: '#EFF6FF', color: '#2563EB' },
  salarie: { label: 'Salarié',        bg: '#F0FDF4', color: '#16A34A' },
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [absencesEnAttente, setAbsencesEnAttente] = useState(0)
  const [messagesOuverts, setMessagesOuverts] = useState(0)

  useEffect(() => { fetchRole() }, [])

  const fetchRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase.from('employes').select('role, prenom, nom').eq('email', user.email).single()
    if (emp) {
      setRole(emp.role)
      setPrenom(emp.prenom || '')
      setNom(emp.nom || '')
      if (emp.role === 'admin' || emp.role === 'manager') fetchAbsencesEnAttente()
      if (emp.role === 'admin') fetchMessagesOuverts()
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

  return (
    <div className="min-h-screen flex" style={{ background: '#F7F8FC', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* SIDEBAR */}
      <div className="w-60 flex flex-col fixed h-full" style={{
        background: '#FFFFFF',
        borderRight: '1px solid #EAECF0',
        boxShadow: '2px 0 16px rgba(0,0,0,0.04)'
      }}>

        {/* LOGO */}
        <div className="px-5 pt-7 pb-5" style={{ borderBottom: '1px solid #F2F4F7' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4F7EF7, #6366F1)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="14" x2="16" y2="14"/>
                <line x1="8" y1="18" x2="12" y2="18"/>
              </svg>
            </div>
            <div>
              <h1 className="font-bold leading-tight" style={{ fontSize: '15px', color: '#111827', letterSpacing: '-0.3px' }}>KeepTrack</h1>
              <p style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.3 }}>GTA Specialist App</p>
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">

          {/* Section label */}
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', padding: '4px 10px 8px', textTransform: 'uppercase' }}>
            Navigation
          </p>

          {navFiltres.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center justify-between rounded-xl transition-all duration-150"
                style={{
                  padding: '8px 10px',
                  background: isActive ? '#EEF2FF' : 'transparent',
                  color: isActive ? '#4F46E5' : '#6B7280',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '13.5px',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#374151' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280' } }}
              >
                <div className="flex items-center gap-2.5">
                  <span style={{ color: isActive ? '#4F46E5' : '#9CA3AF' }}>
                    {NAV_ICONS[item.href]}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span style={{
                    background: '#FEE2E2', color: '#DC2626',
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
        <div className="px-3 pb-5" style={{ borderTop: '1px solid #F2F4F7', paddingTop: '12px' }}>

          {/* User card */}
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1" style={{ background: '#FAFAFA' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: roleConfig.bg, color: roleConfig.color }}>
              {initiales || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', lineHeight: 1.3 }} className="truncate">
                {prenom} {nom}
              </p>
              <p style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.3 }}>{roleConfig.label}</p>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-xl transition-all duration-150"
            style={{ padding: '8px 10px', color: '#9CA3AF', fontSize: '13.5px', fontWeight: 400 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-60 overflow-auto min-h-screen" style={{ background: '#F7F8FC' }}>
        {children}
      </div>
    </div>
  )
}
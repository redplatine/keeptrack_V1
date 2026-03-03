'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'

const NAV_ICONS = {
  '/profil': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  '/dashboard': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  '/calendrier': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  '/employes': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  '/absences': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  ),
  '/messages': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  '/contact': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.48 2 2 0 0 1 3.58 2.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  '/societe': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
}

const ROLE_CONFIG = {
  admin: { label: 'Administrateur', color: 'from-purple-500 to-indigo-500' },
  manager: { label: 'Manager', color: 'from-blue-500 to-cyan-500' },
  salarie: { label: 'Salarié', color: 'from-emerald-500 to-teal-500' },
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [absencesEnAttente, setAbsencesEnAttente] = useState(0)
  const [messagesOuverts, setMessagesOuverts] = useState(0)

  useEffect(() => {
    fetchRole()
  }, [])

  const fetchRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase
      .from('employes')
      .select('role, prenom, nom')
      .eq('email', user.email)
      .single()
    if (emp) {
      setRole(emp.role)
      setPrenom(emp.prenom || '')
      setNom(emp.nom || '')
      if (emp.role === 'admin' || emp.role === 'manager') fetchAbsencesEnAttente()
      if (emp.role === 'admin') fetchMessagesOuverts()
    }
  }

  const fetchAbsencesEnAttente = async () => {
    const { count } = await supabase.from('absences')
      .select('*', { count: 'exact', head: true }).eq('statut', 'En attente')
    setAbsencesEnAttente(count || 0)
  }

  const fetchMessagesOuverts = async () => {
    const { count } = await supabase.from('messages')
      .select('*', { count: 'exact', head: true }).eq('statut', 'Ouvert')
    setMessagesOuverts(count || 0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/profil', label: 'Mon profil', roles: ['salarie'] },
    { href: '/dashboard', label: 'Tableau de bord', roles: ['admin', 'manager'] },
    { href: '/calendrier', label: 'Calendrier', roles: ['admin', 'manager', 'salarie'] },
    { href: '/employes', label: 'Employés', roles: ['admin'] },
    { href: '/absences', label: 'Absences', roles: ['admin', 'manager', 'salarie'], badge: absencesEnAttente },
    { href: '/messages', label: 'Messages', roles: ['admin'], badge: messagesOuverts },
    { href: '/contact', label: 'Contact & Support', roles: ['salarie'] },
    { href: '/societe', label: 'Société', roles: ['admin', 'manager', 'salarie'] },
  ]

  const navFiltres = navItems.filter(item => role && item.roles.includes(role))
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.salarie
  const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f4ff' }}>

      {/* SIDEBAR */}
      <div className="w-64 flex flex-col fixed h-full" style={{
        background: 'linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
        boxShadow: '4px 0 24px rgba(37,99,235,0.25)'
      }}>

        {/* LOGO */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="14" x2="16" y2="14"/>
                <line x1="8" y1="18" x2="12" y2="18"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight tracking-tight">KeepTrack</h1>
              <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.5)' }}>GTA Specialist App</p>
            </div>
          </div>
        </div>

        {/* USER CARD */}
        <div className="mx-4 mb-6 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br ${roleConfig.color}`}>
              {initiales || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{prenom} {nom}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{roleConfig.label}</p>
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 space-y-1">
          {navFiltres.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                  backdropFilter: isActive ? 'blur(10px)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ opacity: isActive ? 1 : 0.7 }}>
                    {NAV_ICONS[item.href]}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#ef4444', color: 'white', minWidth: '20px', textAlign: 'center' }}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white ml-1" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* DIVIDER */}
        <div className="mx-4 my-3" style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

        {/* LOGOUT */}
        <div className="px-3 pb-6">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-64 overflow-auto min-h-screen">
        {children}
      </div>
    </div>
  )
}
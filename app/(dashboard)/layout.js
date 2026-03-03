'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState(null)
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
      .select('role')
      .eq('email', user.email)
      .single()
    if (emp) {
      setRole(emp.role)
      if (emp.role === 'admin' || emp.role === 'manager') {
        fetchAbsencesEnAttente()
      }
      if (emp.role === 'admin') {
        fetchMessagesOuverts()
      }
    }
  }

  const fetchAbsencesEnAttente = async () => {
    const { count } = await supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'En attente')
    setAbsencesEnAttente(count || 0)
  }

  const fetchMessagesOuverts = async () => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'Ouvert')
    setMessagesOuverts(count || 0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/profil', label: '👤 Mon profil', roles: ['salarie'] },
    { href: '/dashboard', label: '🏠 Tableau de bord', roles: ['admin', 'manager'] },
    { href: '/calendrier', label: '📆 Calendrier', roles: ['admin', 'manager', 'salarie'] },
    { href: '/employes', label: '👥 Employés', roles: ['admin'] },
    { href: '/absences', label: '📅 Absences', roles: ['admin', 'manager', 'salarie'], badge: absencesEnAttente },
    { href: '/messages', label: '💬 Messages', roles: ['admin'], badge: messagesOuverts },
    { href: '/contact', label: '📨 Contact & Support', roles: ['salarie'] },
    { href: '/societe', label: '🏢 Société', roles: ['admin', 'manager', 'salarie'] },
  ]

  const navFiltres = navItems.filter(item => role && item.roles.includes(role))

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="14" x2="8" y2="14"/>
                <line x1="12" y1="14" x2="12" y2="14"/>
                <line x1="16" y1="14" x2="16" y2="14"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-600 leading-tight">KeepTrack</h1>
              <p className="text-xs text-gray-400 leading-tight">GTA Specialist App</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navFiltres.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="px-6 py-3 border-t border-gray-100">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            role === 'admin' ? 'bg-purple-50 text-purple-600' :
            role === 'manager' ? 'bg-blue-50 text-blue-600' :
            'bg-gray-100 text-gray-500'
          }`}>
            {role === 'admin' ? '⚙️ Administrateur' :
             role === 'manager' ? '👔 Manager' : '👤 Salarié'}
          </span>
        </div>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            🚪 Se déconnecter
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
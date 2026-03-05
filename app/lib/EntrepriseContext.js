'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const EntrepriseContext = createContext(null)

export function EntrepriseProvider({ children }) {
  const [entrepriseId, setEntrepriseId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEntreprise = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data: emp } = await supabase
        .from('employes')
        .select('entreprise_id')
        .eq('email', session.user.email)
        .single()

      if (emp?.entreprise_id) setEntrepriseId(emp.entreprise_id)
      setLoading(false)
    }

    fetchEntreprise()

    // Met à jour si la session change (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchEntreprise()
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <EntrepriseContext.Provider value={{ entrepriseId, loading }}>
      {children}
    </EntrepriseContext.Provider>
  )
}

export function useEntreprise() {
  return useContext(EntrepriseContext)
}
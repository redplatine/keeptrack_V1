'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const EntrepriseContext = createContext({
  entrepriseId: null,
  loading: true,
})

export function EntrepriseProvider({ children }) {
  const [entrepriseId, setEntrepriseId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchEntreprise = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error('Erreur auth getUser:', userError)
        setEntrepriseId(null)
        setLoading(false)
        return
      }

      if (!user) {
        setEntrepriseId(null)
        setLoading(false)
        return
      }

      const { data: emp, error: empError } = await supabase
        .from('employes')
        .select('entreprise_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (empError) {
        console.error('Erreur récupération entreprise_id:', empError)
        setEntrepriseId(null)
        setLoading(false)
        return
      }

      setEntrepriseId(emp?.entreprise_id || null)
    } catch (err) {
      console.error('Erreur EntrepriseContext:', err)
      setEntrepriseId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntreprise()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchEntreprise()
    })

    return () => {
      subscription?.unsubscribe()
    }
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
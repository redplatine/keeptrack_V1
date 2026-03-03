'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://keeptrack-liart.vercel.app/setup-password'
    })

    if (error) {
      setError('Erreur : ' + error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="8" y1="14" x2="8" y2="14"/>
              <line x1="12" y1="14" x2="12" y2="14"/>
              <line x1="16" y1="14" x2="16" y2="14"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-blue-600">KeepTrack</h1>
          <p className="text-gray-500 mt-1">Réinitialiser mon mot de passe</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg mb-6">
              ✅ Email envoyé ! Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
            </div>
            <Link href="/login" className="text-blue-600 text-sm hover:underline">
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com" required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-gray-400 text-sm hover:underline">
                ← Retour à la connexion
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
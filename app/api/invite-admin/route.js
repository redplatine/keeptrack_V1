import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  const { email, nom, slug } = await req.json()

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/setup-password`,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: entreprise, error: entError } = await supabaseAdmin
    .from('entreprises').insert([{ nom, slug }]).select().single()
  if (entError) return NextResponse.json({ error: entError.message }, { status: 400 })

  const { error: empError } = await supabaseAdmin.from('employes').insert([{
    nom: email.split('@')[0], prenom: 'Admin', email,
    role: 'admin', entreprise_id: entreprise.id,
    date_entree: new Date().toISOString().split('T')[0],
    type_contrat: 'CDI', statut: 'Cadre', temps_travail: 'Temps plein',
  }])
  if (empError) return NextResponse.json({ error: empError.message }, { status: 400 })

  return NextResponse.json({ success: true, entreprise })
}
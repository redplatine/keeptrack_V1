'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { useEntreprise } from '../../lib/EntrepriseContext'

const S = {
  input: {
    width: '100%',
    border: '1px solid #E8E4E0',
    borderRadius: '10px',
    padding: '9px 12px',
    fontSize: '13.5px',
    background: '#FAF8F6',
    outline: 'none',
    color: '#1C1917',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#A8A29E',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#C4B5A5',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: '0 0 10px',
    borderBottom: '1px solid #F0EDE9',
    marginBottom: '16px',
    gridColumn: '1 / -1',
  },
}

export default function InviterPage() {
  const router = useRouter()
  const { entrepriseId } = useEntreprise()

  const [etape, setEtape] = useState(1)
  const [employeId, setEmployeId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [invite, setInvite] = useState({
    email: '',
    nom: '',
    prenom: '',
    role: 'salarie',
  })

  const [fiche, setFiche] = useState({
    matricule: '',
    date_naissance: '',
    numero_voie: '',
    nom_rue: '',
    code_postal: '',
    ville: '',
    poste: '',
    departement: '',
    date_entree: '',
    type_contrat: 'CDI',
    statut: 'Non-cadre',
    temps_travail: 'Temps plein',
    rtt_annuel: 0,
    salaire_brut: '',
  })

  const recalculerAcquisitions = async (targetEmployeId) => {
    const { error } = await supabase.rpc('calculer_acquisitions', {
      p_entreprise_id: entrepriseId,
      p_employe_id: targetEmployeId,
    })

    if (error) throw error
  }

  const handleInviter = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!entrepriseId) {
      setError("Entreprise introuvable")
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/inviter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invite.email }),
      })

      const result = await res.json()

      if (result.error) {
        setError('Erreur : ' + result.error)
        setLoading(false)
        return
      }

      const payloadEmploye = {
        nom: invite.nom,
        prenom: invite.prenom,
        email: invite.email,
        role: invite.role,
        entreprise_id: entrepriseId,
        date_entree: new Date().toISOString().split('T')[0],
        type_contrat: 'CDI',
        statut: 'Non-cadre',
        temps_travail: 'Temps plein',
      }

      const { data: emp, error: empError } = await supabase
        .from('employes')
        .insert([payloadEmploye])
        .select()
        .single()

      if (empError) {
        setError('Erreur fiche employé : ' + empError.message)
        setLoading(false)
        return
      }

      setEmployeId(emp.id)
      setEtape(2)
    } catch (err) {
      console.error(err)
      setError("Erreur inattendue lors de l'invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleFiche = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!entrepriseId || !employeId) {
      setError("Entreprise ou employé introuvable")
      setLoading(false)
      return
    }

    try {
      const payloadFiche = {
        matricule: fiche.matricule || null,
        date_naissance: fiche.date_naissance || null,
        numero_voie: fiche.numero_voie || null,
        nom_rue: fiche.nom_rue || null,
        code_postal: fiche.code_postal || null,
        ville: fiche.ville || null,
        poste: fiche.poste || null,
        departement: fiche.departement || null,
        date_entree: fiche.date_entree || null,
        type_contrat: fiche.type_contrat,
        statut: fiche.statut,
        temps_travail: fiche.temps_travail,
        rtt_annuel: parseFloat(fiche.rtt_annuel) || 0,
        salaire_brut: fiche.salaire_brut ? parseFloat(fiche.salaire_brut) : null,
      }

      const { error: updateError } = await supabase
        .from('employes')
        .update(payloadFiche)
        .eq('id', employeId)
        .eq('entreprise_id', entrepriseId)

      if (updateError) {
        setError('Erreur : ' + updateError.message)
        setLoading(false)
        return
      }

      await recalculerAcquisitions(employeId)

      router.push('/employes')
    } catch (err) {
      console.error(err)
      setError('Erreur : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        padding: '0 40px 40px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                background: etape === 1 ? '#4A2330' : '#16A34A',
                color: 'white',
              }}
            >
              {etape === 1 ? '1' : '✓'}
            </div>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: etape === 1 ? '#4A2330' : '#16A34A',
              }}
            >
              Invitation
            </span>
          </div>

          <div style={{ flex: 1, height: '1px', background: '#E8E4E0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                background: etape === 2 ? '#4A2330' : '#E8E4E0',
                color: etape === 2 ? 'white' : '#A8A29E',
              }}
            >
              2
            </div>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: etape === 2 ? '#4A2330' : '#A8A29E',
              }}
            >
              Fiche salarié
            </span>
          </div>
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px 32px',
            border: '1px solid #E8E4E0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          {etape === 1 && (
            <form onSubmit={handleInviter}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: '0 0 20px' }}>
                Informations de connexion
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={S.label}>Nom *</label>
                  <input
                    required
                    value={invite.nom}
                    onChange={(e) => setInvite({ ...invite, nom: e.target.value })}
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>Prénom *</label>
                  <input
                    required
                    value={invite.prenom}
                    onChange={(e) => setInvite({ ...invite, prenom: e.target.value })}
                    style={S.input}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={S.label}>Email *</label>
                  <input
                    required
                    type="email"
                    value={invite.email}
                    onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                    placeholder="salarie@entreprise.fr"
                    style={S.input}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={S.label}>Rôle</label>
                  <select
                    value={invite.role}
                    onChange={(e) => setInvite({ ...invite, role: e.target.value })}
                    style={{ ...S.input, cursor: 'pointer' }}
                  >
                    <option value="salarie">Salarié</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                {error && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      color: '#DC2626',
                      fontSize: '13.5px',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}

                <div style={{ gridColumn: '1 / -1' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      background: loading ? '#E8E4E0' : '#1C1917',
                      color: loading ? '#A8A29E' : 'white',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    {loading ? 'Envoi…' : "Envoyer l'invitation et continuer →"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {etape === 2 && (
            <form onSubmit={handleFiche}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1C1917', margin: '0 0 4px' }}>
                Compléter la fiche salarié
              </h2>
              <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 24px' }}>
                Ces informations pourront être modifiées ultérieurement.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={S.sectionTitle}>Informations personnelles</div>

                <div>
                  <label style={S.label}>Matricule</label>
                  <input
                    value={fiche.matricule}
                    onChange={(e) => setFiche({ ...fiche, matricule: e.target.value })}
                    placeholder="Ex: MAT001"
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>Date de naissance</label>
                  <input
                    type="date"
                    value={fiche.date_naissance}
                    onChange={(e) => setFiche({ ...fiche, date_naissance: e.target.value })}
                    style={S.input}
                  />
                </div>

                <div style={{ ...S.sectionTitle, marginTop: '8px' }}>Adresse</div>

                <div>
                  <label style={S.label}>Numéro de voie</label>
                  <input
                    value={fiche.numero_voie}
                    onChange={(e) => setFiche({ ...fiche, numero_voie: e.target.value })}
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>Nom de rue</label>
                  <input
                    value={fiche.nom_rue}
                    onChange={(e) => setFiche({ ...fiche, nom_rue: e.target.value })}
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>Code postal</label>
                  <input
                    value={fiche.code_postal}
                    onChange={(e) => setFiche({ ...fiche, code_postal: e.target.value })}
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>Ville</label>
                  <input
                    value={fiche.ville}
                    onChange={(e) => setFiche({ ...fiche, ville: e.target.value })}
                    style={S.input}
                  />
                </div>

                <div style={{ ...S.sectionTitle, marginTop: '8px' }}>Contrat & Rémunération</div>

                <div>
                  <label style={S.label}>Poste</label>
                  <input
                    value={fiche.poste}
                    onChange={(e) => setFiche({ ...fiche, poste: e.target.value })}
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>Département</label>
                  <input
                    value={fiche.departement}
                    onChange={(e) => setFiche({ ...fiche, departement: e.target.value })}
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>Date d'entrée *</label>
                  <input
                    required
                    type="date"
                    value={fiche.date_entree}
                    onChange={(e) => setFiche({ ...fiche, date_entree: e.target.value })}
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>Type de contrat</label>
                  <select
                    value={fiche.type_contrat}
                    onChange={(e) => setFiche({ ...fiche, type_contrat: e.target.value })}
                    style={{ ...S.input, cursor: 'pointer' }}
                  >
                    <option>CDI</option>
                    <option>CDD</option>
                    <option>Alternance</option>
                    <option>Stage</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>Statut</label>
                  <select
                    value={fiche.statut}
                    onChange={(e) => setFiche({ ...fiche, statut: e.target.value })}
                    style={{ ...S.input, cursor: 'pointer' }}
                  >
                    <option>Cadre</option>
                    <option>Non-cadre</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>Temps de travail</label>
                  <select
                    value={fiche.temps_travail}
                    onChange={(e) => setFiche({ ...fiche, temps_travail: e.target.value })}
                    style={{ ...S.input, cursor: 'pointer' }}
                  >
                    <option>Temps plein</option>
                    <option>Temps partiel</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>RTT annuel</label>
                  <input
                    type="number"
                    value={fiche.rtt_annuel}
                    onChange={(e) => setFiche({ ...fiche, rtt_annuel: e.target.value })}
                    placeholder="0 si pas de RTT"
                    style={S.input}
                  />
                </div>

                <div>
                  <label style={S.label}>Salaire brut annuel (€)</label>
                  <input
                    type="number"
                    value={fiche.salaire_brut}
                    onChange={(e) => setFiche({ ...fiche, salaire_brut: e.target.value })}
                    placeholder="Ex: 35000"
                    style={S.input}
                  />
                </div>

                {error && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      color: '#DC2626',
                      fontSize: '13.5px',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}

                <div
                  style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    gap: '10px',
                    paddingTop: '20px',
                    borderTop: '1px solid #F0EDE9',
                  }}
                >
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      background: loading ? '#E8E4E0' : '#1C1917',
                      color: loading ? '#A8A29E' : 'white',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {loading ? 'Enregistrement…' : '✅ Enregistrer la fiche'}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/employes')}
                    style={{
                      padding: '11px 20px',
                      borderRadius: '10px',
                      border: '1px solid #E8E4E0',
                      background: 'white',
                      color: '#78716C',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Passer
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
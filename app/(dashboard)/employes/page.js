'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useEntreprise } from '../../lib/EntrepriseContext'
import * as XLSX from 'xlsx'

function getAvatarUrl(id) {
  const { data } = supabase.storage.from('avatars').getPublicUrl(`${id}/avatar`)
  return data.publicUrl
}

function Avatar({ id, prenom, nom, size = 36 }) {
  const [error, setError] = useState(false)
  const url = getAvatarUrl(id)
  const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        flexShrink: 0,
        background: 'linear-gradient(135deg, #F2E6E9, #E8D5D9)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!error ? (
        <img
          src={`${url}?t=${id}`}
          alt={`${prenom} ${nom}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setError(true)}
        />
      ) : (
        <span style={{ fontSize: size * 0.33, fontWeight: 700, color: '#6B2F42' }}>
          {initiales}
        </span>
      )}
    </div>
  )
}

const CONTRAT_CONFIG = {
  CDI: { bg: '#F9EEF1', color: '#6B2F42' },
  CDD: { bg: '#FFFBEB', color: '#B45309' },
  Alternance: { bg: '#F0FDF4', color: '#16A34A' },
  Stage: { bg: '#F0EDE9', color: '#78716C' },
}

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

const FORM_DEFAULT = {
  matricule: '',
  nom: '',
  prenom: '',
  email: '',
  poste: '',
  departement: '',
  type_contrat: 'CDI',
  statut: 'Non-cadre',
  temps_travail: 'Temps plein',
  date_entree: '',
  salaire_brut: '',
  numero_voie: '',
  nom_rue: '',
  code_postal: '',
  ville: '',
  date_naissance: '',
  rtt_annuel: 0,
  numero_secu: '',
  cp_naissance: '',
  lieu_naissance: '',
  forfait_jours: false,
  nb_jours_annuels: '',
  nb_heures_semaine: '',
  cp_n1_reprise: 0,
  cp_n_reprise: 0,
  rtt_reprise: 0,
  recup_reprise: 0,
}

export default function EmployesPage() {
  const [employes, setEmployes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [employeSelectionne, setEmployeSelectionne] = useState(null)
  const [invitationEnvoyee, setInvitationEnvoyee] = useState(false)
  const [invitationLoading, setInvitationLoading] = useState(false)
  const [currentRole, setCurrentRole] = useState(null)
  const [form, setForm] = useState(FORM_DEFAULT)
  const { entrepriseId } = useEntreprise()

  const resetForm = () => setForm(FORM_DEFAULT)

  const fetchEmployes = useCallback(async () => {
    if (!entrepriseId) return

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.email) {
      const { data: me } = await supabase
        .from('employes')
        .select('role')
        .eq('email', user.email)
        .eq('entreprise_id', entrepriseId)
        .maybeSingle()

      setCurrentRole(me?.role || null)
    }

    const { data, error } = await supabase
      .from('employes')
      .select('*')
      .eq('entreprise_id', entrepriseId)
      .order('nom')

    if (error) {
      console.error('Erreur fetch employés:', error)
      alert('Erreur chargement employés : ' + error.message)
      setEmployes([])
    } else {
      setEmployes(data || [])
    }

    setLoading(false)
  }, [entrepriseId])

  useEffect(() => {
    if (entrepriseId) fetchEmployes()
  }, [entrepriseId, fetchEmployes])

  const handleEnvoyerInvitation = async () => {
    if (!form.email) return

    setInvitationLoading(true)

    try {
      const response = await fetch('/api/inviter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })

      const data = await response.json()

      if (data.error) {
        alert('Erreur : ' + data.error)
      } else {
        setInvitationEnvoyee(true)
      }
    } catch (error) {
      alert("Erreur lors de l'envoi de l'invitation")
      console.error(error)
    } finally {
      setInvitationLoading(false)
    }
  }

  const recalculerRTT = async (employeId, nouveauRttAnnuel) => {
    if (!entrepriseId) return

    const annee = new Date().getFullYear()

    const { data: solde, error: soldeError } = await supabase
      .from('soldes_conges')
      .select('*')
      .eq('employe_id', employeId)
      .eq('entreprise_id', entrepriseId)
      .eq('annee', annee)
      .maybeSingle()

    if (soldeError) {
      console.error('Erreur récupération solde RTT:', soldeError)
      return
    }

    if (!solde) return

    const { data: emp, error: empError } = await supabase
      .from('employes')
      .select('date_entree')
      .eq('id', employeId)
      .eq('entreprise_id', entrepriseId)
      .maybeSingle()

    if (empError) {
      console.error('Erreur récupération employé RTT:', empError)
      return
    }

    if (!emp?.date_entree) return

    const aujourdHui = new Date()
    const dateEntree = new Date(emp.date_entree)
    const dateEntreeMois = new Date(dateEntree.getFullYear(), dateEntree.getMonth(), 1)
    const moisEnCours = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1)

    let rttAcquis = 0

    if (nouveauRttAnnuel > 0 && dateEntreeMois <= moisEnCours) {
      const moisAnciennete = Math.min(
        (aujourdHui.getFullYear() - dateEntree.getFullYear()) * 12 +
          aujourdHui.getMonth() -
          dateEntree.getMonth() +
          1,
        12
      )

      rttAcquis = Math.round(moisAnciennete * (nouveauRttAnnuel / 12) * 100) / 100
    }

    const rttForce = solde.rtt_force || 0
    const rttAcquisTotal = rttAcquis + rttForce

    const { error: updateError } = await supabase
      .from('soldes_conges')
      .update({
        rtt_acquis: rttAcquisTotal,
        rtt_solde: Math.max(0, rttAcquisTotal - (solde.rtt_pris || 0)),
      })
      .eq('employe_id', employeId)
      .eq('entreprise_id', entrepriseId)
      .eq('annee', annee)

    if (updateError) {
      console.error('Erreur update RTT:', updateError)
      alert('Erreur recalcul RTT : ' + updateError.message)
    }
  }

  const recalculerAcquisitions = async (employeId = null) => {
    if (!entrepriseId) {
      throw new Error("Aucune entreprise sélectionnée")
    }

    const params = {
      p_entreprise_id: entrepriseId,
    }

    if (employeId) {
      params.p_employe_id = employeId
    }

    const { error } = await supabase.rpc('calculer_acquisitions', params)

    if (error) {
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!entrepriseId) {
      alert("Entreprise introuvable")
      return
    }

    const formNettoye = {
      matricule: form.matricule || null,
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      poste: form.poste || null,
      departement: form.departement || null,
      type_contrat: form.type_contrat,
      statut: form.statut,
      temps_travail: form.temps_travail,
      date_entree: form.date_entree || null,
      salaire_brut: form.salaire_brut || null,
      numero_voie: form.numero_voie || null,
      nom_rue: form.nom_rue || null,
      code_postal: form.code_postal || null,
      ville: form.ville || null,
      date_naissance: form.date_naissance || null,
      rtt_annuel: form.rtt_annuel || 0,
      numero_secu: form.numero_secu || null,
      cp_naissance: form.cp_naissance || null,
      lieu_naissance: form.lieu_naissance || null,
      forfait_jours: form.forfait_jours || false,
      nb_jours_annuels: form.forfait_jours ? parseInt(form.nb_jours_annuels) || null : null,
      nb_heures_semaine: !form.forfait_jours ? parseFloat(form.nb_heures_semaine) || null : null,
      entreprise_id: entrepriseId,
    }

    try {
      if (employeSelectionne) {
        const ancienneDateEntree = employeSelectionne.date_entree || null
        const nouveauRtt = parseFloat(form.rtt_annuel) || 0
        const ancienRtt = parseFloat(employeSelectionne.rtt_annuel) || 0

        const { error } = await supabase
          .from('employes')
          .update(formNettoye)
          .eq('id', employeSelectionne.id)
          .eq('entreprise_id', entrepriseId)

        if (error) {
          alert('Erreur modification : ' + error.message)
          return
        }

        if (form.date_entree !== ancienneDateEntree) {
          await recalculerAcquisitions(employeSelectionne.id)
        } else if (nouveauRtt !== ancienRtt) {
          await recalculerRTT(employeSelectionne.id, nouveauRtt)
        }
      } else {
        const { data: newEmp, error } = await supabase
          .from('employes')
          .insert([formNettoye])
          .select()
          .single()

        if (error) {
          alert('Erreur création : ' + error.message)
          return
        }

        await recalculerAcquisitions(newEmp.id)

        const cp_n1 = parseFloat(form.cp_n1_reprise) || 0
        const cp_n = parseFloat(form.cp_n_reprise) || 0
        const rtt = parseFloat(form.rtt_reprise) || 0
        const recup = parseFloat(form.recup_reprise) || 0

        if (cp_n1 > 0 || cp_n > 0 || rtt > 0 || recup > 0) {
          const annee = new Date().getFullYear()

          const { data: ex, error: exError } = await supabase
            .from('soldes_conges')
            .select('*')
            .eq('employe_id', newEmp.id)
            .eq('entreprise_id', entrepriseId)
            .eq('annee', annee)
            .maybeSingle()

          if (exError) {
            alert('Erreur récupération solde : ' + exError.message)
            return
          }

          if (ex) {
            const { error: updateSoldeError } = await supabase
              .from('soldes_conges')
              .update({
                cp_n1_acquis: (ex.cp_n1_acquis || 0) + cp_n1,
                cp_n1_solde: (ex.cp_n1_solde || 0) + cp_n1,
                cp_n_acquis: (ex.cp_n_acquis || 0) + cp_n,
                cp_n_solde: (ex.cp_n_solde || 0) + cp_n,
                rtt_acquis: (ex.rtt_acquis || 0) + rtt,
                rtt_solde: (ex.rtt_solde || 0) + rtt,
                recup_acquis: (ex.recup_acquis || 0) + recup,
                recup_solde: (ex.recup_solde || 0) + recup,
              })
              .eq('employe_id', newEmp.id)
              .eq('entreprise_id', entrepriseId)
              .eq('annee', annee)

            if (updateSoldeError) {
              alert('Erreur mise à jour reprise compteurs : ' + updateSoldeError.message)
              return
            }
          } else {
            const { error: insertSoldeError } = await supabase.from('soldes_conges').insert({
              employe_id: newEmp.id,
              entreprise_id: entrepriseId,
              annee,
              cp_n1_acquis: cp_n1,
              cp_n1_solde: cp_n1,
              cp_n_acquis: cp_n,
              cp_n_solde: cp_n,
              rtt_acquis: rtt,
              rtt_solde: rtt,
              recup_acquis: recup,
              recup_solde: recup,
            })

            if (insertSoldeError) {
              alert('Erreur insertion reprise compteurs : ' + insertSoldeError.message)
              return
            }
          }
        }
      }

      setShowForm(false)
      setEmployeSelectionne(null)
      setInvitationEnvoyee(false)
      resetForm()
      fetchEmployes()
    } catch (error) {
      console.error(error)
      alert('Erreur : ' + error.message)
    }
  }

  const handleDoubleClick = (emp) => {
    setEmployeSelectionne(emp)
    setInvitationEnvoyee(false)

    setForm({
      matricule: emp.matricule || '',
      nom: emp.nom || '',
      prenom: emp.prenom || '',
      email: emp.email || '',
      poste: emp.poste || '',
      departement: emp.departement || '',
      type_contrat: emp.type_contrat || 'CDI',
      statut: emp.statut || 'Non-cadre',
      temps_travail: emp.temps_travail || 'Temps plein',
      date_entree: emp.date_entree || '',
      salaire_brut: emp.salaire_brut || '',
      numero_voie: emp.numero_voie || '',
      nom_rue: emp.nom_rue || '',
      code_postal: emp.code_postal || '',
      ville: emp.ville || '',
      date_naissance: emp.date_naissance || '',
      rtt_annuel: emp.rtt_annuel || 0,
      numero_secu: emp.numero_secu || '',
      cp_naissance: emp.cp_naissance || '',
      lieu_naissance: emp.lieu_naissance || '',
      forfait_jours: emp.forfait_jours || false,
      nb_jours_annuels: emp.nb_jours_annuels || '',
      nb_heures_semaine: emp.nb_heures_semaine || '',
      cp_n1_reprise: 0,
      cp_n_reprise: 0,
      rtt_reprise: 0,
      recup_reprise: 0,
    })

    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSupprimer = async () => {
    if (!employeSelectionne) return

    const confirmation = window.confirm(
      `Supprimer ${employeSelectionne.prenom} ${employeSelectionne.nom} ? Cette action est irréversible.`
    )

    if (!confirmation) return

    const employeId = employeSelectionne.id

    const { error: soldeError } = await supabase
      .from('soldes_conges')
      .delete()
      .eq('employe_id', employeId)
      .eq('entreprise_id', entrepriseId)

    if (soldeError) {
      alert('Erreur suppression soldes : ' + soldeError.message)
      return
    }

    const { error: absencesError } = await supabase
      .from('absences')
      .delete()
      .eq('employe_id', employeId)
      .eq('entreprise_id', entrepriseId)

    if (absencesError) {
      alert('Erreur suppression absences : ' + absencesError.message)
      return
    }

    const { error: employeError } = await supabase
      .from('employes')
      .delete()
      .eq('id', employeId)
      .eq('entreprise_id', entrepriseId)

    if (employeError) {
      alert('Erreur suppression employé : ' + employeError.message)
      return
    }

    setShowForm(false)
    setEmployeSelectionne(null)
    resetForm()
    fetchEmployes()
  }

  const handleExportExcel = () => {
    const data = employes.map((emp) => ({
      Matricule: emp.matricule || '',
      Nom: emp.nom || '',
      Prénom: emp.prenom || '',
      Email: emp.email || '',
      'Date de naissance': emp.date_naissance || '',
      'N° Sécurité sociale': emp.numero_secu || '',
      'CP de naissance': emp.cp_naissance || '',
      'Lieu de naissance': emp.lieu_naissance || '',
      'Numéro de voie': emp.numero_voie || '',
      'Nom de rue': emp.nom_rue || '',
      'Code postal': emp.code_postal || '',
      Ville: emp.ville || '',
      Poste: emp.poste || '',
      Département: emp.departement || '',
      'Type de contrat': emp.type_contrat || '',
      Statut: emp.statut || '',
      'Temps de travail': emp.temps_travail || '',
      "Date d'entrée": emp.date_entree || '',
      'RTT annuel': emp.rtt_annuel || 0,
      'Forfait jours': emp.forfait_jours ? 'Oui' : 'Non',
      'Nb jours annuels': emp.forfait_jours ? emp.nb_jours_annuels || '' : '',
      'Nb heures / semaine': !emp.forfait_jours ? emp.nb_heures_semaine || '' : '',
      'Salaire brut annuel': emp.salaire_brut || '',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 16 },
      { wch: 22 },
      { wch: 16 },
      { wch: 20 },
      { wch: 14 },
      { wch: 22 },
      { wch: 12 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      { wch: 10 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Employés')
    XLSX.writeFile(wb, `employes_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const F = (key, extra = {}) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
    style: { ...S.input, ...extra },
  })

  const isAdmin = currentRole === 'admin'

  return (
    <div
      style={{
        padding: '0 40px 40px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <p style={{ fontSize: '13px', color: '#78716C', margin: 0 }}>
          {employes.length} salarié(s) · double-cliquez sur une carte pour modifier
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <button
              onClick={handleExportExcel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid #E8E4E0',
                background: 'white',
                color: '#44403C',
                fontSize: '13.5px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF8F6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exporter Excel
            </button>
          )}

          <button
            onClick={() => {
              setEmployeSelectionne(null)
              setInvitationEnvoyee(false)
              resetForm()
              setShowForm(!showForm)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: '#1C1917',
              color: 'white',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#44403C')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#1C1917')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Ajouter un employé
          </button>
        </div>
      </div>

      {showForm && (
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px 32px',
            border: '1px solid #E8E4E0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {employeSelectionne && (
                <Avatar
                  id={employeSelectionne.id}
                  prenom={employeSelectionne.prenom}
                  nom={employeSelectionne.nom}
                  size={40}
                />
              )}

              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917', margin: 0 }}>
                  {employeSelectionne
                    ? `${employeSelectionne.prenom} ${employeSelectionne.nom}`
                    : 'Nouvel employé'}
                </h2>
                {employeSelectionne && (
                  <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>
                    Modification de la fiche
                  </p>
                )}
              </div>
            </div>

            {employeSelectionne && (
              <button
                onClick={handleEnvoyerInvitation}
                disabled={invitationLoading || invitationEnvoyee}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: invitationEnvoyee ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  border: invitationEnvoyee ? '1px solid #BBF7D0' : '1px solid #E8E4E0',
                  background: invitationEnvoyee ? '#F0FDF4' : '#FAF8F6',
                  color: invitationEnvoyee ? '#16A34A' : '#44403C',
                }}
              >
                {invitationLoading
                  ? '⏳ Envoi…'
                  : invitationEnvoyee
                    ? '✓ Invitation envoyée'
                    : '✉ Envoyer invitation'}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={S.sectionTitle}>Informations personnelles</div>

              <div>
                <label style={S.label}>Matricule</label>
                <input {...F('matricule')} placeholder="Ex: MAT001" />
              </div>

              <div>
                <label style={S.label}>Nom *</label>
                <input required {...F('nom')} />
              </div>

              <div>
                <label style={S.label}>Prénom *</label>
                <input required {...F('prenom')} />
              </div>

              <div>
                <label style={S.label}>Email *</label>
                <input required type="email" {...F('email')} />
              </div>

              <div>
                <label style={S.label}>Date de naissance</label>
                <input type="date" {...F('date_naissance')} />
              </div>

              <div>
                <label style={S.label}>Lieu de naissance</label>
                <input {...F('lieu_naissance')} placeholder="Ex: Paris" />
              </div>

              <div>
                <label style={S.label}>CP de naissance</label>
                <input {...F('cp_naissance')} placeholder="Ex: 75001" />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Numéro de sécurité sociale</label>
                <input {...F('numero_secu')} placeholder="Ex: 1 85 05 75 123 456 78" />
              </div>

              <div style={{ ...S.sectionTitle, marginTop: '8px' }}>Adresse</div>

              <div>
                <label style={S.label}>Numéro de voie</label>
                <input {...F('numero_voie')} />
              </div>

              <div>
                <label style={S.label}>Nom de rue</label>
                <input {...F('nom_rue')} />
              </div>

              <div>
                <label style={S.label}>Code postal</label>
                <input {...F('code_postal')} />
              </div>

              <div>
                <label style={S.label}>Ville</label>
                <input {...F('ville')} />
              </div>

              <div style={{ ...S.sectionTitle, marginTop: '8px' }}>Contrat & Rémunération</div>

              <div>
                <label style={S.label}>Poste</label>
                <input {...F('poste')} />
              </div>

              <div>
                <label style={S.label}>Département</label>
                <input {...F('departement')} />
              </div>

              <div>
                <label style={S.label}>Date d'entrée *</label>
                <input required type="date" {...F('date_entree')} />
              </div>

              <div>
                <label style={S.label}>Type de contrat</label>
                <select {...F('type_contrat')} style={{ ...S.input, cursor: 'pointer' }}>
                  <option>CDI</option>
                  <option>CDD</option>
                  <option>Alternance</option>
                  <option>Stage</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Statut</label>
                <select {...F('statut')} style={{ ...S.input, cursor: 'pointer' }}>
                  <option>Cadre</option>
                  <option>Non-cadre</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Temps de travail</label>
                <select {...F('temps_travail')} style={{ ...S.input, cursor: 'pointer' }}>
                  <option>Temps plein</option>
                  <option>Temps partiel</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Salarié au forfait jours</label>
                <select
                  value={form.forfait_jours ? 'oui' : 'non'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      forfait_jours: e.target.value === 'oui',
                      nb_jours_annuels: '',
                      nb_heures_semaine: '',
                    })
                  }
                  style={{ ...S.input, cursor: 'pointer' }}
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>

              <div>
                {form.forfait_jours ? (
                  <>
                    <label style={S.label}>Nombre de jours annuels</label>
                    <input
                      type="number"
                      value={form.nb_jours_annuels}
                      onChange={(e) => setForm({ ...form, nb_jours_annuels: e.target.value })}
                      placeholder="Ex: 218"
                      style={S.input}
                    />
                  </>
                ) : (
                  <>
                    <label style={S.label}>Nombre d'heures par semaine</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.nb_heures_semaine}
                      onChange={(e) => setForm({ ...form, nb_heures_semaine: e.target.value })}
                      placeholder="Ex: 35"
                      style={S.input}
                    />
                  </>
                )}
              </div>

              <div>
                <label style={S.label}>RTT annuel</label>
                <input type="number" {...F('rtt_annuel')} placeholder="0 si pas de RTT" />
              </div>

              <div>
                <label style={S.label}>Salaire brut annuel (€)</label>
                <input type="number" {...F('salaire_brut')} placeholder="Ex: 35000" />
              </div>

              {!employeSelectionne && (
                <>
                  <div style={{ ...S.sectionTitle, marginTop: '8px' }}>Reprise des compteurs (optionnel)</div>

                  <div style={{ gridColumn: '1 / -1', marginTop: '-8px', marginBottom: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>
                      Pour les salariés ayant déjà des compteurs à reprendre. Les ajustements ultérieurs
                      se font via l'onglet <strong>Compteurs</strong>.
                    </p>
                  </div>

                  {[
                    ['cp_n1_reprise', 'CP N-1 (j)'],
                    ['cp_n_reprise', 'CP N (j)'],
                    ['rtt_reprise', 'RTT (j)'],
                    ['recup_reprise', 'Récupération (j)'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label style={S.label}>{label}</label>
                      <input
                        type="number"
                        step="0.5"
                        value={form[key] || 0}
                        onChange={(e) =>
                          setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })
                        }
                        style={S.input}
                      />
                    </div>
                  ))}
                </>
              )}

              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  gap: '10px',
                  marginTop: '8px',
                  paddingTop: '20px',
                  borderTop: '1px solid #F0EDE9',
                }}
              >
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#1C1917',
                    color: 'white',
                    fontSize: '13.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#44403C')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#1C1917')}
                >
                  {employeSelectionne ? 'Enregistrer les modifications' : 'Enregistrer'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEmployeSelectionne(null)
                    setInvitationEnvoyee(false)
                    resetForm()
                  }}
                  style={{
                    padding: '10px 20px',
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
                  Annuler
                </button>

                {employeSelectionne && (
                  <button
                    type="button"
                    onClick={handleSupprimer}
                    style={{
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FEE2E2')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '3px solid #E8E4E0',
              borderTopColor: '#8B4A5A',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      ) : employes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: 16,
            border: '1px solid #E8E4E0',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
          <p style={{ color: '#A8A29E', fontSize: 14 }}>Aucun employé pour l'instant</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 160px 120px 120px 100px',
              gap: 8,
              padding: '10px 16px',
              marginBottom: 6,
              background: 'white',
              borderRadius: 10,
              border: '1px solid #E8E4E0',
            }}
          >
            {['Salarié', 'Poste', 'Contrat', 'Entrée', 'Statut'].map((l, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#78716C',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                {l}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {employes.map((emp) => {
              const cc = CONTRAT_CONFIG[emp.type_contrat] || CONTRAT_CONFIG.CDI

              return (
                <div
                  key={emp.id}
                  onDoubleClick={() => handleDoubleClick(emp)}
                  style={{
                    background: 'white',
                    borderRadius: 14,
                    border: '1px solid #E8E4E0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    padding: '13px 16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px 120px 120px 100px',
                    gap: 8,
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,35,48,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar id={emp.id} prenom={emp.prenom} nom={emp.nom} size={36} />

                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1917', margin: 0 }}>
                        {emp.prenom} {emp.nom}
                      </p>
                      <p style={{ fontSize: 11, color: '#A8A29E', margin: 0 }}>
                        {emp.email} ·{' '}
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 10,
                            background: '#F0EDE9',
                            color: '#78716C',
                            padding: '1px 5px',
                            borderRadius: 4,
                          }}
                        >
                          {emp.matricule || '—'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span style={{ fontSize: 13, color: '#78716C' }}>{emp.poste || '—'}</span>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: cc.bg,
                      color: cc.color,
                      width: 'fit-content',
                    }}
                  >
                    {emp.type_contrat}
                  </span>

                  <span style={{ fontSize: 13, color: '#78716C' }}>
                    {emp.date_entree ? new Date(emp.date_entree).toLocaleDateString('fr-FR') : '—'}
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: emp.statut === 'Cadre' ? '#F9EEF1' : '#F0EDE9',
                      color: emp.statut === 'Cadre' ? '#6B2F42' : '#78716C',
                      width: 'fit-content',
                    }}
                  >
                    {emp.statut}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
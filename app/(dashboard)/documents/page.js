'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import jsPDF from 'jspdf'

export default function DocumentsPage() {
  const [currentEmploye, setCurrentEmploye] = useState(null)
  const [currentRole, setCurrentRole] = useState(null)
  const [employes, setEmployes] = useState([])
  const [selectedEmployeId, setSelectedEmployeId] = useState(null)
  const [selectedEmploye, setSelectedEmploye] = useState(null)
  const [soldes, setSoldes] = useState(null)
  const [absences, setAbsences] = useState([])
  const [societe, setSociete] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(null)

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (selectedEmployeId) fetchEmployeDetails(selectedEmployeId)
  }, [selectedEmployeId])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: emp } = await supabase.from('employes').select('*').eq('email', user.email).single()
    setCurrentEmploye(emp)
    setCurrentRole(emp?.role)

    const { data: soc } = await supabase.from('societe').select('*').single()
    setSociete(soc)

    if (emp?.role === 'admin' || emp?.role === 'manager') {
      const { data: emps } = await supabase.from('employes').select('id, nom, prenom, poste').order('nom')
      setEmployes(emps || [])
      if (emps?.length > 0) {
        setSelectedEmployeId(emps[0].id)
      }
    } else {
      setSelectedEmployeId(emp?.id)
      setSelectedEmploye(emp)
    }
    setLoading(false)
  }

  const fetchEmployeDetails = async (id) => {
    const annee = new Date().getFullYear()
    const { data: emp } = await supabase.from('employes').select('*').eq('id', id).single()
    const { data: sol } = await supabase.from('soldes_conges').select('*').eq('employe_id', id).eq('annee', annee).single()
    const { data: abs } = await supabase.from('absences').select('*').eq('employe_id', id).eq('statut', 'Approuvée').order('date_debut', { ascending: false })
    setSelectedEmploye(emp)
    setSoldes(sol)
    setAbsences(abs || [])
  }

  // ─── GÉNÉRATION ATTESTATION EMPLOYEUR ───────────────────────────────────────
  const genererAttestation = async () => {
    if (!selectedEmploye || !societe) return
    setGenerating('attestation')

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210
    const marginL = 20
    const marginR = 20
    const contentW = W - marginL - marginR
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const adresseSociete = [societe.numero_voie, societe.nom_rue, societe.code_postal, societe.ville].filter(Boolean).join(' ')

    // ── Fond en-tête ──
    doc.setFillColor(74, 35, 48)
    doc.rect(0, 0, W, 38, 'F')

    // ── Nom société en-tête ──
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(249, 199, 208)
    doc.text(societe.raison_sociale || 'Société', marginL, 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(200, 160, 170)
    doc.text(adresseSociete, marginL, 23)
    if (societe.siret) doc.text(`SIRET : ${societe.siret}`, marginL, 29)
    if (societe.code_naf) doc.text(`Code NAF : ${societe.code_naf}`, marginL + 60, 29)

    // ── Titre document ──
    doc.setFillColor(248, 244, 242)
    doc.rect(0, 38, W, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(28, 25, 23)
    doc.text("ATTESTATION D'EMPLOI", W / 2, 50, { align: 'center' })

    // ── Ligne décorative ──
    doc.setDrawColor(74, 35, 48)
    doc.setLineWidth(0.5)
    doc.line(marginL, 56, W - marginR, 56)

    let y = 68

    // ── Intro ──
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(44, 40, 38)

    const civilite = 'M./Mme'
    const nomComplet = `${selectedEmploye.prenom} ${selectedEmploye.nom}`

    const introLines = doc.splitTextToSize(
      `Je soussigné(e), représentant de la société ${societe.raison_sociale || '[Société]'}, certifie que ${civilite} ${nomComplet} est employé(e) au sein de notre établissement dans les conditions suivantes :`,
      contentW
    )
    doc.text(introLines, marginL, y)
    y += introLines.length * 6 + 8

    // ── Encadré infos salarié ──
    doc.setFillColor(250, 248, 246)
    doc.setDrawColor(232, 228, 224)
    doc.setLineWidth(0.4)
    doc.roundedRect(marginL, y, contentW, 68, 3, 3, 'FD')

    // Barre gauche colorée
    doc.setFillColor(74, 35, 48)
    doc.rect(marginL, y, 3, 68, 'F')

    const fields = [
      ['Nom & Prénom',       nomComplet],
      ['Poste occupé',       selectedEmploye.poste || '—'],
      ['Type de contrat',    selectedEmploye.type_contrat || '—'],
      ['Statut',             selectedEmploye.statut || '—'],
      ['Date d\'entrée',     selectedEmploye.date_entree
        ? new Date(selectedEmploye.date_entree).toLocaleDateString('fr-FR')
        : '—'],
      ['Temps de travail',   selectedEmploye.temps_travail || '—'],
      ...(selectedEmploye.forfait_jours
        ? [['Forfait jours', `${selectedEmploye.nb_jours_annuels || '—'} jours / an`]]
        : [['Heures hebdo', `${selectedEmploye.nb_heures_semaine || '—'}h / semaine`]]
      ),
    ]

    let fy = y + 10
    fields.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(139, 74, 90)
      doc.text(label, marginL + 8, fy)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(28, 25, 23)
      doc.text(String(val), marginL + 65, fy)
      fy += 9
    })
    y += 76

    // ── Corps légal ──
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(44, 40, 38)

    const corps = doc.splitTextToSize(
      `Cette attestation est délivrée à l'intéressé(e) pour faire valoir ce que de droit, notamment pour toute démarche administrative nécessitant la justification d'un emploi en cours.`,
      contentW
    )
    y += 6
    doc.text(corps, marginL, y)
    y += corps.length * 6 + 14

    // ── Date et lieu ──
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(100, 90, 85)
    doc.text(`Fait à ${societe.ville || '[Ville]'}, le ${today}`, marginL, y)
    y += 16

    // ── Zone signature ──
    doc.setFillColor(250, 248, 246)
    doc.setDrawColor(232, 228, 224)
    doc.setLineWidth(0.4)
    doc.roundedRect(marginL, y, 80, 36, 3, 3, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(139, 74, 90)
    doc.text('Signature & Cachet', marginL + 4, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(168, 162, 158)
    doc.text('Le représentant légal', marginL + 4, y + 15)
    doc.text(societe.raison_sociale || '', marginL + 4, y + 22)

    // ── Pied de page ──
    doc.setFillColor(245, 242, 240)
    doc.rect(0, 282, W, 15, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(168, 162, 158)
    doc.text(`${societe.raison_sociale || ''} · ${adresseSociete} · SIRET ${societe.siret || ''}`, W / 2, 290, { align: 'center' })
    doc.text(`Document généré le ${today} via KeepTrack`, W / 2, 295, { align: 'center' })

    doc.save(`attestation_emploi_${selectedEmploye.nom}_${selectedEmploye.prenom}_${new Date().toISOString().split('T')[0]}.pdf`)
    setGenerating(null)
  }

  // ─── GÉNÉRATION RÉCAP CONGÉS ─────────────────────────────────────────────────
  const genererRecapConges = async () => {
    if (!selectedEmploye) return
    setGenerating('recap')

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210
    const marginL = 20
    const marginR = 20
    const contentW = W - marginL - marginR
    const annee = new Date().getFullYear()
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const nomComplet = `${selectedEmploye.prenom} ${selectedEmploye.nom}`

    // ── En-tête ──
    doc.setFillColor(74, 35, 48)
    doc.rect(0, 0, W, 38, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(249, 199, 208)
    doc.text(societe?.raison_sociale || 'Société', marginL, 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(200, 160, 170)
    const adresseSociete = [societe?.numero_voie, societe?.nom_rue, societe?.code_postal, societe?.ville].filter(Boolean).join(' ')
    doc.text(adresseSociete, marginL, 23)

    // ── Titre ──
    doc.setFillColor(248, 244, 242)
    doc.rect(0, 38, W, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(28, 25, 23)
    doc.text(`RÉCAPITULATIF DES CONGÉS — ${annee}`, W / 2, 50, { align: 'center' })

    doc.setDrawColor(74, 35, 48)
    doc.setLineWidth(0.5)
    doc.line(marginL, 56, W - marginR, 56)

    let y = 66

    // ── Infos salarié ──
    doc.setFillColor(250, 248, 246)
    doc.setDrawColor(232, 228, 224)
    doc.setLineWidth(0.4)
    doc.roundedRect(marginL, y, contentW, 22, 3, 3, 'FD')
    doc.setFillColor(74, 35, 48)
    doc.rect(marginL, y, 3, 22, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(28, 25, 23)
    doc.text(nomComplet, marginL + 8, y + 9)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 113, 108)
    doc.text(`${selectedEmploye.poste || '—'} · ${selectedEmploye.type_contrat || '—'} · Entrée le ${selectedEmploye.date_entree ? new Date(selectedEmploye.date_entree).toLocaleDateString('fr-FR') : '—'}`, marginL + 8, y + 16)
    y += 30

    // ── Tableau soldes ──
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(28, 25, 23)
    doc.text('Soldes de congés', marginL, y)
    y += 6

    // En-tête tableau
    doc.setFillColor(74, 35, 48)
    doc.rect(marginL, y, contentW, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(249, 199, 208)

    const cols = [marginL + 2, marginL + 52, marginL + 90, marginL + 120, marginL + 150]
    doc.text('Type', cols[0], y + 6)
    doc.text('Acquis', cols[1], y + 6)
    doc.text('Pris', cols[2], y + 6)
    doc.text('Solde', cols[3], y + 6)
    doc.text('Statut', cols[4], y + 6)
    y += 9

    const lignesConges = [
      { label: 'Congés Payés N-1', acquis: soldes?.cp_n1_acquis, pris: soldes?.cp_n1_pris, solde: soldes?.cp_n1_solde },
      { label: 'Congés Payés N',   acquis: soldes?.cp_n_acquis,  pris: soldes?.cp_n_pris,  solde: soldes?.cp_n_solde  },
      { label: 'RTT',               acquis: soldes?.rtt_acquis,   pris: soldes?.rtt_pris,   solde: soldes?.rtt_solde   },
      { label: 'Récupération',      acquis: soldes?.recup_acquis, pris: soldes?.recup_pris, solde: soldes?.recup_solde },
    ]

    lignesConges.forEach((l, i) => {
      doc.setFillColor(i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 246 : 255)
      doc.rect(marginL, y, contentW, 9, 'F')
      doc.setDrawColor(232, 228, 224)
      doc.setLineWidth(0.2)
      doc.rect(marginL, y, contentW, 9, 'D')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(28, 25, 23)
      doc.text(l.label, cols[0], y + 6)

      doc.setFont('helvetica', 'bold')
      doc.text(`${l.acquis ?? '—'} j`, cols[1], y + 6)
      doc.text(`${l.pris ?? '—'} j`, cols[2], y + 6)

      const soldeVal = l.solde ?? 0
      doc.setTextColor(soldeVal > 0 ? 22 : 220, soldeVal > 0 ? 163 : 38, soldeVal > 0 ? 74 : 38)
      doc.text(`${soldeVal} j`, cols[3], y + 6)

      doc.setTextColor(soldeVal > 5 ? 22 : soldeVal > 0 ? 180 : 220, soldeVal > 5 ? 163 : soldeVal > 0 ? 120 : 38, soldeVal > 5 ? 74 : 38)
      doc.setFontSize(8)
      doc.text(soldeVal > 5 ? 'OK' : soldeVal > 0 ? 'Faible' : 'Épuisé', cols[4], y + 6)
      y += 9
    })

    y += 12

    // ── Historique absences ──
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(28, 25, 23)
    doc.text(`Historique des absences approuvées — ${annee}`, marginL, y)
    y += 6

    const absAnnee = absences.filter(a => a.date_debut?.startsWith(String(annee)))

    if (absAnnee.length === 0) {
      doc.setFillColor(250, 248, 246)
      doc.setDrawColor(232, 228, 224)
      doc.roundedRect(marginL, y, contentW, 12, 2, 2, 'FD')
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9.5)
      doc.setTextColor(168, 162, 158)
      doc.text('Aucune absence enregistrée pour cette année.', marginL + 4, y + 8)
      y += 18
    } else {
      // En-tête tableau absences
      doc.setFillColor(74, 35, 48)
      doc.rect(marginL, y, contentW, 9, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(249, 199, 208)
      doc.text('Type',        marginL + 2,   y + 6)
      doc.text('Début',       marginL + 55,  y + 6)
      doc.text('Fin',         marginL + 90,  y + 6)
      doc.text('Durée',       marginL + 125, y + 6)
      doc.text('Statut',      marginL + 150, y + 6)
      y += 9

      absAnnee.forEach((a, i) => {
        if (y > 265) {
          doc.addPage()
          y = 20
        }
        doc.setFillColor(i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 246 : 255)
        doc.rect(marginL, y, contentW, 9, 'F')
        doc.setDrawColor(232, 228, 224)
        doc.setLineWidth(0.2)
        doc.rect(marginL, y, contentW, 9, 'D')

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(28, 25, 23)
        doc.text(a.type_absence || '—',                                              marginL + 2,   y + 6)
        doc.text(new Date(a.date_debut).toLocaleDateString('fr-FR'),                 marginL + 55,  y + 6)
        doc.text(new Date(a.date_fin).toLocaleDateString('fr-FR'),                   marginL + 90,  y + 6)
        doc.setFont('helvetica', 'bold')
        doc.text(`${a.nb_jours ?? '—'} j`,                                           marginL + 125, y + 6)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(22, 163, 74)
        doc.text(a.statut || '—',                                                    marginL + 150, y + 6)
        y += 9
      })
      y += 4
    }

    // ── Pied de page ──
    doc.setFillColor(245, 242, 240)
    doc.rect(0, 282, W, 15, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(168, 162, 158)
    doc.text(`${societe?.raison_sociale || ''} · SIRET ${societe?.siret || ''}`, W / 2, 290, { align: 'center' })
    doc.text(`Document généré le ${today} via KeepTrack`, W / 2, 295, { align: 'center' })

    doc.save(`recap_conges_${selectedEmploye.nom}_${selectedEmploye.prenom}_${annee}.pdf`)
    setGenerating(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E8E4E0', borderTopColor: '#8B4A5A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const isAdminOrManager = currentRole === 'admin' || currentRole === 'manager'

  return (
    <div style={{ padding: '0 40px 40px', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>

      {/* SÉLECTEUR SALARIÉ (admin/manager uniquement) */}
      {isAdminOrManager && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#A8A29E', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Générer un document pour
          </label>
          <select
            value={selectedEmployeId || ''}
            onChange={e => setSelectedEmployeId(e.target.value)}
            style={{ width: '100%', maxWidth: '360px', border: '1px solid #E8E4E0', borderRadius: '10px', padding: '9px 12px', fontSize: '14px', background: '#FAF8F6', outline: 'none', color: '#1C1917', fontFamily: 'inherit', cursor: 'pointer' }}>
            {employes.map(e => (
              <option key={e.id} value={e.id}>{e.prenom} {e.nom} {e.poste ? `— ${e.poste}` : ''}</option>
            ))}
          </select>
        </div>
      )}

      {/* CARTE SALARIÉ SÉLECTIONNÉ */}
      {selectedEmploye && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F2E6E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#6B2F42', flexShrink: 0 }}>
            {selectedEmploye.prenom?.[0]}{selectedEmploye.nom?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1C1917', margin: '0 0 3px' }}>{selectedEmploye.prenom} {selectedEmploye.nom}</p>
            <p style={{ fontSize: '13px', color: '#78716C', margin: 0 }}>{selectedEmploye.poste || '—'} · {selectedEmploye.type_contrat || '—'} · Entrée le {selectedEmploye.date_entree ? new Date(selectedEmploye.date_entree).toLocaleDateString('fr-FR') : '—'}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: '#F9EEF1', color: '#6B2F42' }}>{selectedEmploye.statut || '—'}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: '#F0EDE9', color: '#78716C' }}>{selectedEmploye.type_contrat || '—'}</span>
          </div>
        </div>
      )}

      {/* DOCUMENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* ATTESTATION EMPLOYEUR */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #4A2330, #6B2F42)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F9C7D0" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1917', margin: '0 0 3px' }}>Attestation d'emploi</h3>
              <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>Certifie qu'un salarié est bien employé dans la société</p>
            </div>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <div style={{ marginBottom: '16px' }}>
              {[
                'En-tête société (raison sociale, adresse, SIRET)',
                'Informations contractuelles complètes',
                'Corps légal standard',
                'Zone signature & cachet',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8B4A5A', flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', color: '#78716C' }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={genererAttestation} disabled={generating === 'attestation' || !selectedEmploye}
              style={{
                width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                background: generating === 'attestation' ? '#C4B5A5' : 'linear-gradient(135deg, #4A2330, #6B2F42)',
                color: 'white', fontSize: '13.5px', fontWeight: 600,
                cursor: generating === 'attestation' ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { if (!generating) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { if (!generating) e.currentTarget.style.opacity = '1' }}>
              {generating === 'attestation' ? (
                <>
                  <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                  Génération…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Télécharger le PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* RÉCAP CONGÉS */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E4E0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0EDE9', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #1D4ED8, #4F7EF7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1917', margin: '0 0 3px' }}>Récap congés annuel</h3>
              <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>Tableau de bord complet des congés de l'année en cours</p>
            </div>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <div style={{ marginBottom: '16px' }}>
              {[
                'Soldes CP N-1, CP N, RTT et Récupération',
                'Acquis / Pris / Solde restant détaillés',
                `Historique des absences approuvées ${new Date().getFullYear()}`,
                'Statut de chaque compteur (OK / Faible / Épuisé)',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4F7EF7', flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', color: '#78716C' }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={genererRecapConges} disabled={generating === 'recap' || !selectedEmploye}
              style={{
                width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                background: generating === 'recap' ? '#C4B5A5' : 'linear-gradient(135deg, #1D4ED8, #4F7EF7)',
                color: 'white', fontSize: '13.5px', fontWeight: 600,
                cursor: generating === 'recap' ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { if (!generating) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { if (!generating) e.currentTarget.style.opacity = '1' }}>
              {generating === 'recap' ? (
                <>
                  <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                  Génération…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Télécharger le PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* NOTE */}
      <div style={{ marginTop: '16px', padding: '14px 20px', background: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '1px solid #E8E4E0' }}>
        <p style={{ fontSize: '12px', color: '#78716C', margin: 0 }}>
          💡 Les documents PDF sont générés directement dans votre navigateur et téléchargés automatiquement. Les informations proviennent des données renseignées dans KeepTrack.
        </p>
      </div>
    </div>
  )
}
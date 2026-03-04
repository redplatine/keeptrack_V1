import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const { emailSalarie, prenomSalarie, typeAbsence, dateDebut, dateFin, nbJours, statut } = await request.json()

  if (!emailSalarie) {
    return Response.json({ error: 'Email manquant' }, { status: 400 })
  }

  const isApprouvee = statut === 'Approuvée'

  const subject = isApprouvee
    ? `✅ Votre absence a été approuvée — ${typeAbsence}`
    : `❌ Votre absence a été refusée — ${typeAbsence}`

  const html = `
    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #F7F5F3;">

      <!-- HEADER -->
      <div style="background: #4A2330; border-radius: 16px; padding: 28px 24px; text-align: center; margin-bottom: 20px;">
        <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.1); border-radius: 12px; margin: 0 auto 12px;">
          <span style="font-size: 22px; line-height: 44px; display: block;">${isApprouvee ? '✅' : '❌'}</span>
        </div>
        <h1 style="color: #F0E8EA; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">KeepTrack</h1>
        <p style="color: #9E737D; margin: 4px 0 0; font-size: 13px;">GTA Specialist App</p>
      </div>

      <!-- CORPS -->
      <div style="background: white; border-radius: 16px; padding: 28px; border: 1px solid #E8E4E0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">

        <!-- Intro -->
        <p style="font-size: 15px; font-weight: 600; color: #1C1917; margin: 0 0 8px;">
          Bonjour <span style="color: #6B2F42;">${prenomSalarie}</span>,
        </p>
        <p style="font-size: 14px; color: #44403C; margin: 0 0 24px; line-height: 1.6;">
          ${isApprouvee
            ? 'Votre demande d\'absence a été <strong style="color: #16A34A;">approuvée</strong>.'
            : 'Votre demande d\'absence a été <strong style="color: #DC2626;">refusée</strong>. Contactez votre manager pour plus d\'informations.'
          }
        </p>

        <!-- Tableau récap -->
        <div style="background: #FAF8F6; border-radius: 12px; border: 1px solid #E8E4E0; overflow: hidden; margin-bottom: 20px;">
          ${[
            ['Type d\'absence', typeAbsence],
            ['Date de début',   dateDebut],
            ['Date de fin',     dateFin],
            ['Nombre de jours', `${nbJours} j`],
          ].map(([label, val], i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; ${i > 0 ? 'border-top: 1px solid #F0EDE9;' : ''}">
              <span style="font-size: 12px; font-weight: 600; color: #A8A29E; text-transform: uppercase; letter-spacing: 0.05em;">${label}</span>
              <span style="font-size: 14px; font-weight: 600; color: #1C1917;">${val}</span>
            </div>
          `).join('')}

          <!-- Statut -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #F0EDE9;">
            <span style="font-size: 12px; font-weight: 600; color: #A8A29E; text-transform: uppercase; letter-spacing: 0.05em;">Statut</span>
            <span style="
              display: inline-flex; align-items: center; gap: 6px;
              font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;
              background: ${isApprouvee ? '#F0FDF4' : '#FEF2F2'};
              color: ${isApprouvee ? '#16A34A' : '#DC2626'};
              border: 1px solid ${isApprouvee ? '#BBF7D0' : '#FECACA'};
            ">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${isApprouvee ? '#4ADE80' : '#F87171'}; display: inline-block;"></span>
              ${statut}
            </span>
          </div>
        </div>

        <!-- Séparateur + footer interne -->
        <div style="border-top: 1px solid #F0EDE9; padding-top: 16px;">
          <p style="color: #A8A29E; font-size: 12px; text-align: center; margin: 0;">
            Cet email a été envoyé automatiquement. Ne pas répondre.
          </p>
        </div>

      </div>

      <!-- FOOTER -->
      <p style="color: #C4B5A5; font-size: 11px; text-align: center; margin-top: 20px;">
        KeepTrack · GTA Specialist App
      </p>

    </div>
  `

  const { error } = await resend.emails.send({
    from: 'KeepTrack <onboarding@resend.dev>',
    to: 'alexandre.aubry.dumand@gmail.com',
    subject,
    html,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
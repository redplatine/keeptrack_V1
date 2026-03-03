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

  const couleur = isApprouvee ? '#16a34a' : '#dc2626'
  const emoji = isApprouvee ? '✅' : '❌'
  const message = isApprouvee
    ? 'Votre demande d\'absence a été <strong>approuvée</strong>.'
    : 'Votre demande d\'absence a été <strong>refusée</strong>. Contactez votre manager pour plus d\'informations.'

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
      <div style="background: #2563eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">KeepTrack</h1>
        <p style="color: #bfdbfe; margin: 4px 0 0;">GTA Specialist App</p>
      </div>

      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
        <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 16px;">
          ${emoji} Bonjour ${prenomSalarie},
        </p>
        <p style="color: #374151; margin: 0 0 16px;">${message}</p>

        <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Type</td>
              <td style="padding: 6px 0; font-weight: 600; color: #1f2937; text-align: right;">${typeAbsence}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Date début</td>
              <td style="padding: 6px 0; font-weight: 600; color: #1f2937; text-align: right;">${dateDebut}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Date fin</td>
              <td style="padding: 6px 0; font-weight: 600; color: #1f2937; text-align: right;">${dateFin}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Nombre de jours</td>
              <td style="padding: 6px 0; font-weight: 600; color: #1f2937; text-align: right;">${nbJours} j</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Statut</td>
              <td style="padding: 6px 0; text-align: right;">
                <span style="background: ${isApprouvee ? '#dcfce7' : '#fee2e2'}; color: ${couleur}; padding: 2px 10px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                  ${statut}
                </span>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        Cet email a été envoyé automatiquement par KeepTrack. Ne pas répondre à cet email.
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
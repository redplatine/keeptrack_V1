import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const { prenomSalarie, nomSalarie, emailSalarie, sujet, message } = await request.json()

  const html = `
    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #F7F5F3;">

      <!-- HEADER -->
      <div style="background: #4A2330; border-radius: 16px; padding: 28px 24px; text-align: center; margin-bottom: 20px;">
        <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.1); border-radius: 12px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 22px;">📅</span>
        </div>
        <h1 style="color: #F0E8EA; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">KeepTrack</h1>
        <p style="color: #9E737D; margin: 4px 0 0; font-size: 13px;">Nouveau message salarié</p>
      </div>

      <!-- CORPS -->
      <div style="background: white; border-radius: 16px; padding: 28px; border: 1px solid #E8E4E0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">

        <!-- Titre -->
        <p style="font-size: 15px; font-weight: 600; color: #1C1917; margin: 0 0 20px;">
          Message de <span style="color: #6B2F42;">${prenomSalarie} ${nomSalarie}</span>
        </p>

        <!-- Sujet -->
        <div style="margin-bottom: 12px;">
          <p style="font-size: 11px; font-weight: 600; color: #A8A29E; text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 4px;">Sujet</p>
          <p style="font-size: 14px; font-weight: 600; color: #1C1917; margin: 0; background: #FAF8F6; padding: 10px 14px; border-radius: 10px; border: 1px solid #E8E4E0;">${sujet}</p>
        </div>

        <!-- Email -->
        <div style="margin-bottom: 12px;">
          <p style="font-size: 11px; font-weight: 600; color: #A8A29E; text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 4px;">Email</p>
          <p style="font-size: 14px; color: #44403C; margin: 0; background: #FAF8F6; padding: 10px 14px; border-radius: 10px; border: 1px solid #E8E4E0; font-family: monospace;">${emailSalarie}</p>
        </div>

        <!-- Message -->
        <div style="margin-bottom: 20px;">
          <p style="font-size: 11px; font-weight: 600; color: #A8A29E; text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 4px;">Message</p>
          <div style="font-size: 14px; color: #44403C; margin: 0; background: #FAF8F6; padding: 14px; border-radius: 10px; border: 1px solid #E8E4E0; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>

        <!-- Séparateur -->
        <div style="border-top: 1px solid #F0EDE9; padding-top: 16px;">
          <p style="color: #A8A29E; font-size: 12px; text-align: center; margin: 0;">
            Connectez-vous à KeepTrack pour répondre à ce message.
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
    subject: `📨 [KeepTrack] ${sujet} — ${prenomSalarie} ${nomSalarie}`,
    html,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
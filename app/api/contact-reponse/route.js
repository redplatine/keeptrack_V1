import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const { emailSalarie, prenomSalarie, sujet, messageOriginal, reponse } = await request.json()

  const html = `
    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #F7F5F3;">

      <!-- HEADER -->
      <div style="background: #4A2330; border-radius: 16px; padding: 28px 24px; text-align: center; margin-bottom: 20px;">
        <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.1); border-radius: 12px; margin: 0 auto 12px;">
          <span style="font-size: 22px; line-height: 44px; display: block;">💬</span>
        </div>
        <h1 style="color: #F0E8EA; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">KeepTrack</h1>
        <p style="color: #9E737D; margin: 4px 0 0; font-size: 13px;">Réponse à votre message</p>
      </div>

      <!-- CORPS -->
      <div style="background: white; border-radius: 16px; padding: 28px; border: 1px solid #E8E4E0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">

        <!-- Intro -->
        <p style="font-size: 15px; font-weight: 600; color: #1C1917; margin: 0 0 20px;">
          Bonjour <span style="color: #6B2F42;">${prenomSalarie}</span>, le service RH a répondu à votre message.
        </p>

        <!-- Réponse RH — bulle bordeaux -->
        <div style="margin-bottom: 16px;">
          <p style="font-size: 11px; font-weight: 600; color: #A8A29E; text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 6px;">Réponse du service RH</p>
          <div style="background: #F9EEF1; border-radius: 12px; padding: 16px; border: 1px solid #DDB8C2; border-left: 3px solid #8B4A5A; font-size: 14px; color: #44403C; line-height: 1.6; white-space: pre-wrap;">${reponse}</div>
        </div>

        <!-- Séparateur -->
        <div style="border-top: 1px solid #F0EDE9; margin: 20px 0;"></div>

        <!-- Message original -->
        <div>
          <p style="font-size: 11px; font-weight: 600; color: #A8A29E; text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 6px;">Votre message original — ${sujet}</p>
          <div style="background: #FAF8F6; border-radius: 12px; padding: 14px 16px; border: 1px solid #F0EDE9; font-size: 13px; color: #78716C; line-height: 1.6; white-space: pre-wrap;">${messageOriginal}</div>
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
    to: emailSalarie,
    subject: `💬 [KeepTrack] Réponse à votre message — ${sujet}`,
    html,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
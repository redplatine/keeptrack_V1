import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const { emailSalarie, prenomSalarie, sujet, messageOriginal, reponse } = await request.json()

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
      <div style="background: #2563eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">KeepTrack</h1>
        <p style="color: #bfdbfe; margin: 4px 0 0;">Réponse à votre message</p>
      </div>
      <div style="background: #f9fafb; border-radius: 12px; padding: 24px;">
        <p style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0 0 16px;">
          💬 Bonjour ${prenomSalarie}, le service RH a répondu à votre message
        </p>
        <div style="background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;">Réponse :</p>
          <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${reponse}</p>
        </div>
        <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0 0 4px;">Votre message original (${sujet}) :</p>
          <p style="color: #6b7280; font-size: 13px; margin: 0; white-space: pre-wrap;">${messageOriginal}</p>
        </div>
      </div>
    </div>
  `

  const { error } = await resend.emails.send({
    from: 'KeepTrack <onboarding@resend.dev>',
    to: 'alexandre.aubry.dumand@gmail.com',
    subject: `💬 [KeepTrack] Réponse à votre message — ${sujet}`,
    html,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
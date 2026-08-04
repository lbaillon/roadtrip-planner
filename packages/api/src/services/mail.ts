import { env } from '#api/env.js'
import { Resend } from 'resend'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

async function sendMail(to: string, subject: string, html: string) {
  if (!resend) {
    console.info(
      `[mail] RESEND_API_KEY missing — skipping send to=${to} subject="${subject}"`
    )
    return
  }
  try {
    const { data, error } = await resend.emails.send({
      from: env.MAIL_FROM,
      to,
      subject,
      html,
    })
    if (error) {
      console.error('[mail] send failed:', error)
    } else {
      console.info(
        `[mail] sent id=${data?.id} from=${env.MAIL_FROM} to=${to} subject="${subject}"`
      )
    }
  } catch (err) {
    console.error('[mail] send threw:', err)
  }
}

export async function sendConfirmationEmail(
  to: string,
  confirmationUrl: string
) {
  await sendMail(
    to,
    'Confirmez votre adresse email',
    `<p>Bienvenue sur Roadtrip Planner !</p>
     <p>Confirmez votre adresse email en cliquant sur ce lien :</p>
     <p><a href="${confirmationUrl}">Confirmer mon email</a></p>`
  )
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendMail(
    to,
    'Réinitialisation de votre mot de passe',
    `<p>Vous avez demandé à réinitialiser votre mot de passe.</p>
     <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
     <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
  )
}

export async function sendShareEmail(
  to: string,
  inviterName: string,
  resourceLabel: 'trace' | 'voyage',
  resourceName: string,
  url: string,
  hasAccount: boolean
) {
  // "trace" is feminine, "voyage" masculine
  const isFeminine = resourceLabel === 'trace'
  const definiteArticle = isFeminine ? 'la' : 'le'
  const indefiniteArticle = isFeminine ? 'une' : 'un'
  const callToAction = hasAccount
    ? `<p><a href="${url}">Voir ${definiteArticle} ${resourceLabel}</a></p>`
    : `<p>Créez un compte pour y accéder : <a href="${url}">${url}</a></p>`
  await sendMail(
    to,
    `${inviterName} a partagé ${indefiniteArticle} ${resourceLabel} avec vous`,
    `<p>${inviterName} a partagé ${definiteArticle} ${resourceLabel} « ${resourceName} » avec vous.</p>${callToAction}`
  )
}

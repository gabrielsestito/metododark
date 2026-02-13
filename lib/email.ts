import nodemailer from "nodemailer"

const emailUser = process.env.EMAIL_USER
const emailPass = process.env.EMAIL_APP_PASSWORD
const emailFrom = process.env.EMAIL_FROM || emailUser

const transporter = emailUser && emailPass
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  : null

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  if (!transporter || !emailFrom) {
    return { ok: false, error: "EMAIL_NOT_CONFIGURED" }
  }

  await transporter.sendMail({
    from: emailFrom,
    to,
    subject,
    html,
    text,
  })

  return { ok: true }
}

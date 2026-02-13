const baseStyles = `
  body { margin: 0; padding: 0; background: #0a0a0a; color: #ffffff; font-family: Arial, Helvetica, sans-serif; }
  .wrapper { width: 100%; background: #0a0a0a; padding: 32px 12px; }
  .card { max-width: 640px; margin: 0 auto; background: #0f0f0f; border: 1px solid #1f1f1f; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
  .header { padding: 28px 32px; background: linear-gradient(135deg, #0b0b0b 0%, #141414 60%, #1f1f1f 100%); border-bottom: 1px solid #1f1f1f; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { height: 36px; width: 36px; border-radius: 8px; display: inline-block; }
  .brand-title { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.2px; }
  .content { padding: 28px 32px; color: #e5e5e5; }
  .content h2 { margin: 0 0 12px 0; font-size: 20px; color: #ffffff; }
  .content p { margin: 0 0 16px 0; line-height: 1.6; font-size: 14px; color: #d4d4d4; }
  .list { margin: 16px 0; padding: 0; list-style: none; }
  .list li { margin: 8px 0; padding: 10px 12px; background: #141414; border-radius: 10px; border: 1px solid #1f1f1f; font-size: 14px; color: #e5e5e5; }
  .cta { display: inline-block; padding: 12px 18px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; }
  .muted { color: #9ca3af; font-size: 12px; }
  .footer { padding: 18px 32px 28px 32px; color: #9ca3af; font-size: 12px; }
`

function wrapHtml(title: string, body: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const logoUrl = process.env.EMAIL_LOGO_URL || `${baseUrl}/logo.png`
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Metodo Dark" />`
    : ""
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <div class="brand">
              ${logoHtml}
              <h1 class="brand-title">Metodo Dark</h1>
            </div>
          </div>
          <div class="content">
            ${body}
          </div>
          <div class="footer">
            <div class="muted">Se você não solicitou este email, pode ignorá-lo com segurança.</div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `
}

export function purchaseConfirmationEmail({
  name,
  courses,
  total,
  ctaUrl,
}: {
  name: string
  courses: string[]
  total: string
  ctaUrl: string
}) {
  const listItems = courses.map((course) => `<li>${course}</li>`).join("")
  const body = `
    <h2>Compra confirmada 🎉</h2>
    <p>Olá ${name}, sua compra foi confirmada com sucesso. Os cursos abaixo já estão disponíveis na sua conta.</p>
    <ul class="list">${listItems}</ul>
    <p><strong>Total:</strong> ${total}</p>
    <a class="cta" href="${ctaUrl}">Acessar meus cursos</a>
  `
  return wrapHtml("Compra confirmada", body)
}

export function subscriptionActiveEmail({
  name,
  planName,
  periodEnd,
  ctaUrl,
}: {
  name: string
  planName: string
  periodEnd: string
  ctaUrl: string
}) {
  const body = `
    <h2>Plano ativado ✅</h2>
    <p>Olá ${name}, sua assinatura do plano <strong>${planName}</strong> foi ativada.</p>
    <p>Seu período atual vai até <strong>${periodEnd}</strong>.</p>
    <a class="cta" href="${ctaUrl}">Explorar cursos</a>
  `
  return wrapHtml("Assinatura ativada", body)
}

export function subscriptionExpiringEmail({
  name,
  periodEnd,
  ctaUrl,
}: {
  name: string
  periodEnd: string
  ctaUrl: string
}) {
  const body = `
    <h2>Sua assinatura está perto do vencimento</h2>
    <p>Olá ${name}, sua assinatura vence em <strong>${periodEnd}</strong>.</p>
    <p>Para manter seu acesso completo aos cursos, renove antes da data final.</p>
    <a class="cta" href="${ctaUrl}">Gerenciar assinatura</a>
  `
  return wrapHtml("Assinatura perto do vencimento", body)
}

export function passwordResetEmail({
  name,
  resetUrl,
}: {
  name: string
  resetUrl: string
}) {
  const body = `
    <h2>Redefinir senha</h2>
    <p>Olá ${name}, recebemos um pedido para redefinir sua senha.</p>
    <p>Clique no botão abaixo para criar uma nova senha:</p>
    <a class="cta" href="${resetUrl}">Redefinir senha</a>
    <p class="muted">Este link expira em 2 horas.</p>
  `
  return wrapHtml("Redefinir senha", body)
}

export function remarketingEmail({
  name,
  courses,
  ctaUrl,
}: {
  name: string
  courses: Array<{ title: string; subtitle?: string | null }>
  ctaUrl: string
}) {
  const listItems = courses
    .map(
      (course) =>
        `<li><strong>${course.title}</strong>${course.subtitle ? ` — ${course.subtitle}` : ""}</li>`
    )
    .join("")
  const body = `
    <h2>Seu próximo nível começa aqui</h2>
    <p>Olá ${name}, vimos que você ainda não garantiu seu acesso. Separamos alguns cursos incríveis para você começar hoje.</p>
    <ul class="list">${listItems}</ul>
    <a class="cta" href="${ctaUrl}">Ver cursos disponíveis</a>
  `
  return wrapHtml("Comece hoje no Método Dark", body)
}

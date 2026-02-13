import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { remarketingEmail, subscriptionExpiringEmail } from "@/lib/email-templates"

const appBaseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

export async function runEmailReminders() {
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const expiryThreshold = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

  let remarketingSent = 0
  let expirySent = 0

  const expiringSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "active",
      currentPeriodEnd: {
        gte: now,
        lte: expiryThreshold,
      },
    },
    include: {
      user: true,
    },
  })

  for (const subscription of expiringSubscriptions) {
    if (!subscription.user?.email) continue
    if (subscription.lastExpiryReminderAt && subscription.currentPeriodStart) {
      if (subscription.lastExpiryReminderAt >= subscription.currentPeriodStart) {
        continue
      }
    }

    const periodEnd = subscription.currentPeriodEnd
      ? subscription.currentPeriodEnd.toLocaleDateString("pt-BR")
      : "em breve"
    const html = subscriptionExpiringEmail({
      name: subscription.user.name || "Aluno",
      periodEnd,
      ctaUrl: `${appBaseUrl}/subscription`,
    })

    await sendEmail({
      to: subscription.user.email,
      subject: "Sua assinatura vence em breve",
      html,
    })

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { lastExpiryReminderAt: now },
    })

    expirySent++
  }

  const remarketingUsers = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      createdAt: { lte: twoDaysAgo },
      OR: [
        { lastRemarketingEmailAt: null },
        { lastRemarketingEmailAt: { lte: twoDaysAgo } },
      ],
      orders: {
        none: { status: "completed" },
      },
      NOT: {
        subscription: {
          is: { status: "active" },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { title: true, subtitle: true },
  })

  for (const user of remarketingUsers) {
    if (!user.email) continue
    const html = remarketingEmail({
      name: user.name || "Aluno",
      courses,
      ctaUrl: `${appBaseUrl}/cursos`,
    })

    await sendEmail({
      to: user.email,
      subject: "Seu próximo curso está te esperando",
      html,
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { lastRemarketingEmailAt: now },
    })

    remarketingSent++
  }

  return { remarketingSent, expirySent }
}

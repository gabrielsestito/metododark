import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se os modelos existem no Prisma Client
    if (!prisma.subscriptionPlan || !prisma.subscription) {
      return NextResponse.json(
        { 
          error: "Prisma Client precisa ser regenerado",
          details: "Execute: npx prisma generate && npx prisma db push"
        },
        { status: 500 }
      )
    }

    // Buscar plano de assinatura ativo
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        courses: true,
      },
    })

    // Buscar assinatura do usuário
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    // Verificar se a assinatura está realmente ativa (status active e não expirada)
    const hasActiveSubscription = !!(subscription?.status === "active" && 
      subscription.currentPeriodEnd && 
      new Date(subscription.currentPeriodEnd) > new Date())

    // Se a assinatura está vencida/expirada, limpar enrollments de cursos não comprados
    if (subscription && !hasActiveSubscription && (subscription.status === "expired" || subscription.status === "canceled" || (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) <= new Date()))) {
      if (plan?.courses && plan.courses.length > 0) {
        for (const planCourse of plan.courses) {
          const enrollment = await prisma.enrollment.findUnique({
            where: {
              userId_courseId: {
                userId: session.user.id,
                courseId: planCourse.courseId,
              },
            },
          })

          if (enrollment && enrollment.expiresAt && new Date(enrollment.expiresAt) <= new Date()) {
            // Verificar se o curso foi comprado
            const purchasedOrder = await prisma.order.findFirst({
              where: {
                userId: session.user.id,
                status: "completed",
                items: {
                  some: {
                    courseId: planCourse.courseId,
                  },
                },
              },
            })

            if (purchasedOrder) {
              // Se foi comprado, remover expiresAt (voltar ao acesso vitalício)
              await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: { expiresAt: null },
              })
            } else {
              // Se não foi comprado, remover enrollment
              await prisma.enrollment.delete({
                where: { id: enrollment.id },
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      plan: plan || null,
      subscription: subscription || null,
      hasActiveSubscription,
    })
  } catch (error: any) {
    console.error("Error fetching subscription:", error)
    
    if (error.message?.includes("subscriptionPlan") || error.message?.includes("subscription") || error.message?.includes("Cannot read properties")) {
      return NextResponse.json(
        { 
          error: "Prisma Client precisa ser regenerado",
          details: "Execute: npx prisma generate && npx prisma db push"
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao buscar informações de assinatura" },
      { status: 500 }
    )
  }
}


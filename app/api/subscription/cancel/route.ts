import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se o modelo existe no Prisma Client
    if (!prisma.subscription) {
      return NextResponse.json(
        { 
          error: "Prisma Client precisa ser regenerado",
          details: "Execute: npx prisma generate && npx prisma db push"
        },
        { status: 500 }
      )
    }

    // Buscar assinatura do usuário
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      )
    }

    if (subscription.status !== "active") {
      return NextResponse.json(
        { error: "Sua assinatura já está cancelada ou inativa" },
        { status: 400 }
      )
    }

    // Buscar plano de assinatura para remover cursos
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
      },
    })

    // Remover acesso aos cursos do plano (exceto os comprados)
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

        if (enrollment) {
          // Verificar se o curso foi comprado (existe um Order com status "completed")
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
            // Se o curso foi comprado, apenas remover o expiresAt (voltar ao acesso vitalício)
            await prisma.enrollment.update({
              where: { id: enrollment.id },
              data: { expiresAt: null },
            })
          } else {
            // Se o curso não foi comprado, remover o enrollment completamente
            await prisma.enrollment.delete({
              where: { id: enrollment.id },
            })
          }
        }
      }
    }

    // Marcar para cancelar ao fim do período e atualizar status
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        cancelAtPeriodEnd: true,
        status: "canceled",
      },
    })

    return NextResponse.json({ 
      success: true,
      message: "Assinatura cancelada. O acesso aos cursos foi removido."
    })
  } catch (error: any) {
    console.error("Error canceling subscription:", error)
    return NextResponse.json(
      { error: "Erro ao cancelar assinatura" },
      { status: 500 }
    )
  }
}


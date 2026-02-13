import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission("canManageUsers")
    if (!session) {
      return unauthorizedResponse()
    }

    const { planId, status, currentPeriodStart, currentPeriodEnd } = await req.json()

    if (!status) {
      return NextResponse.json(
        { error: "Status é obrigatório" },
        { status: 400 }
      )
    }

    if (!planId) {
      return NextResponse.json(
        { error: "Plano de assinatura é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar plano específico para obter os cursos
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Plano de assinatura não encontrado" },
        { status: 404 }
      )
    }

    // Criar ou atualizar assinatura
    const subscription = await prisma.subscription.upsert({
      where: { userId: params.id },
      create: {
        userId: params.id,
        status,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : new Date(),
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      },
      update: {
        status,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : undefined,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      },
    })

    // Se a assinatura está ativa e há um plano com cursos, matricular o usuário nos cursos
    if (status === "active" && plan?.courses && plan.courses.length > 0) {
      for (const planCourse of plan.courses) {
        // Verificar se já existe matrícula
        const existingEnrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: params.id,
              courseId: planCourse.courseId,
            },
          },
        })

        if (!existingEnrollment) {
          // Criar matrícula vitalícia (ou com expiração baseada na assinatura)
          await prisma.enrollment.create({
            data: {
              userId: params.id,
              courseId: planCourse.courseId,
              expiresAt: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
            },
          })
        } else if (currentPeriodEnd) {
          // Atualizar expiração se necessário
          await prisma.enrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              expiresAt: new Date(currentPeriodEnd),
            },
          })
        }
      }
    }

    return NextResponse.json(subscription)
  } catch (error: any) {
    console.error("Error creating subscription:", error)
    return NextResponse.json(
      { error: "Erro ao criar assinatura", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission("canManageUsers")
    if (!session) {
      return unauthorizedResponse()
    }

    const { planId, status, currentPeriodStart, currentPeriodEnd } = await req.json()

    if (!status) {
      return NextResponse.json(
        { error: "Status é obrigatório" },
        { status: 400 }
      )
    }

    if (!planId) {
      return NextResponse.json(
        { error: "Plano de assinatura é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar plano específico para obter os cursos
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Plano de assinatura não encontrado" },
        { status: 404 }
      )
    }

    // Atualizar assinatura
    const subscription = await prisma.subscription.update({
      where: { userId: params.id },
      data: {
        status,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : undefined,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      },
    })

    // Se a assinatura está ativa e há um plano com cursos, matricular o usuário nos cursos
    if (status === "active" && plan?.courses && plan.courses.length > 0) {
      for (const planCourse of plan.courses) {
        // Verificar se já existe matrícula
        const existingEnrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: params.id,
              courseId: planCourse.courseId,
            },
          },
        })

        if (!existingEnrollment) {
          // Criar matrícula vitalícia (ou com expiração baseada na assinatura)
          await prisma.enrollment.create({
            data: {
              userId: params.id,
              courseId: planCourse.courseId,
              expiresAt: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
            },
          })
        } else if (currentPeriodEnd) {
          // Atualizar expiração se necessário
          await prisma.enrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              expiresAt: new Date(currentPeriodEnd),
            },
          })
        }
      }
    } else if ((status === "canceled" || status === "expired") && plan?.courses && plan.courses.length > 0) {
      // Se a assinatura foi cancelada/expirada, remover acesso aos cursos do plano
      for (const planCourse of plan.courses) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: params.id,
              courseId: planCourse.courseId,
            },
          },
        })

        if (enrollment) {
          // Verificar se o curso foi comprado (existe um Order com status "completed")
          const purchasedOrder = await prisma.order.findFirst({
            where: {
              userId: params.id,
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
            if (enrollment.expiresAt) {
              await prisma.enrollment.update({
                where: {
                  id: enrollment.id,
                },
                data: {
                  expiresAt: null,
                },
              })
            }
          } else {
            // Se o curso não foi comprado, remover o enrollment completamente
            await prisma.enrollment.delete({
              where: {
                id: enrollment.id,
              },
            })
          }
        }
      }
    }

    return NextResponse.json(subscription)
  } catch (error: any) {
    console.error("Error updating subscription:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar assinatura", details: error.message },
      { status: 500 }
    )
  }
}

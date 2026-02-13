import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"

export async function GET() {
  try {
    const session = await requirePermission("canManageSubscriptions")
    if (!session) {
      return unauthorizedResponse()
    }

    // Verificar se o modelo existe no Prisma Client
    if (!prisma.subscriptionPlan) {
      return NextResponse.json(
        { 
          error: "Prisma Client precisa ser regenerado",
          details: "Execute: npx prisma generate && npx prisma db push"
        },
        { status: 500 }
      )
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(plans)
  } catch (error: any) {
    console.error("Error fetching subscription plan:", error)
    
    if (error.message?.includes("subscriptionPlan") || error.message?.includes("Cannot read properties")) {
      return NextResponse.json(
        { 
          error: "Prisma Client precisa ser regenerado",
          details: "Execute: npx prisma generate && npx prisma db push"
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao buscar plano de assinatura" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("canManageSubscriptions")
    if (!session) {
      return unauthorizedResponse()
    }

    // Verificar se o modelo existe no Prisma Client
    if (!prisma.subscriptionPlan) {
      return NextResponse.json(
        { 
          error: "Prisma Client precisa ser regenerado",
          details: "Execute: npx prisma generate && npx prisma db push"
        },
        { status: 500 }
      )
    }

    const { name, price, price6Months, price12Months, courseIds } = await req.json()

    if (!name || price === undefined || price === null || price === "" || price6Months === undefined || price6Months === null || price6Months === "" || price12Months === undefined || price12Months === null || price12Months === "") {
      return NextResponse.json(
        { error: "Nome e preços de 1, 6 e 12 meses são obrigatórios" },
        { status: 400 }
      )
    }

    // Criar novo plano
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        price: parseFloat(price),
        price6Months: parseFloat(price6Months),
        price12Months: parseFloat(price12Months),
        isActive: true,
        courses: courseIds && Array.isArray(courseIds) && courseIds.length > 0
          ? {
              create: courseIds.map((courseId: string) => ({
                courseId,
              })),
            }
          : undefined,
      },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(plan)
  } catch (error: any) {
    console.error("Error creating subscription plan:", error)
    
    if (error.message?.includes("subscriptionPlan") || error.message?.includes("Cannot read properties")) {
      return NextResponse.json(
        { 
          error: "Prisma Client precisa ser regenerado",
          details: "Execute: npx prisma generate && npx prisma db push"
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao criar plano de assinatura", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requirePermission("canManageSubscriptions")
    if (!session) {
      return unauthorizedResponse()
    }

    // Verificar se o modelo existe no Prisma Client
    if (!prisma.subscriptionPlan) {
      return NextResponse.json(
        { 
          error: "Prisma Client precisa ser regenerado",
          details: "Execute: npx prisma generate && npx prisma db push"
        },
        { status: 500 }
      )
    }

    const { id, name, price, price6Months, price12Months, isActive, courseIds } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: "ID do plano é obrigatório" },
        { status: 400 }
      )
    }

    // Permitir múltiplos planos ativos - não desativar outros

    // Remover cursos existentes
    await prisma.subscriptionPlanCourse.deleteMany({
      where: { subscriptionPlanId: id },
    })

    // Criar novos cursos se fornecidos
    const courseData = courseIds && Array.isArray(courseIds) && courseIds.length > 0
      ? {
          create: courseIds.map((courseId: string) => ({
            courseId,
          })),
        }
      : undefined

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name,
        price: price ? parseFloat(price) : undefined,
        price6Months: price6Months ? parseFloat(price6Months) : undefined,
        price12Months: price12Months ? parseFloat(price12Months) : undefined,
        isActive,
        courses: courseData,
      },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(plan)
  } catch (error: any) {
    console.error("Error updating subscription plan:", error)
    
    if (error.message?.includes("subscriptionPlan") || error.message?.includes("Cannot read properties")) {
      return NextResponse.json(
        { 
          error: "Prisma Client precisa ser regenerado",
          details: "Execute: npx prisma generate && npx prisma db push"
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao atualizar plano de assinatura", details: error.message },
      { status: 500 }
    )
  }
}

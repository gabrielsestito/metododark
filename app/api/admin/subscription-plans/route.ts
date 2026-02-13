import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requirePermission("canManageSubscriptions")
    if (!session) {
      return unauthorizedResponse()
    }

    const plans = await prisma.subscriptionPlan.findMany({
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
    console.error("Error fetching subscription plans:", error)
    return NextResponse.json(
      { error: "Erro ao buscar planos de assinatura" },
      { status: 500 }
    )
  }
}

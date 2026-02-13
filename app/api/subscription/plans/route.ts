import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Buscar todos os planos ativos
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
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
    console.error("[API /api/subscription/plans] Erro ao buscar planos:", error)
    console.error("[API /api/subscription/plans] Stack:", error?.stack)
    return NextResponse.json(
      { 
        error: "Erro ao buscar planos de assinatura",
        message: error?.message || "Erro desconhecido",
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

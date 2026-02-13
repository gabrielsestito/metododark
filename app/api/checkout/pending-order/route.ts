import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Buscar pedido pendente mais recente
    const pendingOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "pending",
      },
      include: {
        items: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                subtitle: true,
                thumbnailUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!pendingOrder) {
      return NextResponse.json(
        { error: "Nenhum pedido pendente encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ order: pendingOrder })
  } catch (error: any) {
    console.error("Error fetching pending order:", error)
    return NextResponse.json(
      { error: "Erro ao buscar pedido pendente" },
      { status: 500 }
    )
  }
}

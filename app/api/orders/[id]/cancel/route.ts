import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o pedido pertence ao usuário
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Só pode cancelar pedidos pendentes
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Não é possível cancelar um pedido com status "${order.status}". Apenas pedidos pendentes podem ser cancelados.` },
        { status: 400 }
      )
    }

    // Atualizar status do pedido para "failed" (cancelado)
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: "failed",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Pedido cancelado com sucesso",
      order: updatedOrder,
    })
  } catch (error: any) {
    console.error("Error canceling order:", error)
    return NextResponse.json(
      { error: "Erro ao cancelar pedido" },
      { status: 500 }
    )
  }
}

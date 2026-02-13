import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

// GET - Buscar pedido específico
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const permissions = getPermissions(session.user.role)
    if (!permissions.canViewOrders) {
      return NextResponse.json(
        { error: "Sem permissão para visualizar pedidos" },
        { status: 403 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
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

    return NextResponse.json(order)
  } catch (error: any) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Erro ao buscar pedido" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar status do pedido
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const permissions = getPermissions(session.user.role)
    if (!permissions.canViewOrders) {
      return NextResponse.json(
        { error: "Sem permissão para gerenciar pedidos" },
        { status: 403 }
      )
    }

    const { status } = await req.json()

    if (!status || !["pending", "completed", "failed"].includes(status)) {
      return NextResponse.json(
        { error: "Status inválido. Use: pending, completed ou failed" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    // Se mudando para completed, criar enrollments
    if (status === "completed" && order.status !== "completed") {
      const orderWithItems = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
          items: {
            include: {
              course: true,
            },
          },
        },
      })

      if (orderWithItems) {
        // Criar enrollments para cada curso
        for (const item of orderWithItems.items) {
          // Verificar se já existe enrollment
          const existingEnrollment = await prisma.enrollment.findFirst({
            where: {
              userId: order.userId,
              courseId: item.courseId,
            },
          })

          if (!existingEnrollment) {
            await prisma.enrollment.create({
              data: {
                userId: order.userId,
                courseId: item.courseId,
              },
            })
          }
        }
      }
    }

    // Se mudando de completed para outro status, remover enrollments
    if (order.status === "completed" && status !== "completed") {
      const orderWithItems = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
          items: true,
        },
      })

      if (orderWithItems) {
        for (const item of orderWithItems.items) {
          await prisma.enrollment.deleteMany({
            where: {
              userId: order.userId,
              courseId: item.courseId,
            },
          })
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
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

    return NextResponse.json({
      success: true,
      message: "Status do pedido atualizado com sucesso",
      order: updatedOrder,
    })
  } catch (error: any) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar pedido", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Deletar pedido
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const permissions = getPermissions(session.user.role)
    if (!permissions.canViewOrders) {
      return NextResponse.json(
        { error: "Sem permissão para deletar pedidos" },
        { status: 403 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    // Se o pedido está completed, remover enrollments antes de deletar
    if (order.status === "completed") {
      for (const item of order.items) {
        await prisma.enrollment.deleteMany({
          where: {
            userId: order.userId,
            courseId: item.courseId,
          },
        })
      }
    }

    // Deletar items primeiro (foreign key constraint)
    await prisma.orderItem.deleteMany({
      where: { orderId: params.id },
    })

    // Deletar o pedido
    await prisma.order.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: "Pedido deletado com sucesso",
    })
  } catch (error: any) {
    console.error("Error deleting order:", error)
    return NextResponse.json(
      { error: "Erro ao deletar pedido", details: error.message },
      { status: 500 }
    )
  }
}

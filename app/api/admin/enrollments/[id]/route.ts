import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

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
    if (!permissions.canManageUsers) {
      return NextResponse.json(
        { error: "Sem permissão para gerenciar matrículas" },
        { status: 403 }
      )
    }

    const { expiresAt } = await req.json()

    const enrollment = await prisma.enrollment.update({
      where: { id: params.id },
      data: {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(enrollment)
  } catch (error: any) {
    console.error("Error updating enrollment:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar enrollment" },
      { status: 500 }
    )
  }
}

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
    if (!permissions.canManageUsers) {
      return NextResponse.json(
        { error: "Sem permissão para gerenciar matrículas" },
        { status: 403 }
      )
    }

    await prisma.enrollment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting enrollment:", error)
    return NextResponse.json(
      { error: "Erro ao deletar enrollment" },
      { status: 500 }
    )
  }
}


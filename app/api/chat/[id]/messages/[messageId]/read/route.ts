import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/permissions"

// Marcar mensagem como lida/não lida
export async function PUT(
  req: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { read } = await req.json()

    const message = await prisma.chatMessage.findUnique({
      where: { id: params.messageId },
      include: {
        chat: true,
      },
    })

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem permissão (admin/CEO/assistente ou dono do chat)
    const canAccess = isAdminRole(session.user.role) || message.chat.userId === session.user.id
    if (!canAccess) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: params.messageId },
      data: { read: read === true },
    })

    return NextResponse.json(updatedMessage)
  } catch (error: any) {
    console.error("Error updating message read status:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar status da mensagem" },
      { status: 500 }
    )
  }
}


import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

// Deletar mensagem (apenas admin)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Buscar a mensagem
    const message = await prisma.courseGroupChatMessage.findUnique({
      where: { id: params.messageId },
      include: {
        chat: {
          include: {
            course: true,
          },
        },
        sender: true,
      },
    })

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se a mensagem pertence ao curso correto
    if (message.chat.courseId !== params.id) {
      return NextResponse.json(
        { error: "Mensagem não pertence a este curso" },
        { status: 400 }
      )
    }

    // Marcar mensagem como deletada
    await prisma.courseGroupChatMessage.update({
      where: { id: params.messageId },
      data: {
        isDeleted: true,
        deletedBy: session.user.id,
        deletedAt: new Date(),
        content: "Esta mensagem foi deletada por um administrador.",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting message:", error)
    return NextResponse.json(
      { error: "Erro ao deletar mensagem" },
      { status: 500 }
    )
  }
}

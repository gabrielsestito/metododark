import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

// Limpar todas as mensagens do chat (apenas admin)
export async function POST(
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

    const groupChat = await prisma.courseGroupChat.findUnique({
      where: { courseId: params.id },
      include: {
        course: true,
      },
    })

    if (!groupChat) {
      return NextResponse.json(
        { error: "Chat do curso não encontrado" },
        { status: 404 }
      )
    }

    // Deletar todas as mensagens
    await prisma.courseGroupChatMessage.deleteMany({
      where: {
        chatId: groupChat.id,
      },
    })

    // Criar mensagem do sistema informando que o chat foi limpo
    await prisma.courseGroupChatMessage.create({
      data: {
        chatId: groupChat.id,
        senderId: session.user.id,
        content: "O chat foi limpo por um administrador.",
        isDeleted: false,
      },
    })

    return NextResponse.json({ success: true, message: "Chat limpo com sucesso" })
  } catch (error: any) {
    console.error("Error clearing chat:", error)
    return NextResponse.json(
      { error: "Erro ao limpar chat" },
      { status: 500 }
    )
  }
}

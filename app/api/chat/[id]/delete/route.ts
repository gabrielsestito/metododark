import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// Deletar chat (apenas CEO) - Rota alternativa usando POST
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Apenas CEO pode deletar chats
    if (session.user.role !== "CEO") {
      return NextResponse.json(
        { error: "Apenas CEO pode deletar chats" },
        { status: 403 }
      )
    }

    const chat = await prisma.chat.findUnique({
      where: { id: params.id },
    })

    if (!chat) {
      return NextResponse.json(
        { error: "Chat não encontrado" },
        { status: 404 }
      )
    }

    // Deletar todas as mensagens do chat primeiro (devido à constraint de foreign key)
    await prisma.chatMessage.deleteMany({
      where: { chatId: params.id },
    })

    // Deletar o chat
    await prisma.chat.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ 
      success: true,
      message: "Chat deletado com sucesso" 
    })
  } catch (error: any) {
    console.error("Error deleting chat:", error)
    return NextResponse.json(
      { error: "Erro ao deletar chat" },
      { status: 500 }
    )
  }
}

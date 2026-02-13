import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

// Desbanir usuário
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } }
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

    // Remover banimento
    await prisma.courseGroupChatBan.delete({
      where: {
        chatId_userId: {
          chatId: groupChat.id,
          userId: params.userId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error unbanning user:", error)
    return NextResponse.json(
      { error: "Erro ao remover banimento" },
      { status: 500 }
    )
  }
}

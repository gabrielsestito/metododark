import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 })
    }

    // Para usuários: contar mensagens do staff não lidas
    if (!isAdminRole(session.user.role)) {
      const chats = await prisma.chat.findMany({
        where: {
          userId: session.user.id,
          status: {
            not: "closed",
          },
        },
        include: {
          messages: {
            where: {
              read: false,
              senderId: null, // Mensagens do staff
            },
          },
        },
      })

      const unreadCount = chats.reduce((total, chat) => total + chat.messages.length, 0)
      return NextResponse.json({ count: unreadCount })
    }

    // Para admin/CEO/assistente: contar mensagens de usuários não lidas em todos os chats
    const chats = await prisma.chat.findMany({
      where: {
        status: {
          not: "closed",
        },
      },
      include: {
        messages: {
          where: {
            read: false,
            senderId: {
              not: null, // Mensagens dos usuários
            },
          },
        },
      },
    })

    const unreadCount = chats.reduce((total, chat) => total + chat.messages.length, 0)
    return NextResponse.json({ count: unreadCount })
  } catch (error: any) {
    console.error("[API /api/chat/unread-count] Erro ao buscar contador:", error)
    console.error("[API /api/chat/unread-count] Stack:", error?.stack)
    return NextResponse.json({ count: 0 })
  }
}


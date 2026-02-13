import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"

export const dynamic = 'force-dynamic'

// Listar todos os chats (admin)
export async function GET(req: Request) {
  try {
    const session = await requirePermission("canManageChats")
    if (!session) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    const where: any = {}

    if (status && status !== "all") {
      where.status = status
    }

    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
            },
          },
        },
        {
          description: {
            contains: search,
          },
        },
      ]
    }

    const chats = await prisma.chat.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    // Adicionar contagem de mensagens não lidas
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await prisma.chatMessage.count({
          where: {
            chatId: chat.id,
            read: false,
            senderId: {
              not: null, // Mensagens do usuário (não do admin)
            },
          },
        })

        return {
          ...chat,
          unreadCount,
        }
      })
    )

    return NextResponse.json(chatsWithUnread)
  } catch (error: any) {
    console.error("Error fetching chats:", error)
    return NextResponse.json(
      { error: "Erro ao buscar chats" },
      { status: 500 }
    )
  }
}

// Criar chat como admin para um usuário específico
export async function POST(req: Request) {
  try {
    const session = await requirePermission("canManageChats")
    if (!session) {
      return unauthorizedResponse()
    }

    const { userId, subject, description } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se já existe um chat aberto com este usuário
    const existingChat = await prisma.chat.findFirst({
      where: {
        userId: userId,
        status: { in: ["open", "in_progress"] },
      },
      orderBy: { createdAt: "desc" },
    })

    if (existingChat) {
      return NextResponse.json(existingChat)
    }

    // Criar novo chat
    const chat = await prisma.chat.create({
      data: {
        userId: userId,
        subject: subject || "OUTRO",
        description: description || `Chat iniciado por ${session.user.name || session.user.email}`,
        status: "open",
        assignedTo: session.user.id, // Atribuir automaticamente ao admin que criou
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // Criar mensagem inicial do admin
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        senderId: null, // Mensagem do sistema/admin
        content: `Olá ${user.name || user.email}! Como posso ajudá-lo hoje?`,
        isSystem: true,
        read: false,
      },
    })

    return NextResponse.json(chat)
  } catch (error: any) {
    console.error("Error creating chat:", error)
    return NextResponse.json(
      { error: "Erro ao criar chat", details: error.message },
      { status: 500 }
    )
  }
}

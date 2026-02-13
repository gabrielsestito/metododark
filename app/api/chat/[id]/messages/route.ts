import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/permissions"

// Enviar mensagem
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

    const { content, attachmentUrl, attachmentName } = await req.json()

    if ((!content || content.trim().length === 0) && !attachmentUrl) {
      return NextResponse.json(
        { error: "Mensagem não pode estar vazia" },
        { status: 400 }
      )
    }

    // Verificar se o chat pertence ao usuário ou se é admin
    const chat = await prisma.chat.findUnique({
      where: { id: params.id },
    })

    if (!chat) {
      return NextResponse.json(
        { error: "Chat não encontrado" },
        { status: 404 }
      )
    }

    // Verificar permissões: admin/CEO/assistente pode ver qualquer chat, usuário só o próprio
    const canAccess = isAdminRole(session.user.role) || chat.userId === session.user.id
    if (!canAccess) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Se for admin/CEO/assistente respondendo a um chat que não é dele, senderId é null, senão é o userId
    const isRespondingAsStaff = isAdminRole(session.user.role) && chat.userId !== session.user.id
    const senderId = isRespondingAsStaff ? null : session.user.id!

    const message = await prisma.chatMessage.create({
      data: {
        chatId: params.id,
        senderId,
        content: content?.trim() || "",
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        read: false, // Mensagens começam como não lidas
      },
    })
    
    // Se for admin respondendo, não marcar como lida automaticamente
    // A marcação será feita quando o usuário visualizar

    // Atualizar updatedAt do chat
    await prisma.chat.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    )
  }
}

// Buscar mensagens do chat
export async function GET(
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

    const chat = await prisma.chat.findUnique({
      where: { id: params.id },
    })

    if (!chat) {
      return NextResponse.json(
        { error: "Chat não encontrado" },
        { status: 404 }
      )
    }

    // Verificar permissões: admin/CEO/assistente pode ver qualquer chat, usuário só o próprio
    const canAccess = isAdminRole(session.user.role) || chat.userId === session.user.id
    if (!canAccess) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId: params.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Marcar mensagens como lidas automaticamente
    if (chat.userId === session.user.id) {
      // Se for o usuário do chat, marcar mensagens do staff como lidas
      await prisma.chatMessage.updateMany({
        where: {
          chatId: params.id,
          read: false,
          senderId: null, // Mensagens do admin/CEO/assistente
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      })
    } else if (isAdminRole(session.user.role)) {
      // Se for admin/CEO/assistente, marcar mensagens do usuário como lidas
      await prisma.chatMessage.updateMany({
        where: {
          chatId: params.id,
          read: false,
          senderId: {
            not: null, // Mensagens do usuário
          },
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      })
    }

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Erro ao buscar mensagens" },
      { status: 500 }
    )
  }
}


import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/permissions"

// Buscar chat específico
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
      include: {
        user: {
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

    return NextResponse.json(chat)
  } catch (error: any) {
    console.error("Error fetching chat:", error)
    return NextResponse.json(
      { error: "Erro ao buscar chat" },
      { status: 500 }
    )
  }
}

// Fechar chat
export async function PUT(
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

    const { status } = await req.json()

    const chat = await prisma.chat.findUnique({
      where: { id: params.id },
    })

    if (!chat) {
      return NextResponse.json(
        { error: "Chat não encontrado" },
        { status: 404 }
      )
    }

    // Apenas admin/CEO/assistente pode fechar qualquer chat, usuário só pode fechar o próprio
    const canModify = isAdminRole(session.user.role) || chat.userId === session.user.id
    if (!canModify) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Verificar se está sendo fechado por um staff e se não estava já fechado
    const isStaffClosing = isAdminRole(session.user.role) && chat.userId !== session.user.id
    const isBeingClosed = status === "closed" && chat.status !== "closed"

    const updatedChat = await prisma.chat.update({
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

    // Se foi um staff que fechou o chat, criar mensagem automática
    if (isStaffClosing && isBeingClosed) {
      try {
        await prisma.chatMessage.create({
          data: {
            chatId: params.id,
            senderId: null, // Mensagem do sistema/staff
            content: "✅ Atendimento finalizado. Obrigado por entrar em contato conosco! Se precisar de mais ajuda, fique à vontade para abrir um novo ticket.",
            isSystem: true, // Mensagem automática do sistema
            read: false,
          },
        })
      } catch (error) {
        console.error("Error creating closing message:", error)
        // Não falhar o fechamento do chat se a mensagem falhar
      }
    }

    return NextResponse.json(updatedChat)
  } catch (error: any) {
    console.error("Error updating chat:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar chat" },
      { status: 500 }
    )
  }
}

// Deletar chat (apenas CEO)
export async function DELETE(
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
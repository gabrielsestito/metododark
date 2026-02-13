import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Assumir ticket (admin, CEO, assistente)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    const allowedRoles = ["ADMIN", "CEO", "ASSISTANT"]
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Não autorizado" },
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

    // Verificar se já estava atribuído antes
    const wasAlreadyAssigned = chat.assignedTo !== null

    // Atualizar chat para "in_progress" e atribuir ao usuário autorizado
    const updatedChat = await prisma.chat.update({
      where: { id: params.id },
      data: {
        assignedTo: session.user.id,
        status: "in_progress",
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

    // Criar mensagem automática informando que o ticket foi assumido
    try {
      const staffName = session.user.name || "um atendente"
      const message = wasAlreadyAssigned 
        ? `🔄 Seu ticket foi reassumido por ${staffName}. Em breve você receberá uma resposta!`
        : `👤 Seu ticket foi assumido por ${staffName}. Em breve você receberá uma resposta!`
      
      await prisma.chatMessage.create({
        data: {
          chatId: params.id,
          senderId: null, // Mensagem do sistema/staff
          content: message,
          isSystem: true, // Mensagem automática do sistema
          read: false,
        },
      })
    } catch (error) {
      console.error("Error creating assignment message:", error)
      // Não falhar a atribuição se a mensagem falhar
    }

    return NextResponse.json(updatedChat)
  } catch (error: any) {
    console.error("Error assigning chat:", error)
    return NextResponse.json(
      { error: "Erro ao assumir ticket" },
      { status: 500 }
    )
  }
}

// Remover atribuição (admin, CEO, assistente)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    const allowedRoles = ["ADMIN", "CEO", "ASSISTANT"]
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Não autorizado" },
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

    // Remover atribuição e voltar para "open"
    const updatedChat = await prisma.chat.update({
      where: { id: params.id },
      data: {
        assignedTo: null,
        status: "open",
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

    return NextResponse.json(updatedChat)
  } catch (error: any) {
    console.error("Error unassigning chat:", error)
    return NextResponse.json(
      { error: "Erro ao remover atribuição" },
      { status: 500 }
    )
  }
}


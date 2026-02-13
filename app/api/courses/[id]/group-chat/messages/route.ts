import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { containsProfanity } from "@/lib/profanity-filter"

export const dynamic = 'force-dynamic'

// Listar mensagens do chat do curso
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se o curso existe
    const course = await prisma.course.findUnique({
      where: { id: params.id },
    })

    if (!course) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o usuário está matriculado (ou é admin)
    const isAdmin = ["ADMIN", "CEO", "ASSISTANT"].includes(session.user.role)
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: params.id,
      },
    })

    if (!isAdmin && !enrollment) {
      return NextResponse.json(
        { error: "Você precisa estar matriculado no curso para acessar o chat" },
        { status: 403 }
      )
    }

    // Verificar se o usuário está banido
    const groupChat = await prisma.courseGroupChat.findUnique({
      where: { courseId: params.id },
      include: {
        bans: {
          select: {
            id: true,
            userId: true,
            type: true,
            reason: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    })

    if (!groupChat) {
      // Criar chat do grupo se não existir
      const newChat = await prisma.courseGroupChat.create({
        data: {
          courseId: params.id,
        },
      })
      return NextResponse.json({ messages: [], chatId: newChat.id })
    }

    // Verificar se está banido ou suspenso (verificar se suspensão expirou)
    const now = new Date()
    const activeBan = groupChat.bans.find(ban => 
      ban.userId === session.user.id && 
      (ban.type === "ban" || (ban.type === "suspension" && ban.expiresAt && ban.expiresAt > now))
    )
    
    if (activeBan && !isAdmin) {
      const isSuspended = activeBan.type === "suspension"
      if (isSuspended && activeBan.expiresAt) {
        const expiresAtDate = new Date(activeBan.expiresAt)
        const daysRemaining = Math.ceil((expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        // Calcular dias totais da suspensão (diferença entre criação e expiração)
        const createdAtDate = new Date(activeBan.createdAt)
        const totalDays = Math.ceil((expiresAtDate.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return NextResponse.json(
          { 
            error: `Você está suspenso deste chat por ${totalDays} dia(s)`, 
            banned: true,
            suspended: true,
            suspensionInfo: {
              days: totalDays,
              expiresAt: expiresAtDate.toISOString(),
              reason: activeBan.reason || null
            }
          },
          { status: 403 }
        )
      } else {
        return NextResponse.json(
          { error: "Você está banido deste chat", banned: true, suspended: false },
          { status: 403 }
        )
      }
    }

    // Buscar mensagens (não deletadas)
    // Se o usuário está banido/suspenso e não é admin, não mostrar mensagens
    const messages = activeBan && !isAdmin ? [] : await prisma.courseGroupChatMessage.findMany({
      where: {
        chatId: groupChat.id,
        isDeleted: false,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        attachmentUrl: true,
        attachmentName: true,
        createdAt: true,
        isDeleted: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 100, // Limitar a 100 mensagens mais recentes
    })

    return NextResponse.json({
      messages,
      chatId: groupChat.id,
      banned: false,
    })
  } catch (error: any) {
    console.error("Error fetching group chat messages:", error)
    return NextResponse.json(
      { error: "Erro ao buscar mensagens" },
      { status: 500 }
    )
  }
}

// Enviar mensagem no chat do curso
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { content, attachmentUrl, attachmentName } = await req.json()

    if ((!content || !content.trim()) && !attachmentUrl) {
      return NextResponse.json(
        { error: "Mensagem não pode estar vazia" },
        { status: 400 }
      )
    }

    // Verificar palavras proibidas
    if (containsProfanity(content)) {
      return NextResponse.json(
        { 
          error: "Você não pode enviar mensagens com palavras inadequadas. Por favor, seja respeitoso e remova qualquer conteúdo ofensivo antes de enviar.",
          profanity: true
        },
        { status: 400 }
      )
    }

    // Verificar se o curso existe
    const course = await prisma.course.findUnique({
      where: { id: params.id },
    })

    if (!course) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o usuário está matriculado (ou é admin)
    const isAdmin = ["ADMIN", "CEO", "ASSISTANT"].includes(session.user.role)
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: params.id,
      },
    })

    if (!isAdmin && !enrollment) {
      return NextResponse.json(
        { error: "Você precisa estar matriculado no curso para participar do chat" },
        { status: 403 }
      )
    }

    // Verificar se está banido
    let groupChat = await prisma.courseGroupChat.findUnique({
      where: { courseId: params.id },
      include: {
        bans: true,
      },
    })

    if (!groupChat) {
      groupChat = await prisma.courseGroupChat.create({
        data: {
          courseId: params.id,
        },
        include: {
          bans: true,
        },
      })
    }

    // Verificar se está banido ou suspenso (verificar se suspensão expirou)
    const now = new Date()
    const activeBan = groupChat.bans.find(ban => 
      ban.userId === session.user.id && 
      (ban.type === "ban" || (ban.type === "suspension" && ban.expiresAt && ban.expiresAt > now))
    )
    
    if (activeBan && !isAdmin) {
      const isSuspended = activeBan.type === "suspension"
      const message = isSuspended && activeBan.expiresAt
        ? `Você está suspenso deste chat até ${new Date(activeBan.expiresAt).toLocaleString("pt-BR")}`
        : "Você está banido deste chat e não pode enviar mensagens"
      return NextResponse.json(
        { error: message },
        { status: 403 }
      )
    }

    // Criar mensagem
    const message = await prisma.courseGroupChatMessage.create({
      data: {
        chatId: groupChat.id,
        senderId: session.user.id,
        content: content?.trim() || (attachmentUrl ? `Arquivo: ${attachmentName || "anexo"}` : ""),
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        attachmentUrl: true,
        attachmentName: true,
        createdAt: true,
        isDeleted: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(message)
  } catch (error: any) {
    console.error("Error sending group chat message:", error)
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    )
  }
}

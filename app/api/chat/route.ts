import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Criar novo chat
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    if (!userId) {
      console.error("User ID is missing from session:", session)
      return NextResponse.json(
        { error: "ID do usuário não encontrado na sessão" },
        { status: 401 }
      )
    }

    // Verificar se o usuário existe no banco
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error("User not found in database:", userId)
      return NextResponse.json(
        { error: "Usuário não encontrado no banco de dados" },
        { status: 404 }
      )
    }

    const { subject, description, courseId, lessonId } = await req.json()

    if (!subject) {
      return NextResponse.json(
        { error: "Assunto é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar informações do curso e aula se houver
    let courseInfo = null
    let lessonInfo = null
    
    if (courseId) {
      courseInfo = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true },
      })
    }
    
    if (lessonId) {
      lessonInfo = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, title: true },
      })
    }

    const chat = await prisma.chat.create({
      data: {
        userId: userId,
        subject,
        description,
        status: "open",
        courseId: courseId || null,
        lessonId: lessonId || null,
      },
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

    // Criar mensagem inicial com informações do curso/aula se houver
    let initialMessage = ""
    
    if (lessonInfo && courseInfo) {
      initialMessage = `📚 Dúvida sobre a aula:\n\n` +
        `🎓 Curso: ${courseInfo.title}\n` +
        `📖 Aula: ${lessonInfo.title}\n\n`
    } else if (courseInfo) {
      initialMessage = `📚 Dúvida sobre o curso:\n\n` +
        `🎓 Curso: ${courseInfo.title}\n\n`
    }
    
    // Adicionar descrição do usuário se houver
    if (description && description.trim()) {
      initialMessage += description.trim()
    } else if (lessonInfo && courseInfo) {
      initialMessage += "Tenho uma dúvida sobre esta aula."
    }

    // Criar mensagem inicial
    if (initialMessage.trim()) {
      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          senderId: userId,
          content: initialMessage.trim(),
          read: false,
        },
      })
    }

    return NextResponse.json(chat, { status: 201 })
  } catch (error: any) {
    console.error("Error creating chat:", error)
    console.error("Error details:", {
      code: error.code,
      meta: error.meta,
      message: error.message,
    })
    
    // Se for erro de chave estrangeira, dar mensagem mais específica
    if (error.code === "P2003") {
      return NextResponse.json(
        { 
          error: "Erro ao criar chat: usuário não encontrado ou inválido",
          details: error.meta?.field_name 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Erro ao criar chat", details: error.message },
      { status: 500 }
    )
  }
}

// Listar chats do usuário
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
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
            createdAt: "asc",
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

    return NextResponse.json(chats)
  } catch (error: any) {
    console.error("Error fetching chats:", error)
    return NextResponse.json(
      { error: "Erro ao buscar chats" },
      { status: 500 }
    )
  }
}


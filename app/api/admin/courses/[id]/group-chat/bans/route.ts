import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

// Listar usuários banidos
export async function GET(
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
        bans: {
          select: {
            id: true,
            userId: true,
            type: true,
            reason: true,
            expiresAt: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!groupChat) {
      return NextResponse.json({ bans: [] })
    }

    return NextResponse.json({ bans: groupChat.bans })
  } catch (error: any) {
    console.error("Error fetching bans:", error)
    return NextResponse.json(
      { error: "Erro ao buscar banimentos" },
      { status: 500 }
    )
  }
}

// Banir usuário
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

    const { userId, reason, type, days } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Validar tipo
    const punishmentType = type === "suspension" ? "suspension" : "ban"
    
    // Calcular data de expiração se for suspensão
    let expiresAt: Date | null = null
    if (punishmentType === "suspension" && days && days > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + parseInt(days))
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

    // Garantir que o chat existe
    let groupChat = await prisma.courseGroupChat.findUnique({
      where: { courseId: params.id },
    })

    if (!groupChat) {
      groupChat = await prisma.courseGroupChat.create({
        data: {
          courseId: params.id,
        },
      })
    }

    // Verificar se já está banido
    const existingBan = await prisma.courseGroupChatBan.findUnique({
      where: {
        chatId_userId: {
          chatId: groupChat.id,
          userId: userId,
        },
      },
    })

    if (existingBan) {
      return NextResponse.json(
        { error: "Usuário já está banido" },
        { status: 400 }
      )
    }

    // Criar banimento ou suspensão
    const ban = await prisma.courseGroupChatBan.create({
      data: {
        chatId: groupChat.id,
        userId: userId,
        bannedBy: session.user.id,
        reason: reason || null,
        type: punishmentType,
        expiresAt: expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(ban)
  } catch (error: any) {
    console.error("Error banning user:", error)
    return NextResponse.json(
      { error: "Erro ao banir usuário" },
      { status: 500 }
    )
  }
}

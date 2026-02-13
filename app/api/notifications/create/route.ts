import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAllowedNotificationType } from "@/lib/notification-types"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { title, message, type, courseId } = await req.json()

    // Validação
    if (!title || !message) {
      return NextResponse.json(
        { error: "Título e mensagem são obrigatórios" },
        { status: 400 }
      )
    }

    if (!isAllowedNotificationType(type)) {
      return NextResponse.json(
        { error: "Tipo de notificação não permitido" },
        { status: 400 }
      )
    }

    // Criar notificação para o próprio usuário
    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        courseId: courseId || null,
        title,
        message,
        type,
      },
    })

    return NextResponse.json({ 
      success: true, 
      notification 
    })
  } catch (error: any) {
    console.error("Error creating notification:", error)
    return NextResponse.json(
      { error: "Erro ao criar notificação", details: error.message },
      { status: 500 }
    )
  }
}

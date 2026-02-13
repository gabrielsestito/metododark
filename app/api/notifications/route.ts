import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ALLOWED_NOTIFICATION_TYPES } from "@/lib/notification-types"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const allowedTypes = [...ALLOWED_NOTIFICATION_TYPES]
    const notifications = await prisma.notification.findMany({
      where: {
        type: { in: allowedTypes },
        OR: [
          { userId: session.user.id },
          { userId: null }, // Notificações globais
        ],
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        read: true,
        createdAt: true,
        course: {
          select: {
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json(
      notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        courseId: n.course?.slug || null,
        courseSlug: n.course?.slug || null,
        createdAt: n.createdAt,
      }))
    )
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Erro ao buscar notificações" },
      { status: 500 }
    )
  }
}

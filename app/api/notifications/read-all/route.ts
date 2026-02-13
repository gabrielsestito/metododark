import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    await prisma.notification.updateMany({
      where: {
        read: false,
        OR: [
          { userId: session.user.id },
          { userId: null },
        ],
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking all as read:", error)
    return NextResponse.json(
      { error: "Erro ao marcar notificações" },
      { status: 500 }
    )
  }
}


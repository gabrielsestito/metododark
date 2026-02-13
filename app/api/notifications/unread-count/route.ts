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
      return NextResponse.json({ count: 0 })
    }

    const allowedTypes = [...ALLOWED_NOTIFICATION_TYPES]
    const count = await prisma.notification.count({
      where: {
        read: false,
        type: { in: allowedTypes },
        OR: [
          { userId: session.user.id },
          { userId: null }, // Notificações globais
        ],
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return NextResponse.json({ count: 0 })
  }
}

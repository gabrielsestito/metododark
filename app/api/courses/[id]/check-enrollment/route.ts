import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ enrolled: false })
    }

    // Verificar assinatura ativa (se o modelo existir)
    let hasActiveSubscription = false
    try {
      if (prisma.subscription) {
        const subscription = await prisma.subscription.findUnique({
          where: { userId: session.user.id },
        })

        hasActiveSubscription = !!(subscription?.status === "active" && 
          subscription.currentPeriodEnd && 
          new Date(subscription.currentPeriodEnd) > new Date())
      }
    } catch (error) {
      // Se o modelo não existir, ignorar e continuar com verificação de enrollment
      console.warn("Subscription model not available:", error)
    }

    // Se tem assinatura ativa, tem acesso a todos os cursos
    if (hasActiveSubscription) {
      return NextResponse.json({ enrolled: true, viaSubscription: true })
    }

    // Verificar enrollment específico
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: params.id,
        },
      },
    })

    return NextResponse.json({ enrolled: !!enrollment, viaSubscription: false })
  } catch (error) {
    console.error("Error checking enrollment:", error)
    return NextResponse.json({ enrolled: false }, { status: 500 })
  }
}


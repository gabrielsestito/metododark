import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Stripe from "stripe"

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar sessão do Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    // Verificar se a sessão pertence ao usuário
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      status: checkoutSession.payment_status,
      sessionId: checkoutSession.id,
      paid: checkoutSession.payment_status === "paid",
      pending: checkoutSession.payment_status === "unpaid",
    })
  } catch (error: any) {
    console.error("Error checking session status:", error)
    return NextResponse.json(
      { error: "Erro ao verificar status do pagamento" },
      { status: 500 }
    )
  }
}

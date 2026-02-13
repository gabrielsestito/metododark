import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Preference } from "mercadopago"
import { MercadoPagoConfig } from "mercadopago"
import { randomUUID } from "crypto"

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

function createClient() {
  if (!accessToken) return null
  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 5000,
      idempotencyKey: randomUUID(),
    },
  })
}

export async function POST(req: Request) {
  try {
    const client = createClient()
    if (!client) {
      return NextResponse.json(
        { error: "Mercado Pago não está configurado." },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "ID do pedido é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o pedido pertence ao usuário
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Verificar se o pedido está pendente
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Este pedido não está pendente" },
        { status: 400 }
      )
    }

    // Se já tem paymentId (preference_id), tentar buscar a preference
    // Mas vamos sempre criar uma nova para garantir que está válida
    // O Mercado Pago pode invalidar preferences antigas

    // Se não tem paymentId ou a preference não existe, criar uma nova
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const preference = new Preference(client)

    const preferenceData = {
      items: order.items.map((item) => ({
        id: item.courseId,
        title: item.course.title,
        description: item.course.subtitle || item.course.description?.substring(0, 255) || "",
        quantity: 1,
        unit_price: item.price,
        currency_id: "BRL",
        picture_url: item.course.thumbnailUrl || undefined,
      })),
      payer: {
        email: user.email,
        name: user.name,
      },
      back_urls: {
        success: `${baseUrl}/checkout/success?order_id=${order.id}`,
        failure: `${baseUrl}/checkout?error=payment_failed`,
        pending: `${baseUrl}/checkout/success?order_id=${order.id}&status=pending`,
      },
      external_reference: order.id,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      statement_descriptor: "METODODARK",
    }

    const preferenceResponse = await preference.create({ body: preferenceData })

    // Atualizar o pedido com o novo preference_id
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: preferenceResponse.id },
    })

    const checkoutUrl = process.env.NODE_ENV === "production"
      ? preferenceResponse.init_point
      : preferenceResponse.sandbox_init_point || preferenceResponse.init_point

    return NextResponse.json({
      checkoutUrl,
      preferenceId: preferenceResponse.id,
    })
  } catch (error: any) {
    console.error("Error continuing payment:", error)
    return NextResponse.json(
      { error: "Erro ao continuar pagamento", details: error?.message },
      { status: 500 }
    )
  }
}

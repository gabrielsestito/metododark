import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MercadoPagoConfig, Preference } from "mercadopago"
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
        { error: "Mercado Pago não está configurado. Verifique as variáveis de ambiente." },
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

    const { items } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Carrinho vazio" },
        { status: 400 }
      )
    }

    // Verificar se o usuário tem pedidos pendentes
    const pendingOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: "pending",
      },
      include: {
        items: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (pendingOrders.length > 0) {
      const latestPendingOrder = pendingOrders[0]
      return NextResponse.json(
        {
          error: "Você já possui um pedido pendente. Finalize ou cancele o pedido atual antes de criar um novo.",
          pendingOrder: {
            id: latestPendingOrder.id,
            paymentId: latestPendingOrder.paymentId,
            total: latestPendingOrder.total,
            createdAt: latestPendingOrder.createdAt,
          },
        },
        { status: 400 }
      )
    }

    // Verificar se já tem algum curso comprado
    const courseIds = items.map((item: any) => item.id)
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        courseId: { in: courseIds },
      },
    })

    if (existingEnrollments.length > 0) {
      return NextResponse.json(
        { error: "Você já possui alguns desses cursos" },
        { status: 400 }
      )
    }

    // Buscar cursos
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
    })

    if (courses.length === 0) {
      return NextResponse.json(
        { error: "Cursos não encontrados" },
        { status: 404 }
      )
    }

    // Calcular total
    const total = courses.reduce((sum, course) => {
      return sum + (course.promoPrice || course.price)
    }, 0)

    // Validar valores dos cursos
    const MINIMUM_AMOUNT_BRL = 0.50
    
    // Verificar se todos os cursos têm valores válidos
    for (const course of courses) {
      const coursePrice = course.promoPrice || course.price
      if (!coursePrice || coursePrice <= 0 || isNaN(coursePrice)) {
        return NextResponse.json(
          { 
            error: `O curso "${course.title}" possui um preço inválido.`,
          },
          { status: 400 }
        )
      }
      
      // Validar valor mínimo por item (R$ 0.50)
      if (coursePrice < MINIMUM_AMOUNT_BRL) {
        return NextResponse.json(
          { 
            error: `O curso "${course.title}" tem valor menor que o mínimo permitido (R$ ${MINIMUM_AMOUNT_BRL.toFixed(2).replace('.', ',')}). O valor mínimo por item é R$ ${MINIMUM_AMOUNT_BRL.toFixed(2).replace('.', ',')}.`,
          },
          { status: 400 }
        )
      }
    }
    
    // Validar valor mínimo do total (R$ 0.50 BRL)
    if (total < MINIMUM_AMOUNT_BRL) {
      return NextResponse.json(
        { 
          error: `O valor mínimo para pagamento é R$ ${MINIMUM_AMOUNT_BRL.toFixed(2).replace('.', ',')}. O valor total do pedido é R$ ${total.toFixed(2).replace('.', ',')}.`,
        },
        { status: 400 }
      )
    }

    // Buscar dados do usuário
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

    // Criar Order no banco de dados primeiro
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        paymentMethod: "card", // Mercado Pago aceita múltiplos métodos
        total: total,
        status: "pending",
        items: {
          create: courses.map((course) => ({
            courseId: course.id,
            price: course.promoPrice || course.price,
          })),
        },
      },
    })

    // Criar Preference do Mercado Pago
    const preference = new Preference(client)

    const preferenceData = {
      items: courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.subtitle || course.description?.substring(0, 255) || "",
        quantity: 1,
        unit_price: course.promoPrice || course.price,
        currency_id: "BRL",
        picture_url: course.thumbnailUrl || undefined,
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
      external_reference: order.id, // ID do pedido para identificar no webhook
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      statement_descriptor: "METODODARK",
    }

    const preferenceResponse = await preference.create({ body: preferenceData })

    // Atualizar o Order com o preference_id
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: preferenceResponse.id },
    })

    return NextResponse.json({
      preferenceId: preferenceResponse.id,
      initPoint: preferenceResponse.init_point,
      sandboxInitPoint: preferenceResponse.sandbox_init_point,
      orderId: order.id,
    })
  } catch (error: any) {
    console.error("Checkout error:", error)
    
    return NextResponse.json(
      {
        error: "Erro ao processar pagamento",
        details: error?.message || "Ocorreu um erro inesperado ao processar o pagamento.",
      },
      { status: 500 }
    )
  }
}

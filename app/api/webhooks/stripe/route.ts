import { NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { purchaseConfirmationEmail } from "@/lib/email-templates"

const appBaseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Buscar o pedido pelo paymentId (que é o session.id)
        const order = await prisma.order.findUnique({
          where: { paymentId: session.id },
          include: {
            user: true,
            items: {
              include: {
                course: true,
              },
            },
          },
        })

        if (!order) {
          console.error(`[WEBHOOK STRIPE] Order não encontrado para session ${session.id}`)
          return NextResponse.json({ received: true })
        }

        // Verificar se o pagamento foi realmente pago
        if (session.payment_status === "paid") {
          // Atualizar status do pedido
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "completed" },
          })

          // Criar enrollments
          const courseIds = order.items.map(item => item.courseId)
          await Promise.all(
            courseIds.map((courseId) =>
              prisma.enrollment.upsert({
                where: {
                  userId_courseId: {
                    userId: order.userId,
                    courseId,
                  },
                },
                create: {
                  userId: order.userId,
                  courseId,
                },
                update: {},
              })
            )
          )

          if (order.user?.email) {
            const courseTitles = order.items.map((item) => item.course.title)
            const html = purchaseConfirmationEmail({
              name: order.user.name || "Aluno",
              courses: courseTitles,
              total: `R$ ${order.total.toFixed(2)}`,
              ctaUrl: `${appBaseUrl}/app`,
            })
            await sendEmail({
              to: order.user.email,
              subject: "Compra confirmada - Método Dark",
              html,
            })
          }

          console.log(`[WEBHOOK STRIPE] ✅ Pagamento confirmado automaticamente! Order: ${order.id}, Session: ${session.id}`)
        } else if (session.payment_status === "unpaid") {
          // Para PIX e Boleto, o status pode ser "unpaid" até ser confirmado
          // Não fazer nada ainda, aguardar confirmação
          console.log(`[WEBHOOK STRIPE] Pagamento ainda não confirmado para session ${session.id}`)
        }

        break
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session

        const order = await prisma.order.findUnique({
          where: { paymentId: session.id },
          include: {
            user: true,
            items: {
              include: {
                course: true,
              },
            },
          },
        })

        if (!order) {
          console.error(`[WEBHOOK STRIPE] Order não encontrado para session ${session.id}`)
          return NextResponse.json({ received: true })
        }

        // Atualizar status do pedido
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "completed" },
        })

        // Criar enrollments
        const courseIds = order.items.map(item => item.courseId)
        await Promise.all(
          courseIds.map((courseId) =>
            prisma.enrollment.upsert({
              where: {
                userId_courseId: {
                  userId: order.userId,
                  courseId,
                },
              },
              create: {
                userId: order.userId,
                courseId,
              },
              update: {},
            })
          )
        )

        if (order.user?.email) {
          const courseTitles = order.items.map((item) => item.course.title)
          const html = purchaseConfirmationEmail({
            name: order.user.name || "Aluno",
            courses: courseTitles,
            total: `R$ ${order.total.toFixed(2)}`,
            ctaUrl: `${appBaseUrl}/app`,
          })
          await sendEmail({
            to: order.user.email,
            subject: "Compra confirmada - Método Dark",
            html,
          })
        }

        console.log(`[WEBHOOK STRIPE] ✅ Pagamento assíncrono confirmado! Order: ${order.id}, Session: ${session.id}`)
        break
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session

        const order = await prisma.order.findUnique({
          where: { paymentId: session.id },
        })

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "failed" },
          })
          console.log(`[WEBHOOK STRIPE] ❌ Pagamento falhou! Order: ${order.id}, Session: ${session.id}`)
        }
        break
      }

      default:
        console.log(`[WEBHOOK STRIPE] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[WEBHOOK STRIPE] Erro ao processar webhook:", error)
    return NextResponse.json(
      { error: "Erro ao processar webhook", details: error.message },
      { status: 500 }
    )
  }
}

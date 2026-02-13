import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { purchaseConfirmationEmail, subscriptionActiveEmail } from "@/lib/email-templates"

const appBaseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // O Mercado Pago envia notificações no formato: { type: "payment", data: { id: "..." } }
    const { type, data } = body

    if (type === "payment" && data?.id) {
      const paymentId = data.id.toString()
      
      console.log(`[WEBHOOK MP] 📩 Notificação recebida: Payment ${paymentId}`)
      
      // Buscar informações do pagamento na API do Mercado Pago
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      )

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text()
        console.error(`[WEBHOOK MP] ❌ Erro ao buscar pagamento ${paymentId}:`, errorText)
        return NextResponse.json({ received: true })
      }

      const payment = await paymentResponse.json()

      // Buscar o order usando external_reference (que é o order.id)
      const externalReference = payment.external_reference
      if (!externalReference) {
        console.error(`[WEBHOOK MP] ⚠️ Pagamento ${paymentId} não tem external_reference`)
        return NextResponse.json({ received: true })
      }

      const order = await prisma.order.findUnique({
        where: { id: externalReference },
        include: {
          items: {
            include: {
              course: true,
            },
          },
          user: true,
        },
      })

      if (!order) {
        console.error(`[WEBHOOK MP] ❌ Order não encontrado: ${externalReference}`)
        return NextResponse.json({ received: true })
      }

      // Atualizar o order com o payment_id
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: paymentId.toString() },
      })

      // Verificar status do pagamento
      const status = payment.status

      if (status === "approved") {
        // Pagamento aprovado - liberar cursos
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "completed" },
        })

        // Criar enrollments para todos os cursos
        const courseIds = order.items.map((item) => item.courseId)
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

        console.log(`[WEBHOOK MP] ✅ Pagamento aprovado! Order: ${order.id}, Payment: ${paymentId}`)
      } else if (status === "rejected" || status === "cancelled") {
        // Pagamento rejeitado ou cancelado
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "failed" },
        })

        console.log(`[WEBHOOK MP] ❌ Pagamento ${status}! Order: ${order.id}, Payment: ${paymentId}`)
      } else if (status === "pending" || status === "in_process") {
        // Pagamento pendente
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "pending" },
        })

        console.log(`[WEBHOOK MP] ⏳ Pagamento pendente! Order: ${order.id}, Payment: ${paymentId}`)
      }
    } else if ((type === "subscription" || type === "preapproval") && data?.id) {
      // Notificação de assinatura
      const subscriptionId = data.id.toString()
      console.log(`[WEBHOOK MP] 📩 Notificação de assinatura recebida: ${subscriptionId}`)
      
      // Buscar informações da assinatura na API do Mercado Pago
      const subscriptionResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      )

      if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text()
        console.error(`[WEBHOOK MP] ❌ Erro ao buscar assinatura ${subscriptionId}:`, errorText)
        return NextResponse.json({ received: true })
      }

      const mpSubscription = await subscriptionResponse.json()
      
      // Buscar assinatura local pelo ID do Mercado Pago
      const subscription = await prisma.subscription.findFirst({
        where: { mercadoPagoSubscriptionId: subscriptionId },
        include: { user: true },
      })

      if (!subscription) {
        console.error(`[WEBHOOK MP] ❌ Assinatura não encontrada: ${subscriptionId}`)
        return NextResponse.json({ received: true })
      }

      // Atualizar status da assinatura
      let newStatus = subscription.status
      if (mpSubscription.status === "authorized") {
        newStatus = "active"
      } else if (mpSubscription.status === "paused" || mpSubscription.status === "cancelled") {
        newStatus = "canceled"
      } else if (mpSubscription.status === "pending") {
        newStatus = "pending"
      }

      // Atualizar datas do período
      const currentPeriodStart = mpSubscription.init_point ? new Date() : subscription.currentPeriodStart
      const currentPeriodEnd = mpSubscription.init_point 
        ? (() => {
            const end = new Date()
            end.setMonth(end.getMonth() + 1)
            return end
          })()
        : subscription.currentPeriodEnd

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: newStatus,
          currentPeriodStart,
          currentPeriodEnd,
        },
      })

      // Se a assinatura foi ativada, matricular nos cursos do plano
      if (newStatus === "active") {
        const plan = await prisma.subscriptionPlan.findFirst({
          where: { isActive: true },
          include: {
            courses: {
              include: {
                course: true,
              },
            },
          },
        })

        if (plan?.courses && plan.courses.length > 0) {
          for (const planCourse of plan.courses) {
            await prisma.enrollment.upsert({
              where: {
                userId_courseId: {
                  userId: subscription.userId,
                  courseId: planCourse.courseId,
                },
              },
              create: {
                userId: subscription.userId,
                courseId: planCourse.courseId,
                expiresAt: currentPeriodEnd,
              },
              update: {
                expiresAt: currentPeriodEnd,
              },
            })
          }

          // Criar notificação
          try {
            await prisma.notification.create({
              data: {
                userId: subscription.userId,
                title: "Assinatura Ativada! 🎉",
                message: `Sua assinatura foi ativada! Você agora tem acesso a todos os cursos do plano.`,
                type: "subscription_active",
              },
            })
          } catch (notifError) {
            console.error("[WEBHOOK MP] ❌ Erro ao criar notificação:", notifError)
          }

          if (subscription.user?.email) {
            const html = subscriptionActiveEmail({
              name: subscription.user.name || "Aluno",
              planName: plan?.name || "Plano",
              periodEnd: subscription.currentPeriodEnd
                ? subscription.currentPeriodEnd.toLocaleDateString("pt-BR")
                : "em breve",
              ctaUrl: `${appBaseUrl}/app`,
            })
            await sendEmail({
              to: subscription.user.email,
              subject: "Assinatura ativada - Método Dark",
              html,
            })
          }

          console.log(`[WEBHOOK MP] ✅ Assinatura ativada! Subscription: ${subscription.id}, User: ${subscription.userId}`)
        }
      } else if (newStatus === "canceled" || newStatus === "expired" || newStatus === "paused") {
        // Se a assinatura foi cancelada/expirada/pausada, remover acesso aos cursos do plano
        const plan = await prisma.subscriptionPlan.findFirst({
          where: { isActive: true },
          include: {
            courses: {
              include: {
                course: true,
              },
            },
          },
        })

        if (plan?.courses && plan.courses.length > 0) {
          for (const planCourse of plan.courses) {
            // Verificar se o enrollment existe
            const enrollment = await prisma.enrollment.findUnique({
              where: {
                userId_courseId: {
                  userId: subscription.userId,
                  courseId: planCourse.courseId,
                },
              },
            })

            // Se o enrollment existe e (tem expiresAt OU foi criado durante o período da assinatura)
            if (enrollment) {
              // Verificar se o curso foi comprado (existe um Order com status "completed")
              const purchasedOrder = await prisma.order.findFirst({
                where: {
                  userId: subscription.userId,
                  status: "completed",
                  items: {
                    some: {
                      courseId: planCourse.courseId,
                    },
                  },
                },
              })

              if (purchasedOrder) {
                // Se o curso foi comprado, apenas remover o expiresAt (voltar ao acesso vitalício)
                if (enrollment.expiresAt) {
                  await prisma.enrollment.update({
                    where: {
                      id: enrollment.id,
                    },
                    data: {
                      expiresAt: null,
                    },
                  })
                  console.log(`[WEBHOOK MP] ✅ Curso comprado mantido: ${planCourse.courseId}, removido expiresAt`)
                }
              } else {
                // Se o curso não foi comprado, remover o enrollment completamente
                await prisma.enrollment.delete({
                  where: {
                    id: enrollment.id,
                  },
                })
                console.log(`[WEBHOOK MP] ⚠️ Enrollment removido (curso não comprado): ${planCourse.courseId}`)
              }
            }
          }

          console.log(`[WEBHOOK MP] ⚠️ Acesso removido! Subscription: ${subscription.id}, Status: ${newStatus}, User: ${subscription.userId}`)
        }
      }

      console.log(`[WEBHOOK MP] ✅ Assinatura atualizada! Subscription: ${subscription.id}, Status: ${newStatus}`)
    } else if (type === "merchant_order" && data?.id) {
      // Merchant order notification (opcional)
      const orderId = data.id.toString()
      console.log(`[WEBHOOK MP] 📦 Merchant order notification: ${orderId}`)
    } else {
      console.log(`[WEBHOOK MP] ⚠️ Tipo de notificação desconhecido ou formato inválido:`, { type, data })
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[WEBHOOK MP] ❌ Erro ao processar webhook:", error)
    return NextResponse.json(
      { error: "Erro ao processar webhook", details: error.message },
      { status: 500 }
    )
  }
}

// GET para verificação do webhook (opcional)
export async function GET(req: Request) {
  return NextResponse.json({ message: "Mercado Pago webhook endpoint" })
}

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

// Validar se as chaves do Mercado Pago estão configuradas
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.error("⚠️ MERCADOPAGO_ACCESS_TOKEN não está configurada no arquivo .env")
}

const mercadopagoAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ""

export async function POST(req: Request) {
  try {
    // Verificar se o Mercado Pago está configurado
    if (!mercadopagoAccessToken) {
      return NextResponse.json(
        {
          error: "Serviço de pagamento não configurado",
          details: "A chave de acesso do Mercado Pago não foi encontrada.",
        },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se os modelos existem no Prisma Client
    if (!prisma.subscriptionPlan || !prisma.subscription) {
      return NextResponse.json(
        { 
          error: "Prisma Client precisa ser regenerado",
          details: "Execute: npx prisma generate && npx prisma db push"
        },
        { status: 500 }
      )
    }

    // Receber planId do body
    const { planId, durationMonths } = await req.json()

    if (!planId) {
      return NextResponse.json(
        { error: "ID do plano é obrigatório" },
        { status: 400 }
      )
    }

    const selectedDuration = Number(durationMonths) || 1
    const validDurations = [1, 6, 12]
    if (!validDurations.includes(selectedDuration)) {
      return NextResponse.json(
        { error: "Duração inválida. Use 1, 6 ou 12 meses." },
        { status: 400 }
      )
    }

    // Buscar plano específico com cursos
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Plano de assinatura não encontrado" },
        { status: 404 }
      )
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { error: "Este plano não está ativo" },
        { status: 400 }
      )
    }

    // Verificar se já tem assinatura ativa
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (existingSubscription?.status === "active") {
      return NextResponse.json(
        { error: "Você já possui uma assinatura ativa" },
        { status: 400 }
      )
    }

    // Validar NEXTAUTH_URL
    let baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    baseUrl = baseUrl.replace(/^["']|["']$/g, '').trim()
    
    if (!baseUrl || baseUrl === "undefined" || baseUrl === "") {
      return NextResponse.json(
        {
          error: "Configuração inválida",
          details: "NEXTAUTH_URL não está definida no arquivo .env ou está vazia",
          solution: "Adicione NEXTAUTH_URL=http://localhost:3000 no arquivo .env e reinicie o servidor",
        },
        { status: 500 }
      )
    }

    try {
      new URL(baseUrl)
    } catch (e) {
      return NextResponse.json(
        {
          error: "Configuração inválida",
          details: `NEXTAUTH_URL não é uma URL válida: ${baseUrl}`,
          solution: "Adicione NEXTAUTH_URL=http://localhost:3000 no arquivo .env",
        },
        { status: 500 }
      )
    }
    
    baseUrl = baseUrl.replace(/\/$/, '')

    const selectedPrice =
      selectedDuration === 1
        ? plan.price
        : selectedDuration === 6
          ? plan.price6Months
          : plan.price12Months

    if (selectedPrice === null || selectedPrice === undefined) {
      return NextResponse.json(
        { error: "Preço não configurado para a duração selecionada" },
        { status: 400 }
      )
    }

    const storedPlanId =
      selectedDuration === 1
        ? plan.mercadoPagoPlanId
        : selectedDuration === 6
          ? plan.mercadoPagoPlanId6Months
          : plan.mercadoPagoPlanId12Months

    let mercadoPagoPlanId = storedPlanId

    if (!mercadoPagoPlanId) {
      // Criar plano no Mercado Pago
      console.log("📦 Criando plano no Mercado Pago...")
      console.log("📋 Dados do plano:", {
        name: plan.name,
        price: selectedPrice,
        baseUrl: baseUrl,
      })
      
      // Para planos, o back_url é obrigatório mas não pode ser localhost
      // O Mercado Pago não aceita URLs localhost ou HTTP, então sempre usar URL HTTPS de produção
      let planBackUrl: string
      
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1") || baseUrl.startsWith("http://")) {
        // Em desenvolvimento, usar uma URL pública HTTPS ou a URL de produção se configurada
        // Você pode configurar NEXTAUTH_PRODUCTION_URL no .env com sua URL de produção
        planBackUrl = process.env.NEXTAUTH_PRODUCTION_URL || "https://metododark.com"
        console.log("⚠️ Usando URL de produção para plano (localhost não é aceito pelo Mercado Pago):", planBackUrl)
      } else {
        planBackUrl = baseUrl
      }
      
      // Garantir que a URL seja HTTPS e válida
      if (!planBackUrl.startsWith("https://")) {
        planBackUrl = `https://${planBackUrl.replace(/^https?:\/\//, "")}`
      }
      
      // Remover barra final se houver
      planBackUrl = planBackUrl.replace(/\/$/, "")
      
      const planData: any = {
        reason: plan.name,
        auto_recurring: {
          frequency: selectedDuration,
          frequency_type: "months",
          transaction_amount: selectedPrice,
          currency_id: "BRL",
          repetitions: null, // null = infinito
        },
        payment_methods_allowed: {
          payment_types: [{ id: "credit_card" }],
          payment_methods: [],
        },
        back_url: `${planBackUrl}/subscription/success`,
      }
      
      console.log("📤 Enviando dados do plano:", JSON.stringify(planData, null, 2))
      
      const planResponse = await fetch(
        "https://api.mercadopago.com/preapproval_plan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mercadopagoAccessToken}`,
            "X-Idempotency-Key": randomUUID(),
          },
          body: JSON.stringify(planData),
        }
      )

      if (!planResponse.ok) {
        const errorData = await planResponse.json()
        console.error("Erro ao criar plano:", errorData)
        return NextResponse.json(
          {
            error: "Erro ao criar plano de assinatura",
            details: errorData.message || "Erro desconhecido",
          },
          { status: planResponse.status }
        )
      }

      const mercadoPagoPlan = await planResponse.json()
      mercadoPagoPlanId = mercadoPagoPlan.id

      // Salvar o ID do plano no banco de dados
      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data:
          selectedDuration === 1
            ? { mercadoPagoPlanId }
            : selectedDuration === 6
              ? { mercadoPagoPlanId6Months: mercadoPagoPlanId }
              : { mercadoPagoPlanId12Months: mercadoPagoPlanId },
      })

      console.log("✅ Plano criado no Mercado Pago:", mercadoPagoPlanId)
      
      // Buscar informações completas do plano para obter o init_point
      const planInfoResponse = await fetch(
        `https://api.mercadopago.com/preapproval_plan/${mercadoPagoPlanId}`,
        {
          headers: {
            Authorization: `Bearer ${mercadopagoAccessToken}`,
          },
        }
      )
      
      if (planInfoResponse.ok) {
        const planInfo = await planInfoResponse.json()
        console.log("📋 Informações do plano:", {
          id: planInfo.id,
          init_point: planInfo.init_point,
          sandbox_init_point: planInfo.sandbox_init_point,
        })
        
        // Criar registro de assinatura pendente
        const currentPeriodStart = new Date()
        const currentPeriodEnd = new Date()
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + selectedDuration)

        await prisma.subscription.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            status: "pending",
            subscriptionPlanId: plan.id,
            planDurationMonths: selectedDuration,
            currentPeriodStart,
            currentPeriodEnd,
          },
          update: {
            status: "pending",
            subscriptionPlanId: plan.id,
            planDurationMonths: selectedDuration,
            currentPeriodStart,
            currentPeriodEnd,
          },
        })

        // Retornar o init_point do plano para redirecionar o usuário
        return NextResponse.json({
          init_point: planInfo.init_point,
          sandbox_init_point: planInfo.sandbox_init_point,
          id: planInfo.id,
          plan_id: mercadoPagoPlanId,
        })
      }
    }

    // Se o plano já existe, buscar o init_point
    console.log("📋 Buscando informações do plano existente...")
    const planInfoResponse = await fetch(
      `https://api.mercadopago.com/preapproval_plan/${mercadoPagoPlanId}`,
      {
        headers: {
          Authorization: `Bearer ${mercadopagoAccessToken}`,
        },
      }
    )

    if (!planInfoResponse.ok) {
      const errorData = await planInfoResponse.json()
      console.error("Erro ao buscar plano:", errorData)
      return NextResponse.json(
        {
          error: "Erro ao buscar plano de assinatura",
          details: errorData.message || "Erro desconhecido",
        },
        { status: planInfoResponse.status }
      )
    }

    const planInfo = await planInfoResponse.json()
    
    // Criar registro de assinatura pendente
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + selectedDuration)

    // Buscar o ID da assinatura do Mercado Pago (pode estar em planInfo.id ou planInfo.subscription_id)
    const mercadoPagoSubscriptionId = planInfo.id || planInfo.subscription_id || null

    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        status: "pending",
        mercadoPagoSubscriptionId,
        subscriptionPlanId: plan.id,
        planDurationMonths: selectedDuration,
        currentPeriodStart,
        currentPeriodEnd,
      },
      update: {
        status: "pending",
        mercadoPagoSubscriptionId: mercadoPagoSubscriptionId || undefined,
        subscriptionPlanId: plan.id,
        planDurationMonths: selectedDuration,
        currentPeriodStart,
        currentPeriodEnd,
      },
    })

    console.log("✅ Redirecionando para checkout do plano:", planInfo.id)

    return NextResponse.json({
      init_point: planInfo.init_point,
      sandbox_init_point: planInfo.sandbox_init_point,
      id: planInfo.id,
      plan_id: mercadoPagoPlanId,
    })
  } catch (error: any) {
    console.error("Subscription error:", error)

    // Erro de autenticação/autorização do Mercado Pago
    if (error?.status === 403 || error?.code === "PA_UNAUTHORIZED_RESULT_FROM_POLICIES" || error?.blocked_by === "PolicyAgent") {
      return NextResponse.json(
        {
          error: "Conta do Mercado Pago não autorizada",
          details: "Sua conta do Mercado Pago não tem permissão para criar assinaturas. Isso geralmente acontece quando:",
          reasons: [
            "A conta não está verificada/ativada completamente",
            "A conta está em modo de teste mas não tem permissões para criar preferências",
            "As credenciais (Access Token) estão incorretas ou expiradas",
            "A conta não tem permissão para criar assinaturas/recorrências"
          ],
          solution: "Verifique sua conta no Mercado Pago Dashboard e certifique-se de que está verificada e ativa. Se estiver em modo de teste, use as credenciais de teste corretas."
        },
        { status: 403 }
      )
    }

    // Erro de chave inválida
    if (error?.message?.includes("access_token") || error?.status === 401) {
      return NextResponse.json(
        {
          error: "Chave de acesso do Mercado Pago inválida",
          details: "A chave MERCADOPAGO_ACCESS_TOKEN no arquivo .env está incorreta ou expirada.",
          solution: "Verifique o arquivo MERCADOPAGO_SETUP.md para instruções de configuração."
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: "Erro ao processar assinatura",
        details: error?.message || "Ocorreu um erro inesperado.",
        code: error?.code || "UNKNOWN_ERROR",
        status: error?.status || 500
      },
      { status: 500 }
    )
  }
}

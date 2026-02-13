import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MercadoPagoConfig } from "mercadopago"
import { prisma } from "@/lib/prisma"

// Validar se as chaves do Mercado Pago estão configuradas
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.error("⚠️ MERCADOPAGO_ACCESS_TOKEN não está configurada no arquivo .env")
}

const client = process.env.MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      options: {
        timeout: 5000,
      },
    })
  : null

/**
 * Cria ou atualiza um plano de assinatura no Mercado Pago
 * Este endpoint deve ser chamado pelo admin para sincronizar o plano local com o Mercado Pago
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se é admin (você pode adicionar verificação de role aqui)
    // Por enquanto, qualquer usuário autenticado pode criar

    if (!client) {
      return NextResponse.json(
        {
          error: "Serviço de pagamento não configurado",
          details: "A chave de acesso do Mercado Pago não foi encontrada.",
        },
        { status: 500 }
      )
    }

    const { planId } = await req.json()

    if (!planId) {
      return NextResponse.json(
        { error: "ID do plano é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar plano local
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
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
        },
        { status: 500 }
      )
    }
    
    baseUrl = baseUrl.replace(/\/$/, '')

    // Para planos, o back_url é obrigatório mas não pode ser localhost
    // O Mercado Pago não aceita URLs localhost ou HTTP, então sempre usar URL HTTPS de produção
    let planBackUrl: string
    
    if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1") || baseUrl.startsWith("http://")) {
      // Em desenvolvimento, usar uma URL pública HTTPS ou a URL de produção se configurada
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

    // Criar plano no Mercado Pago usando a API REST diretamente
    // O SDK do Mercado Pago v2 não tem suporte direto para Subscription Plans
    // Vamos usar fetch para chamar a API REST
    const mercadoPagoPlanResponse = await fetch(
      "https://api.mercadopago.com/preapproval_plan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          reason: plan.name,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: plan.price,
            currency_id: "BRL",
            repetitions: null, // null = infinito
          },
          payment_methods_allowed: {
            payment_types: [{ id: "credit_card" }],
            payment_methods: [],
          },
          back_url: `${planBackUrl}/subscription/success`,
        }),
      }
    )

    if (!mercadoPagoPlanResponse.ok) {
      const errorData = await mercadoPagoPlanResponse.json()
      console.error("Erro ao criar plano no Mercado Pago:", errorData)
      return NextResponse.json(
        {
          error: "Erro ao criar plano no Mercado Pago",
          details: errorData.message || "Erro desconhecido",
        },
        { status: mercadoPagoPlanResponse.status }
      )
    }

    const mercadoPagoPlan = await mercadoPagoPlanResponse.json()

    // Atualizar plano local com o ID do Mercado Pago
    // Você pode adicionar um campo mercadoPagoPlanId ao schema se necessário
    // Por enquanto, vamos apenas retornar o ID

    return NextResponse.json({
      success: true,
      mercadoPagoPlanId: mercadoPagoPlan.id,
      init_point: mercadoPagoPlan.init_point,
      message: "Plano criado no Mercado Pago com sucesso",
    })
  } catch (error: any) {
    console.error("Error creating plan:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar plano",
        details: error?.message || "Ocorreu um erro inesperado.",
      },
      { status: 500 }
    )
  }
}


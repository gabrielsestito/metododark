"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, Crown, ArrowLeft, Sparkles, Zap, Star, Gift, BookOpen } from "lucide-react"
import Link from "next/link"
import { notifyError } from "@/lib/notifications"

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push("/login")
      return
    }

    fetchSubscriptionData()
  }, [session, router])

  const fetchSubscriptionData = async () => {
    try {
      console.log("[SubscriptionPage] Buscando dados de assinatura...")
      
      const [subscriptionResponse, plansResponse] = await Promise.all([
        fetch("/api/subscription"),
        fetch("/api/subscription/plans"),
      ])
      
      if (!subscriptionResponse.ok) {
        console.error("[SubscriptionPage] Erro ao buscar assinatura:", subscriptionResponse.status)
      }
      
      if (!plansResponse.ok) {
        console.error("[SubscriptionPage] Erro ao buscar planos:", plansResponse.status)
        const errorData = await plansResponse.json().catch(() => ({}))
        console.error("[SubscriptionPage] Detalhes do erro:", errorData)
      }
      
      const subscriptionData = await subscriptionResponse.json().catch(() => ({}))
      const plans = await plansResponse.json().catch(() => [])
      
      console.log(`[SubscriptionPage] Recebidos ${Array.isArray(plans) ? plans.length : 0} planos`)
      
      if (Array.isArray(plans)) {
        setSubscriptionData({ ...subscriptionData, plans })
      } else if (plans.error) {
        console.error("[SubscriptionPage] Erro retornado pela API:", plans.error)
        setSubscriptionData({ ...subscriptionData, plans: [] })
      } else {
        console.warn("[SubscriptionPage] Resposta inesperada:", plans)
        setSubscriptionData({ ...subscriptionData, plans: [] })
      }
    } catch (error: any) {
      console.error("[SubscriptionPage] Erro ao buscar dados:", error)
      console.error("[SubscriptionPage] Mensagem:", error?.message)
      setSubscriptionData({ plans: [] })
    } finally {
      setFetching(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    if (!session || !planId) return

    setLoading(true)

    try {
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = data.error || "Erro ao processar assinatura"
        
        if (data.details) {
          errorMessage += `\n\n${data.details}`
        }
        
        if (data.reasons && Array.isArray(data.reasons)) {
          errorMessage += "\n\nPossíveis causas:\n" + data.reasons.map((r: string) => `• ${r}`).join("\n")
        }
        
        if (data.solution) {
          errorMessage += `\n\nSolução: ${data.solution}`
        }
        
        await notifyError("Erro ao processar assinatura", errorMessage)
        setLoading(false)
        return
      }

      const checkoutUrl = process.env.NODE_ENV === "production"
        ? data.init_point
        : data.sandbox_init_point || data.init_point

      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        await notifyError("Erro", "Erro ao processar assinatura. Tente novamente.")
        setLoading(false)
      }
    } catch (error: any) {
      console.error("Subscription error:", error)
      await notifyError("Erro", "Erro ao processar assinatura. Verifique sua conexão e tente novamente.")
      setLoading(false)
    }
  }

  if (!session || fetching) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b5cf6]" />
      </div>
    )
  }

  const hasActiveSubscription = subscriptionData?.hasActiveSubscription
  const plans = subscriptionData?.plans || []
  const subscription = subscriptionData?.subscription

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link href="/app">
            <Button 
              variant="ghost" 
              className="w-fit text-white/60 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 w-fit">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-medium text-white/80">Assinatura</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            Planos de Assinatura
          </h1>
          <p className="text-white/60 text-base sm:text-lg">
            Escolha o plano ideal para você e tenha acesso ilimitado
          </p>
        </div>

        {/* Subscription Status */}
        {hasActiveSubscription && subscription && (
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-2 border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Assinatura Ativa</h2>
            </div>
            <div className="space-y-2 text-white/80">
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span className="text-green-400 font-bold">Ativa</span>
              </p>
              {subscription.currentPeriodEnd && (
                <p>
                  <span className="font-semibold">Próxima cobrança:</span>{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        {plans.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan: any, index: number) => {
              const isRecommended = index === 1 || (plans.length === 1 && index === 0)
              
              return (
                <Card
                  key={plan.id}
                  className={`relative bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border rounded-xl overflow-hidden transition-all transform hover:scale-[1.02] h-full flex flex-col ${
                    isRecommended
                      ? "border-2 border-[#8b5cf6]/50 shadow-xl shadow-[#8b5cf6]/20"
                      : "border-white/5 hover:border-[#8b5cf6]/30"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-[#8b5cf6] to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                      ⭐ RECOMENDADO
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        isRecommended
                          ? "bg-gradient-to-br from-[#8b5cf6] to-purple-600"
                          : "bg-white/5"
                      }`}>
                        <Crown className={`h-5 w-5 ${isRecommended ? "text-white" : "text-[#8b5cf6]"}`} />
                      </div>
                      <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 flex flex-col h-full">
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <p className="text-4xl font-black text-white">
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                        </p>
                        <span className="text-lg text-white/60">/mês</span>
                      </div>
                      <p className="text-sm text-white/60">
                        {plan.courses?.length || 0} curso{plan.courses?.length !== 1 ? 's' : ''} incluído{plan.courses?.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="space-y-4 flex-1">
                      {plan.courses && plan.courses.length > 0 && (
                        <div className="pb-4 border-b border-white/10">
                          <p className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Cursos Incluídos:
                          </p>
                          <div className="text-xs text-white/70 space-y-2 max-h-48 overflow-y-auto">
                            {plan.courses.map((planCourse: any) => (
                              <div key={planCourse.courseId || planCourse.course?.id} className="flex items-start gap-2">
                                <CheckCircle className="h-3.5 w-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{planCourse.course?.title || "Curso"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-green-500/20">
                            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                          </div>
                          <span className="text-sm text-white/80">Acesso ilimitado a todos os cursos do plano</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-green-500/20">
                            <Zap className="h-3.5 w-3.5 text-green-400" />
                          </div>
                          <span className="text-sm text-white/80">Novos cursos adicionados automaticamente</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-green-500/20">
                            <Gift className="h-3.5 w-3.5 text-green-400" />
                          </div>
                          <span className="text-sm text-white/80">Cancelamento a qualquer momento</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-green-500/20">
                            <Star className="h-3.5 w-3.5 text-green-400" />
                          </div>
                          <span className="text-sm text-white/80">Suporte prioritário</span>
                        </div>
                      </div>
                    </div>

                    {!hasActiveSubscription && (
                      <Button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={loading}
                        className={`w-full h-12 text-base font-semibold border-0 ${
                          isRecommended
                            ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/30"
                            : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        }`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Crown className="mr-2 h-5 w-5" />
                            Assinar Agora
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5">
            <CardContent className="p-12 text-center">
              <div className="inline-block p-6 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 mb-4">
                <Crown className="h-12 w-12 text-yellow-400" />
              </div>
              <p className="text-white/60 text-lg">Nenhum plano de assinatura disponível no momento.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

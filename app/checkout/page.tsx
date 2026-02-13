"use client"

import { useEffect, useState } from "react"
import { useCartStore } from "@/store/cart-store"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock, CheckCircle, ArrowLeft, Shield, CreditCard, Wallet, X, Calendar, Clock, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { confirm } from "@/lib/confirm"

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, getTotal } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingOrder, setPendingOrder] = useState<any | null>(null)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const total = getTotal()
  const subtotal = items.reduce((acc, item) => acc + (item.promoPrice || item.price), 0)

  useEffect(() => {
    if (!session) {
      router.push("/login")
      return
    }

    if (items.length === 0) {
      router.push("/carrinho")
      return
    }

    // Verificar se foi cancelado
    if (searchParams.get("canceled") === "true") {
      setError("Pagamento cancelado. Você pode tentar novamente.")
    }
  }, [session, items, router, searchParams])

  const handleCheckout = async () => {
    if (!session || items.length === 0) {
      setError("Sessão expirada ou carrinho vazio. Por favor, faça login novamente.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.pendingOrder) {
          // Buscar detalhes completos do pedido pendente
          try {
            const pendingResponse = await fetch("/api/checkout/pending-order")
            if (pendingResponse.ok) {
              const pendingData = await pendingResponse.json()
              setPendingOrder(pendingData.order)
              setShowPendingModal(true)
            } else {
              setError(
                "Você já possui um pedido pendente. Finalize ou cancele o pedido atual antes de criar um novo."
              )
            }
          } catch (err) {
            setError(
              "Você já possui um pedido pendente. Finalize ou cancele o pedido atual antes de criar um novo."
            )
          }
          setLoading(false)
          return
        }
        setError(data.error || "Erro ao processar pagamento")
        setLoading(false)
        return
      }

      // Redirecionar para o Mercado Pago Checkout
      // Usar sandbox_init_point em desenvolvimento, init_point em produção
      const checkoutUrl = process.env.NODE_ENV === "production"
        ? data.initPoint
        : data.sandboxInitPoint || data.initPoint

      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        setError("Erro ao criar sessão de pagamento. Tente novamente.")
        setLoading(false)
      }
    } catch (error: any) {
      console.error("Checkout error:", error)
      setError(`Erro ao processar pagamento: ${error.message || "Erro desconhecido"}. Verifique sua conexão e tente novamente.`)
      setLoading(false)
    }
  }

  const handleContinuePayment = async () => {
    if (!pendingOrder) return

    setProcessingPayment(true)
    try {
      const response = await fetch("/api/checkout/pending-order/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: pendingOrder.id }),
      })

      const data = await response.json()

      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError(data.error || "Erro ao continuar pagamento")
        setShowPendingModal(false)
      }
    } catch (error: any) {
      console.error("Error continuing payment:", error)
      setError("Erro ao continuar pagamento. Tente novamente.")
      setShowPendingModal(false)
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!pendingOrder) return
    
    const confirmed = await confirm({
      title: "Cancelar Pedido",
      description: "Tem certeza que deseja cancelar este pedido?",
      confirmText: "Cancelar Pedido",
      cancelText: "Voltar",
      variant: "destructive",
    })
    
    if (!confirmed) return

    setCanceling(true)
    try {
      const response = await fetch(`/api/orders/${pendingOrder.id}/cancel`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setPendingOrder(null)
        setShowPendingModal(false)
        setError(null)
        // Recarregar a página para tentar criar o novo pedido
        window.location.reload()
      } else {
        setError(data.error || "Erro ao cancelar pedido")
      }
    } catch (error: any) {
      console.error("Error canceling order:", error)
      setError("Erro ao cancelar pedido. Tente novamente.")
    } finally {
      setCanceling(false)
    }
  }

  if (!session || items.length === 0) {
    return null
  }

  return (
    <>
      {/* Modal de Pedido Pendente */}
      {showPendingModal && pendingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-[#0a0a0a] border border-white/5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Pedido Pendente</CardTitle>
                    <p className="text-sm text-white/60 mt-1">Você tem um pagamento aguardando confirmação</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPendingModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Detalhes do Pedido */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-lg border border-white/10">
                  <div>
                    <p className="text-sm text-white/60">Número do Pedido</p>
                    <p className="font-semibold text-white">#{pendingOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/60">Criado em</p>
                    <p className="font-semibold text-white">
                      {new Date(pendingOrder.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {/* Cursos do Pedido */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Cursos do Pedido</h3>
                  <div className="space-y-3">
                    {pendingOrder.items.map((item: any) => (
                      <div key={item.id} className="flex gap-4 p-3 bg-[#0f0f0f] rounded-lg border border-white/10">
                        {item.course.thumbnailUrl && (
                          <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                            <Image
                              src={item.course.thumbnailUrl}
                              alt={item.course.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white mb-1">{item.course.title}</h4>
                          {item.course.subtitle && (
                            <p className="text-sm text-white/60 mb-2">{item.course.subtitle}</p>
                          )}
                          <p className="text-lg font-bold text-[#8b5cf6]">R$ {item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-lg border border-white/10">
                  <span className="text-xl font-bold text-white">Total</span>
                  <span className="text-2xl font-black text-[#8b5cf6]">R$ {pendingOrder.total.toFixed(2)}</span>
                </div>

                {/* Aviso */}
                <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-400 font-medium mb-1">Atenção</p>
                    <p className="text-sm text-white/80">
                      Você precisa finalizar o pagamento deste pedido antes de criar um novo. 
                      Clique em &quot;Finalizar Pagamento&quot; para continuar ou &quot;Cancelar Pedido&quot; para criar um novo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button
                  onClick={handleContinuePayment}
                  disabled={processingPayment}
                  className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Finalizar Pagamento
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancelOrder}
                  disabled={canceling}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  {canceling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    "Cancelar Pedido"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Página Principal */}
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <Link href="/carrinho" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao carrinho
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0f0f0f] border border-white/5 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Resumo do Pedido</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-white/5 last:border-0">
                    {item.thumbnailUrl && (
                      <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                      <p className="text-lg font-bold text-gradient">
                        R$ {(item.promoPrice || item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="bg-[#0f0f0f] border border-white/5 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-[#8b5cf6]" />
                Métodos de Pagamento Disponíveis
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-white/10">
                  <div className="h-6 w-6 flex items-center justify-center font-bold text-xs rounded bg-[#8b5cf6] text-white">
                    PIX
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-sm">PIX</p>
                    <p className="text-xs text-white/60">Aprovação instantânea</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-white/10">
                  <div className="h-6 w-6 flex items-center justify-center font-bold text-xs rounded bg-[#8b5cf6] text-white">
                    B
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-sm">Boleto Bancário</p>
                    <p className="text-xs text-white/60">Vencimento em 3 dias úteis</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-white/10">
                  <Wallet className="h-6 w-6 text-[#8b5cf6]" />
                  <div className="text-left flex-1">
                    <p className="font-semibold text-sm">Cartão de Crédito</p>
                    <p className="text-xs text-white/60">Visa, Mastercard, Elo, Amex</p>
                  </div>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-white/60">
                Você poderá escolher o método de pagamento preferido na página do Mercado Pago.
              </p>
            </div>

            {/* Payment Info */}
            <div className="bg-[#0f0f0f] border border-white/5 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Shield className="h-6 w-6 text-[#8b5cf6]" />
                Segurança
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">Pagamento 100% Seguro</p>
                    <p className="text-sm text-white/60">Processado pelo Mercado Pago com criptografia SSL</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">Acesso Imediato</p>
                    <p className="text-sm text-white/60">Após a confirmação do pagamento, você terá acesso imediato aos cursos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">Garantia de 7 Dias</p>
                    <p className="text-sm text-white/60">Não ficou satisfeito? Reembolso garantido em até 7 dias</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Sidebar */}
          <div>
            <div className="bg-[#0f0f0f] border border-white/5 rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-6">Total do Pedido</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'curso' : 'cursos'})</span>
                  <span className="text-white">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <div className="flex justify-between text-2xl font-black mb-6">
                    <span className="text-white">Total</span>
                    <span className="text-gradient">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
                  <p className="text-sm text-red-400 whitespace-pre-line font-medium">{error}</p>
                </div>
              )}

              <Button
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0 h-12 text-base font-semibold mb-4"
                size="lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Finalizar Pagamento
                  </>
                )}
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center justify-center gap-2 text-white/60">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>Pagamento seguro</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-white/60">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Garantia 7 dias</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-white/60">
                  <Clock className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Acesso imediato</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

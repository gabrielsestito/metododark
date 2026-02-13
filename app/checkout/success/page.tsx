"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCartStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Limpar carrinho quando chegar na página de sucesso
    clearCart()
    
    // O Mercado Pago redireciona para cá após o pagamento
    // O webhook processa e libera os cursos automaticamente
    setLoading(false)
  }, [clearCart])

  const status = searchParams.get("status") // approved, pending, etc.
  const preferenceId = searchParams.get("preference_id")
  const orderId = searchParams.get("order_id")

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8b5cf6] mx-auto mb-4" />
          <p className="text-white/60">Processando pagamento...</p>
        </div>
      </div>
    )
  }

  // Se o status for pending, mostrar mensagem de pagamento pendente
  if (status === "pending") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="bg-[#0f0f0f] border border-white/5">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-12 w-12 text-yellow-400 animate-spin" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-white">
                Pagamento Processando!
              </h1>
              <p className="text-white/60 mb-4">
                Seu pagamento está sendo processado. Você receberá uma notificação por email quando for confirmado.
              </p>
              <p className="text-sm text-yellow-400/80 mb-8">
                O acesso aos cursos será liberado automaticamente após a confirmação do pagamento.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/app/meus-cursos">
                  <Button size="lg" className="bg-[#8b5cf6] hover:bg-[#7c3aed]">
                    Ir para Meus Cursos
                  </Button>
                </Link>
                <Link href="/cursos">
                  <Button variant="outline" size="lg" className="border-white/10 text-white/60 hover:text-white">
                    Explorar Mais Cursos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Pagamento aprovado (ou sem status, que geralmente significa aprovado)
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="bg-[#0f0f0f] border border-white/5">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-white">
              Pagamento Realizado com Sucesso! 🎉
            </h1>
            <p className="text-white/60 mb-4">
              Seu pagamento foi processado com sucesso! Você já pode acessar seus cursos.
            </p>
            <p className="text-sm text-green-400/80 mb-8">
              O acesso aos cursos será liberado automaticamente. Se ainda não aparecer, aguarde alguns instantes ou recarregue a página.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/app/meus-cursos">
                <Button size="lg" className="bg-[#8b5cf6] hover:bg-[#7c3aed]">
                  Ir para Meus Cursos
                </Button>
              </Link>
              <Link href="/cursos">
                <Button variant="outline" size="lg" className="border-white/10 text-white/60 hover:text-white">
                  Explorar Mais Cursos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

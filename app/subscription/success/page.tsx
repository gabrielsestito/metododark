"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Aguardar um pouco e atualizar dados da assinatura
    const timer = setTimeout(() => {
      router.refresh()
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-[#0f0f0f] border border-white/5 rounded-lg p-6 lg:p-8">
          <Card className="bg-[#0a0a0a] border border-green-500/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-black text-white mb-4">
                Assinatura Confirmada!
              </h1>
              <p className="text-white/60 mb-8">
                Sua assinatura foi ativada com sucesso. Agora você tem acesso a todos os cursos da plataforma.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/app">
                  <Button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Ver Meus Cursos
                  </Button>
                </Link>
                <Link href="/cursos">
                  <Button variant="outline" className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                    Explorar Cursos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


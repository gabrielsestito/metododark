"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, ArrowLeft } from "lucide-react"

export default function SubscriptionPendingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-[#0f0f0f] border border-white/5 rounded-lg p-6 lg:p-8">
          <Card className="bg-[#0a0a0a] border border-yellow-500/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-black text-white mb-4">
                Pagamento Pendente
              </h1>
              <p className="text-white/60 mb-8">
                Seu pagamento está sendo processado. Você receberá uma confirmação por e-mail assim que for aprovado.
              </p>
              <Link href="/app">
                <Button variant="outline" className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


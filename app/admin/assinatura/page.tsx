import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SubscriptionPlansList } from "@/components/admin/subscription-plans-list"
import { ArrowLeft, Sparkles, Crown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export default async function AdminAssinaturaPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/")
  }

  const permissions = getPermissions(session.user.role)
  if (!permissions.canManageSubscriptions) {
    redirect("/admin")
  }

  // Verificar se os modelos existem no Prisma Client
  let activePlansCount = 0
  let activeSubscriptions = 0

  try {
    activePlansCount = await prisma.subscriptionPlan.count({
      where: { isActive: true },
    })

    activeSubscriptions = await prisma.subscription.count({
      where: { status: "active" },
    })
  } catch (error: any) {
    // Se os modelos não existem, o Prisma Client precisa ser regenerado
    if (error.message?.includes("subscriptionPlan") || error.message?.includes("subscription")) {
      console.error("Prisma Client precisa ser regenerado. Execute: npx prisma generate && npx prisma db push")
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-[#0f0f0f] border border-white/5 rounded-lg p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin">
              <Button 
                variant="ghost" 
                className="mb-4 text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 mb-4">
              <Crown className="h-4 w-4 text-[#8b5cf6]" />
              <span className="text-xs font-medium text-white/60">Gerenciamento de Assinatura</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 text-white">
              Assinatura
            </h1>
            <p className="text-white/60 text-base sm:text-lg">
              Gerencie múltiplos planos de assinatura
            </p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Card className="bg-[#0a0a0a] border border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="h-5 w-5 text-[#8b5cf6]" />
                  <p className="text-sm text-white/60">Assinantes Ativos</p>
                </div>
                <p className="text-3xl font-black text-white">{activeSubscriptions}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0a0a] border border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-5 w-5 text-[#8b5cf6]" />
                  <p className="text-sm text-white/60">Planos Ativos</p>
                </div>
                <p className="text-3xl font-black text-white">{activePlansCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Plans List */}
          <SubscriptionPlansList />
        </div>
      </div>
    </div>
  )
}


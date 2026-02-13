import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { isAdminRole, getPermissions } from "@/lib/permissions"
import { 
  Sparkles, 
  DollarSign, 
  BarChart3, 
  Calendar, 
  Crown, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle 
} from "lucide-react"
import { AdminPedidosClient } from "@/components/admin/admin-pedidos-client"

export default async function AdminFinanceiroPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/")
  }

  const permissions = getPermissions(session.user.role)
  if (!permissions.canViewFinancial) {
    redirect("/admin")
  }

  const [
    revenueAgg,
    ordersByStatus,
    paymentMethods,
    monthlyRevenue,
    subscriptionsStats,
    recentOrders
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "completed" },
      _sum: { total: true },
      _count: { id: true },
    }),
    Promise.all([
      prisma.order.count({ where: { status: "completed" } }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "failed" } }),
    ]).then(([completed, pending, failed]) => ({ completed, pending, failed })),
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { status: "completed" },
      _sum: { total: true },
      _count: { id: true },
    }),
    Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return prisma.order.aggregate({
          where: {
            status: "completed",
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { total: true },
          _count: { id: true },
        }).then(result => ({
          label: date.toLocaleString("pt-BR", { month: "short", year: "numeric" }),
          revenue: result._sum.total || 0,
          orders: result._count.id || 0,
        }))
      })
    ).then(r => r.reverse()),
    Promise.all([
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.subscription.count({}),
    ]).then(([active, total]) => ({ active, total })),
    prisma.order.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { course: { select: { id: true, title: true } } } },
      },
    }),
  ])

  const totalRevenue = revenueAgg._sum.total || 0
  const totalCompletedOrders = revenueAgg._count.id || 0
  const avgTicket = totalCompletedOrders > 0 ? totalRevenue / totalCompletedOrders : 0
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <Link href="/admin">
              <Button 
                variant="ghost" 
                className="mb-4 text-white/60 hover:text-white hover:bg-white/5"
              >
                <Sparkles className="h-4 w-4 mr-2 text-[#8b5cf6]" />
                Financeiro
              </Button>
            </Link>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-500 bg-clip-text text-transparent">
              Painel Financeiro
            </h1>
            <p className="text-white/60 text-base sm:text-lg">KPIs, receitas, assinaturas e transações</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/receita">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0">
                <BarChart3 className="h-4 w-4 mr-2" />
                Receita
              </Button>
            </Link>
            <Link href="/admin/pedidos">
              <Button variant="outline" className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                <Calendar className="h-4 w-4 mr-2" />
                Pedidos
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-600/10 border border-teal-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Receita Total</p>
                <p className="text-4xl font-black text-teal-400">
                  R$ {totalRevenue.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-xs text-white/50">{totalCompletedOrders} pedidos concluídos</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Ticket Médio</p>
                <p className="text-4xl font-black text-white">
                  R$ {avgTicket.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-xs text-white/50">por pedido concluído</p>
              </div>
              <TrendingUp className="h-6 w-6 text-white/40" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Assinaturas Ativas</p>
                <p className="text-4xl font-black text-yellow-300">
                  {subscriptionsStats.active}
                </p>
                <p className="text-xs text-white/50">{subscriptionsStats.total} no total</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Crown className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Pedidos Pendentes</p>
                <p className="text-4xl font-black text-orange-400">
                  {ordersByStatus.pending}
                </p>
                <p className="text-xs text-white/50">aguardando processamento</p>
              </div>
              <Clock className="h-6 w-6 text-white/40" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Receita Mensal</h2>
                <p className="text-sm text-white/60">Últimos 12 meses</p>
              </div>
              <BarChart3 className="h-5 w-5 text-white/40" />
            </div>
            <div className="space-y-4">
              {monthlyRevenue.map((m, idx) => {
                const percentage = maxMonthlyRevenue > 0 ? (m.revenue / maxMonthlyRevenue) * 100 : 0
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60 capitalize">{m.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white/40 text-xs">{m.orders} pedidos</span>
                        <span className="text-white font-semibold">
                          R$ {m.revenue.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Resumo de Pedidos</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Concluídos</p>
                    <p className="text-2xl font-black text-green-400">{ordersByStatus.completed}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Pendentes</p>
                    <p className="text-2xl font-black text-yellow-400">{ordersByStatus.pending}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Falhados</p>
                    <p className="text-2xl font-black text-red-400">{ordersByStatus.failed}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Métodos de Pagamento</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {paymentMethods.map((method, index) => {
              const percentage = totalRevenue ? ((method._sum.total || 0) / totalRevenue) * 100 : 0
              const methodName = method.paymentMethod === "pix" ? "PIX" : 
                                 method.paymentMethod === "credit_card" ? "Cartão de Crédito" :
                                 method.paymentMethod === "boleto" ? "Boleto" :
                                 method.paymentMethod
              return (
                <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-white/60 mb-2">{methodName}</p>
                  <p className="text-2xl font-black text-white mb-1">
                    R$ {(method._sum.total || 0).toFixed(2).replace(".", ",")}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                    <span>{method._count.id} pedidos</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6 lg:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Transações Recentes</h2>
          <AdminPedidosClient orders={recentOrders.map(order => ({
            ...order,
            createdAt: order.createdAt,
            expiresAt: order.expiresAt,
          }))} />
        </div>
      </div>
    </div>
  )
}

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, Sparkles, ShoppingCart, TrendingUp, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { isAdminRole, getPermissions } from "@/lib/permissions"
import { AdminPedidosClient } from "@/components/admin/admin-pedidos-client"

export default async function AdminPedidosPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/")
  }

  const permissions = getPermissions(session.user.role)
  if (!permissions.canViewOrders) {
    redirect("/admin")
  }

  const [orders, stats] = await Promise.all([
    prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { status: "completed" },
      }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "failed" } }),
      prisma.order.count(),
    ]).then(([completed, pending, failed, total]) => ({
      completed: completed._sum.total || 0,
      completedCount: completed._count.id,
      pending,
      failed,
      total,
    }))
  ])

  const completedOrders = orders.filter(o => o.status === "completed").length
  const pendingOrders = orders.filter(o => o.status === "pending").length
  const failedOrders = orders.filter(o => o.status === "failed").length

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <Link href="/admin">
              <Button 
                variant="ghost" 
                className="mb-4 text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-600/20 border border-orange-500/30 mb-4">
              <Sparkles className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-medium text-white/80">Pedidos</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Pedidos
            </h1>
            <p className="text-white/60 text-base sm:text-lg">Visualize e gerencie todos os pedidos da plataforma</p>
          </div>
          {permissions.canViewFinancial && (
            <Link href="/admin/receita">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg shadow-green-500/20">
                <DollarSign className="h-4 w-4 mr-2" />
                Ver Receita
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-white/60 mb-1">Total de Pedidos</p>
            <p className="text-3xl font-black text-white">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-white/60 mb-1">Concluídos</p>
            <p className="text-3xl font-black text-green-400">{completedOrders}</p>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-white/60 mb-1">Pendentes</p>
            <p className="text-3xl font-black text-yellow-400">{pendingOrders}</p>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-white/60 mb-1">Receita Total</p>
            <p className="text-2xl font-black text-green-400">
              R$ {stats.completed.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6 lg:p-8">
          <AdminPedidosClient orders={orders.map(order => ({
            ...order,
            createdAt: order.createdAt,
            expiresAt: order.expiresAt,
          }))} />
        </div>
      </div>
    </div>
  )
}

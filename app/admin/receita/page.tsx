import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, Sparkles, DollarSign, TrendingUp, BarChart3, Calendar, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export default async function AdminReceitaPage({
  searchParams,
}: {
  searchParams?: { months?: string; days?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/")
  }

  const permissions = getPermissions(session.user.role)
  if (!permissions.canViewFinancial) {
    redirect("/admin")
  }

  const monthsRequested = Math.max(1, Math.min(parseInt(searchParams?.months || "12"), 24))
  const allowedMonths = [6, 12, 24]
  const monthsCount = allowedMonths.includes(monthsRequested) ? monthsRequested : 12
  const daysRequested = Math.max(1, Math.min(parseInt(searchParams?.days || "30"), 90))
  const allowedDays = [7, 30, 90]
  const daysCount = allowedDays.includes(daysRequested) ? daysRequested : 30

  const [
    totalRevenueAgg,
    monthlyRevenue,
    dailyRevenue,
    ordersByStatus,
    topCourses,
    paymentMethods,
    totalOrdersCount
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "completed" },
      _sum: { total: true },
      _count: { id: true },
    }),

    Promise.all(
      Array.from({ length: monthsCount }, (_, i) => {
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
          month: date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
          monthIndex: date.getMonth(),
          year: date.getFullYear(),
          revenue: result._sum.total || 0,
          orders: result._count.id,
        }))
      })
    ).then(results => results.reverse()),

    Promise.all(
      Array.from({ length: daysCount }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)

        return prisma.order.aggregate({
          where: {
            status: "completed",
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          _sum: { total: true },
          _count: { id: true },
        }).then(result => ({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
          revenue: result._sum.total || 0,
          orders: result._count.id,
        }))
      })
    ).then(results => results.reverse()),

    Promise.all([
      prisma.order.count({ where: { status: "completed" } }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "failed" } }),
    ]).then(([completed, pending, failed]) => ({
      completed,
      pending,
      failed,
    })),

    prisma.orderItem.groupBy({
      by: ['courseId'],
      where: {
        order: {
          status: "completed",
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        price: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    }).then(async (items) => {
      const courses = await Promise.all(
        items.map(async (item) => {
          const course = await prisma.course.findUnique({
            where: { id: item.courseId },
            select: { title: true },
          })
          return {
            courseId: item.courseId,
            title: course?.title || "Curso não encontrado",
            sales: item._count.id,
            revenue: item._sum.price || 0,
          }
        })
      )
      return courses
    }),

    prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        status: "completed",
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.order.count(),
  ])

  const totalRevenue = totalRevenueAgg._sum.total || 0
  const totalCompletedOrders = totalRevenueAgg._count.id || 0
  const conversionRate = totalOrdersCount > 0 ? (ordersByStatus.completed / totalOrdersCount) * 100 : 0
  const avgTicket = totalCompletedOrders > 0 ? totalRevenue / totalCompletedOrders : 0
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1)
  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1)
  const dailyAverageRevenue = daysCount > 0 ? (dailyRevenue.reduce((sum, d) => sum + (d.revenue || 0), 0) / daysCount) : 0
  const bestDay = dailyRevenue.reduce((best, d) => (d.revenue > (best?.revenue || 0) ? d : best), dailyRevenue[0])
  const worstDay = dailyRevenue.reduce((worst, d) => (d.revenue < (worst?.revenue ?? Infinity) ? d : worst), dailyRevenue[0])
  const monthlyChangePct = monthlyRevenue.length >= 2 
    ? (((monthlyRevenue[monthlyRevenue.length - 1].revenue || 0) - (monthlyRevenue[monthlyRevenue.length - 2].revenue || 0)) / Math.max((monthlyRevenue[monthlyRevenue.length - 2].revenue || 0), 1)) * 100
    : 0

  const csvDaily = [
    ["data", "dia_semana", "receita", "pedidos"].join(","),
    ...dailyRevenue.map(d => [d.date, d.weekday, d.revenue.toFixed(2), d.orders].join(","))
  ].join("\n")
  const csvMonthly = [
    ["mes", "receita", "pedidos"].join(","),
    ...monthlyRevenue.map(m => [m.month, m.revenue.toFixed(2), m.orders].join(","))
  ].join("\n")

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
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30 mb-4">
              <Sparkles className="h-4 w-4 text-green-400" />
              <span className="text-xs font-medium text-white/80">Receita</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
              Receita Total
            </h1>
            <p className="text-white/60 text-base sm:text-lg">Análise completa de receitas e vendas</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {[6,12,24].map(m => (
                <Link key={m} href={`/admin/receita?months=${m}&days=${daysCount}`}>
                  <Button variant={monthsCount === m ? "default" : "outline"} className={monthsCount === m ? "bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white" : "border-white/10 text-white/80"}>
                    {m} meses
                  </Button>
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[7,30,90].map(d => (
                <Link key={d} href={`/admin/receita?months=${monthsCount}&days=${d}`}>
                  <Button variant={daysCount === d ? "default" : "outline"} className={daysCount === d ? "bg-gradient-to-r from-emerald-500 to-green-600 border-0 text-white" : "border-white/10 text-white/80"}>
                    {d} dias
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60 mb-2">Receita Total</p>
              <p className="text-5xl font-black text-green-400 mb-2">
                R$ {totalRevenue.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-white/60">
                {totalCompletedOrders} pedido{totalCompletedOrders !== 1 ? 's' : ''} concluído{totalCompletedOrders !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <DollarSign className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <p className="text-sm text-white/60 mb-1">Ticket Médio</p>
            <p className="text-3xl font-black text-white">R$ {avgTicket.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <p className="text-sm text-white/60 mb-1">Conversão</p>
            <p className="text-3xl font-black text-white">{conversionRate.toFixed(1)}%</p>
          </div>
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <p className="text-sm text-white/60 mb-1">Média Diária</p>
            <p className="text-3xl font-black text-white">R$ {dailyAverageRevenue.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <p className="text-sm text-white/60 mb-1">Variação Mensal</p>
            <p className={`text-3xl font-black ${monthlyChangePct >= 0 ? "text-green-400" : "text-red-400"}`}>{monthlyChangePct.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Receita Mensal</h2>
                <p className="text-sm text-white/60">Últimos {monthsCount} meses</p>
              </div>
              <BarChart3 className="h-5 w-5 text-white/40" />
            </div>
            
            <div className="space-y-4">
              {monthlyRevenue.map((month, index) => {
                const percentage = maxMonthlyRevenue > 0 ? (month.revenue / maxMonthlyRevenue) * 100 : 0
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60 capitalize">{month.month}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white/40 text-xs">{month.orders} pedidos</span>
                        <span className="text-white font-semibold">
                          R$ {month.revenue.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-6">
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvMonthly)}`}
                download={`receita_mensal_${monthsCount}m.csv`}
                className="inline-flex items-center"
              >
                <Button variant="outline" className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV (mensal)
                </Button>
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Receita Diária</h2>
                <p className="text-sm text-white/60">Últimos {daysCount} dias</p>
              </div>
              <Calendar className="h-5 w-5 text-white/40" />
            </div>
            
            <div className="space-y-3">
              {dailyRevenue.map((day, index) => {
                const percentage = maxDailyRevenue > 0 ? (day.revenue / maxDailyRevenue) * 100 : 0
                
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{day.date} • {day.weekday}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs">{day.orders}</span>
                        <span className="text-white font-medium text-sm">
                          R$ {day.revenue.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/60 mb-1">Melhor Dia</p>
                <p className="text-lg font-bold text-white">R$ {(bestDay?.revenue || 0).toFixed(2).replace('.', ',')} • {bestDay?.date}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/60 mb-1">Pior Dia</p>
                <p className="text-lg font-bold text-white">R$ {(worstDay?.revenue || 0).toFixed(2).replace('.', ',')} • {worstDay?.date}</p>
              </div>
            </div>
            <div className="mt-6">
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvDaily)}`}
                download={`receita_diaria_${daysCount}d.csv`}
                className="inline-flex items-center"
              >
                <Button variant="outline" className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV (diário)
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Pedidos por Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <TrendingUp className="h-5 w-5 text-green-400" />
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
                    <Calendar className="h-5 w-5 text-yellow-400" />
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
                    <TrendingUp className="h-5 w-5 text-red-400 rotate-180" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Falhados</p>
                    <p className="text-2xl font-black text-red-400">{ordersByStatus.failed}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Top 5 Cursos Mais Vendidos</h2>
            <div className="space-y-3">
              {topCourses.length > 0 ? (
                topCourses.map((course, index) => (
                  <div key={course.courseId} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#8b5cf6] to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{course.title}</p>
                        <p className="text-xs text-white/60">{course.sales} venda{course.sales !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">
                        R$ {course.revenue.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/60 text-center py-8">Nenhum curso vendido ainda</p>
              )}
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
                    R$ {(method._sum.total || 0).toFixed(2).replace('.', ',')}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                    <span>{method._count.id} pedido{method._count.id !== 1 ? 's' : ''}</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

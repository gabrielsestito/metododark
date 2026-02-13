import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  Crown, 
  MessageCircle, 
  MessageSquare,
  Database,
  Bell,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  DollarSign,
  BarChart3,
  Zap
} from "lucide-react"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/")
  }

  const permissions = getPermissions(session.user.role)

  // Buscar todas as estatísticas em paralelo
  const [
    coursesCount,
    usersCount,
    ordersStats,
    totalRevenue,
    chatsStats,
    subscriptionsStats,
    enrollmentsCount,
    notificationsCount,
    recentOrders,
    recentChats,
    recentUsers,
    monthlyRevenue
  ] = await Promise.all([
    // Cursos
    permissions.canManageCourses ? prisma.course.count() : Promise.resolve(0),
    
    // Usuários
    permissions.canManageUsers ? prisma.user.count() : Promise.resolve(0),
    
    // Pedidos
    permissions.canViewOrders ? Promise.all([
      prisma.order.count({ where: { status: "completed" } }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "failed" } }),
      prisma.order.count(),
    ]).then(([completed, pending, failed, total]) => ({ completed, pending, failed, total })) : Promise.resolve({ completed: 0, pending: 0, failed: 0, total: 0 }),
    
    // Receita
    permissions.canViewFinancial ? prisma.order.aggregate({
      where: { status: "completed" },
      _sum: { total: true },
    }) : Promise.resolve({ _sum: { total: 0 } }),
    
    // Chats
    permissions.canManageChats ? Promise.all([
      prisma.chat.count(),
      prisma.chat.count({ where: { status: "open" } }),
      prisma.chat.count({ where: { status: "closed" } }),
      // Contar mensagens não respondidas (mensagens de usuários não lidas)
      prisma.chatMessage.count({
        where: {
          read: false,
          senderId: { not: null }, // Mensagens dos usuários
          chat: {
            status: { not: "closed" },
          },
        },
      }),
    ]).then(([total, open, closed, unreadMessages]) => ({ total, open, closed, unreadMessages })) : Promise.resolve({ total: 0, open: 0, closed: 0, unreadMessages: 0 }),
    
    // Assinaturas
    permissions.canManageSubscriptions ? Promise.all([
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.subscription.count(),
      prisma.subscriptionPlan.count({ where: { isActive: true } }),
    ]).then(([active, total, plans]) => ({ active, total, plans })) : Promise.resolve({ active: 0, total: 0, plans: 0 }),
    
    // Matrículas
    permissions.canManageCourses ? prisma.enrollment.count() : Promise.resolve(0),
    
    // Notificações (últimas 30 dias)
    permissions.canManageNotifications ? prisma.notification.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }) : Promise.resolve(0),
    
    // Pedidos recentes
    permissions.canViewOrders ? prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    }) : Promise.resolve([]),
    
    // Chats recentes
    permissions.canManageChats ? prisma.chat.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    }) : Promise.resolve([]),
    
    // Usuários recentes
    permissions.canManageUsers ? prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    }) : Promise.resolve([]),
    
    // Receita mensal (últimos 6 meses)
    permissions.canViewFinancial ? Promise.all([
      ...Array.from({ length: 6 }, (_, i) => {
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
            }
          },
          _sum: { total: true },
        }).then(result => ({
          month: date.toLocaleString('pt-BR', { month: 'short' }),
          revenue: result._sum.total || 0
        }))
      })
    ]).then(results => results.reverse()) : Promise.resolve([]),
  ])

  const ordersCount = ordersStats.completed || 0
  const pendingOrdersCount = ordersStats.pending || 0
  const failedOrdersCount = ordersStats.failed || 0

  // Cards principais de estatísticas
  const mainStats = [
    {
      title: "Receita Total",
      value: `R$ ${(totalRevenue._sum.total || 0).toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-600",
      href: "/admin/receita",
      subtitle: `${ordersStats.total || 0} pedido${ordersStats.total !== 1 ? 's' : ''} no total`,
      change: "+12.5%",
      changeType: "positive" as const,
    },
    {
      title: "Cursos",
      value: coursesCount,
      icon: BookOpen,
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
      href: "/admin/cursos",
      subtitle: `${enrollmentsCount} matrícula${enrollmentsCount !== 1 ? 's' : ''}`,
      change: "+3",
      changeType: "neutral" as const,
    },
    {
      title: "Usuários",
      value: usersCount,
      icon: Users,
      gradient: "from-blue-500 to-cyan-600",
      href: "/admin/usuarios",
      subtitle: `${subscriptionsStats.active} assinatura${subscriptionsStats.active !== 1 ? 's' : ''} ativa${subscriptionsStats.active !== 1 ? 's' : ''}`,
      change: "+8.2%",
      changeType: "positive" as const,
    },
    {
      title: "Pedidos",
      value: ordersCount,
      icon: ShoppingCart,
      gradient: "from-orange-500 to-red-600",
      href: "/admin/pedidos",
      subtitle: pendingOrdersCount > 0 ? `${pendingOrdersCount} pendente${pendingOrdersCount > 1 ? 's' : ''}` : "Todos processados",
      change: pendingOrdersCount > 0 ? `${pendingOrdersCount} pendente${pendingOrdersCount > 1 ? 's' : ''}` : "0 pendentes",
      changeType: pendingOrdersCount > 0 ? "warning" as const : "positive" as const,
    },
  ]

  // Cards secundários
  const secondaryStats = [
    {
      title: "Chats de Suporte",
      value: chatsStats.open,
      icon: MessageCircle,
      gradient: "from-purple-500 to-pink-600",
      href: "/admin/chats",
      subtitle: `${chatsStats.total} total`,
      total: chatsStats.total,
      unreadMessages: chatsStats.unreadMessages || 0,
    },
    {
      title: "Assinaturas",
      value: subscriptionsStats.active,
      icon: Crown,
      gradient: "from-yellow-500 to-orange-600",
      href: "/admin/assinatura",
      subtitle: `${subscriptionsStats.plans} plano${subscriptionsStats.plans !== 1 ? 's' : ''} ativo${subscriptionsStats.plans !== 1 ? 's' : ''}`,
      total: subscriptionsStats.total,
    },
    {
      title: "Notificações",
      value: notificationsCount,
      icon: Bell,
      gradient: "from-indigo-500 to-blue-600",
      href: "/admin/notificacoes",
      subtitle: "Últimos 30 dias",
    },
    {
      title: "Matrículas",
      value: enrollmentsCount,
      icon: GraduationCap,
      gradient: "from-teal-500 to-green-600",
      href: "/admin/cursos",
      subtitle: "Total de matrículas",
    },
  ]

  // Formatar data relativa
  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Agora"
    if (minutes < 60) return `${minutes}min atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-4">
              <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
              <span className="text-xs font-medium text-white/80">Painel Administrativo</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-white/60 text-base sm:text-lg">Visão geral da sua plataforma</p>
          </div>
          <Link href="/">
            <Button 
              variant="outline"
              className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white transition-all"
            >
              <span className="hidden sm:inline">Voltar ao Site</span>
              <span className="sm:hidden">Voltar</span>
            </Button>
          </Link>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Ações Rápidas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {permissions.canManageCourses && (
              <Link href="/admin/cursos">
                <Button variant="outline" className="w-full justify-start border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Gerenciar Cursos
                </Button>
              </Link>
            )}
            {permissions.canViewOrders && (
              <Link href="/admin/pedidos">
                <Button variant="outline" className="w-full justify-start border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ver Pedidos
                </Button>
              </Link>
            )}
            {permissions.canManageUsers && (
              <Link href="/admin/usuarios">
                <Button variant="outline" className="w-full justify-start border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Usuários
                </Button>
              </Link>
            )}
            {permissions.canManageChats && (
              <Link href="/admin/chats">
                <Button variant="outline" className="w-full justify-start border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chats de Suporte
                </Button>
              </Link>
            )}
            {permissions.canManageCourses && (
              <Link href="/admin/chats-grupo">
                <Button variant="outline" className="w-full justify-start border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Moderar Chats de Grupo
                </Button>
              </Link>
            )}
            {permissions.canManageNotifications && (
              <Link href="/admin/notificacoes">
                <Button variant="outline" className="w-full justify-start border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                  <Bell className="h-4 w-4 mr-2" />
                  Criar Notificação
                </Button>
              </Link>
            )}
            {permissions.canManageSubscriptions && (
              <Link href="/admin/assinatura">
                <Button variant="outline" className="w-full justify-start border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                  <Crown className="h-4 w-4 mr-2" />
                  Gerenciar Assinatura
                </Button>
              </Link>
            )}
            {permissions.canViewFinancial && (
              <Link href="/admin/financeiro">
                <Button variant="outline" className="w-full justify-start border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Financeiro
                </Button>
              </Link>
            )}
            {permissions.canBackupDatabase && (
              <Link href="/admin/backup">
                <Button variant="outline" className="w-full justify-start border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                  <Database className="h-4 w-4 mr-2" />
                  Backup do Banco
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid Principal */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => (
            <Link key={index} href={stat.href} className="group">
              <div className="relative bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer overflow-hidden">
                {/* Background gradient effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/60 mb-1">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-3xl font-black ${
                        stat.title === "Receita Total" 
                          ? "text-green-400" 
                          : "bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
                      }`}>
                        {stat.value}
                      </p>
                      {stat.change && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          stat.changeType === "positive" 
                            ? "bg-green-500/20 text-green-400" 
                            : stat.changeType === "warning"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {stat.change}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                {stat.subtitle && (
                  <p className="text-xs text-white/50 mb-3">{stat.subtitle}</p>
                )}
                
                <div className="flex items-center gap-2 text-xs text-white/40 group-hover:text-[#8b5cf6] transition-colors">
                  <span>Ver detalhes</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Grid Secundário */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryStats.map((stat, index) => (
            <Link key={index} href={stat.href} className="group">
              <div className="relative bg-[#0f0f0f] border border-white/5 rounded-lg p-5 hover:border-white/10 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                    {stat.total !== undefined && (
                      <p className="text-xs text-white/40">{stat.total} total</p>
                    )}
                  </div>
                </div>
                
                <p className="text-sm font-medium text-white/80 mb-1">{stat.title}</p>
                {stat.subtitle && (
                  <p className="text-xs text-white/50">{stat.subtitle}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Gráfico de Receita e Atividades Recentes */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Gráfico de Receita Mensal */}
          {permissions.canViewFinancial && monthlyRevenue.length > 0 && (
            <div className="lg:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Receita Mensal</h2>
                  <p className="text-sm text-white/60">Últimos 6 meses</p>
                </div>
                <BarChart3 className="h-5 w-5 text-white/40" />
              </div>
              
              <div className="space-y-4">
                {monthlyRevenue.map((month, index) => {
                  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue))
                  const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60 capitalize">{month.month}</span>
                        <span className="text-white font-semibold">
                          R$ {month.revenue.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status da Plataforma */}
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Status</h2>
                <p className="text-sm text-white/60">Sistema</p>
              </div>
              <Activity className="h-5 w-5 text-green-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Sistema Operacional</p>
                  <p className="text-xs text-white/60">Tudo funcionando</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Zap className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Performance</p>
                  <p className="text-xs text-white/60">Ótima</p>
                </div>
              </div>
              
              {pendingOrdersCount > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Atenção</p>
                    <p className="text-xs text-white/60">{pendingOrdersCount} pedido{pendingOrdersCount > 1 ? 's' : ''} pendente{pendingOrdersCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
              
              {chatsStats.open > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <MessageCircle className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Chats Abertos</p>
                    <p className="text-xs text-white/60">{chatsStats.open} aguardando</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pedidos Recentes */}
          {permissions.canViewOrders && recentOrders.length > 0 && (
            <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Pedidos Recentes</h2>
                  <p className="text-sm text-white/60">Últimas transações</p>
                </div>
                <Link href="/admin/pedidos">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    Ver todos
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {order.user?.name || order.user?.email || "Usuário"}
                      </p>
                      <p className="text-xs text-white/50">
                        R$ {order.total.toFixed(2).replace('.', ',')} • {formatRelativeTime(order.createdAt)}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === "completed" 
                        ? "bg-green-500/20 text-green-400"
                        : order.status === "pending"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {order.status === "completed" ? "Concluído" : order.status === "pending" ? "Pendente" : "Falhou"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chats Recentes */}
          {permissions.canManageChats && recentChats.length > 0 && (
            <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Chats Recentes</h2>
                  <p className="text-sm text-white/60">Últimas conversas</p>
                </div>
                <Link href="/admin/chats">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    Ver todos
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentChats.map((chat) => (
                  <Link key={chat.id} href={`/admin/chats?chatId=${chat.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {chat.user?.name || chat.user?.email || "Usuário"}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {chat.subject} • {formatRelativeTime(chat.updatedAt)}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        chat.status === "open" 
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}>
                        {chat.status === "open" ? "Aberto" : "Fechado"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Usuários Recentes */}
          {permissions.canManageUsers && recentUsers.length > 0 && (
            <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Usuários Recentes</h2>
                  <p className="text-sm text-white/60">Novos cadastros</p>
                </div>
                <Link href="/admin/usuarios">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    Ver todos
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <Link key={user.id} href={`/admin/usuarios`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-purple-600 flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user.name || user.email || "Usuário"}
                        </p>
                        <p className="text-xs text-white/50">
                          {formatRelativeTime(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        
      </div>
    </div>
  )
}

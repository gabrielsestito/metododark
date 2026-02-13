"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notifySuccess, notifyError } from "@/lib/notifications"
import { confirm } from "@/lib/confirm"
import { 
  User, 
  Crown, 
  ShoppingBag, 
  Bell, 
  Settings, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
  Save,
  Eye,
  EyeOff,
  BookOpen,
  PlayCircle,
  TrendingUp,
  Clock,
  Award,
  Sparkles,
  Mail,
  Lock
} from "lucide-react"
import Link from "next/link"

export default function PerfilPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState<"perfil" | "assinatura" | "pedidos" | "notificacoes">("perfil")
  const [showPassword, setShowPassword] = useState(false)
  
  // Dados do perfil
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    password: "",
    confirmPassword: "",
  })

  // Dados de assinatura
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  
  // Histórico de pedidos
  const [orders, setOrders] = useState<any[]>([])

  // Estatísticas do usuário
  const [stats, setStats] = useState<{
    totalCourses: number
    totalLessons: number
    completedLessons: number
    averageProgress: number
    recentCourses: Array<{ id: string; title: string; slug: string; imageUrl: string | null }>
    totalWatchTime: number
  } | null>(null)

  // Notificações
  const [notifications, setNotifications] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    try {
      // Buscar dados de assinatura
      const subResponse = await fetch("/api/subscription")
      const subData = await subResponse.json()
      setSubscriptionData(subData)

      // Buscar histórico de pedidos
      const ordersResponse = await fetch("/api/orders")
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData)
      }

      // Buscar estatísticas
      const statsResponse = await fetch("/api/user/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Buscar notificações
      const notificationsResponse = await fetch("/api/notifications")
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json()
        setNotifications(notificationsData.slice(0, 10))
      }

      // Atualizar dados do perfil
      setProfileData({
        name: session?.user?.name || "",
        email: session?.user?.email || "",
        password: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setFetching(false)
    }
  }, [session?.user?.name, session?.user?.email])

  useEffect(() => {
    if (session?.user) {
      fetchData()
    } else if (session === null) {
      // Se não houver sessão, redirecionar para login
      router.push("/login")
    }
  }, [session, fetchData, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          password: profileData.password || undefined,
        }),
      })

      if (response.ok) {
        await update()
        await notifySuccess("Perfil atualizado", "Perfil atualizado com sucesso!")
        setProfileData({ ...profileData, password: "", confirmPassword: "" })
      } else {
        const data = await response.json()
        await notifyError("Erro", data.error || "Erro ao atualizar perfil")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      await notifyError("Erro", "Erro ao atualizar perfil")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    const confirmed = await confirm({
      title: "Cancelar Assinatura",
      description: "Tem certeza que deseja cancelar sua assinatura? Você perderá o acesso a todos os cursos ao final do período atual.",
      confirmText: "Cancelar Assinatura",
      cancelText: "Manter Assinatura",
      variant: "warning",
    })
    
    if (!confirmed) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      })

      if (response.ok) {
        await notifySuccess("Assinatura cancelada", "Assinatura cancelada com sucesso. Você continuará com acesso até o fim do período atual.")
        fetchData()
      } else {
        const data = await response.json()
        await notifyError("Erro", data.error || "Erro ao cancelar assinatura")
      }
    } catch (error) {
      console.error("Error canceling subscription:", error)
      await notifyError("Erro", "Erro ao cancelar assinatura")
    } finally {
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
  const subscription = subscriptionData?.subscription
  const plan = subscriptionData?.plan

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header com efeito gradiente */}
        <div className="mb-8 relative">
          <Link href="/app">
            <Button 
              variant="ghost" 
              className="mb-6 text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#8b5cf6]/20 via-purple-500/20 to-[#8b5cf6]/20 blur-3xl opacity-50"></div>
            <div className="relative bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-purple-500/20 border border-[#8b5cf6]/30 mb-4">
                    <Settings className="h-4 w-4 text-[#8b5cf6]" />
                    <span className="text-sm font-medium text-white/80">Configurações</span>
                  </div>
                  <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-3 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                    Meu Perfil
                  </h1>
                  <p className="text-white/60 text-lg">
                    Gerencie suas informações, assinatura e preferências
                  </p>
                </div>
                
                {/* Avatar/Estatísticas rápidas */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8b5cf6] to-purple-600 flex items-center justify-center text-2xl font-black border-4 border-white/10 shadow-lg">
                    {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  {stats && (
                    <div className="hidden md:block">
                      <p className="text-2xl font-black text-white">{stats.averageProgress}%</p>
                      <p className="text-xs text-white/60">Progresso</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#7c3aed]/20 border border-[#8b5cf6]/30 backdrop-blur-sm hover:border-[#8b5cf6]/50 transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-[#8b5cf6]/30 border border-[#8b5cf6]/50">
                  <BookOpen className="h-6 w-6 text-[#8b5cf6]" />
                </div>
                <Sparkles className="h-5 w-5 text-[#8b5cf6]/60 group-hover:animate-pulse" />
              </div>
              <p className="text-4xl font-black text-white mb-1">{stats.totalCourses}</p>
              <p className="text-sm text-white/70 font-medium">Cursos</p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 backdrop-blur-sm hover:border-blue-500/50 transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-blue-500/30 border border-blue-500/50">
                  <PlayCircle className="h-6 w-6 text-blue-400" />
                </div>
                <TrendingUp className="h-5 w-5 text-blue-400/60 group-hover:animate-pulse" />
              </div>
              <p className="text-4xl font-black text-white mb-1">{stats.completedLessons}</p>
              <p className="text-sm text-white/70 font-medium">Aulas Concluídas</p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm hover:border-green-500/50 transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-green-500/30 border border-green-500/50">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <Award className="h-5 w-5 text-green-400/60 group-hover:animate-pulse" />
              </div>
              <p className="text-4xl font-black text-white mb-1">{stats.averageProgress}%</p>
              <p className="text-sm text-white/70 font-medium">Progresso Médio</p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 backdrop-blur-sm hover:border-orange-500/50 transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-orange-500/30 border border-orange-500/50">
                  <Clock className="h-6 w-6 text-orange-400" />
                </div>
                <Sparkles className="h-5 w-5 text-orange-400/60 group-hover:animate-pulse" />
              </div>
              <p className="text-4xl font-black text-white mb-1">{stats.totalWatchTime}</p>
              <p className="text-sm text-white/70 font-medium">Aulas Assistidas</p>
            </div>
          </div>
        )}

        {/* Tabs com animação */}
        <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide pb-2">
          {[
            { id: "perfil", label: "Perfil", icon: User },
            { id: "assinatura", label: "Assinatura", icon: Crown },
            { id: "pedidos", label: "Pedidos", icon: ShoppingBag },
            { id: "notificacoes", label: "Notificações", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl border transition-all whitespace-nowrap group ${
                  isActive
                    ? "bg-gradient-to-r from-[#8b5cf6] to-purple-600 border-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/30"
                    : "bg-[#0a0a0a] border-white/10 text-white/80 hover:bg-white/5 hover:text-white hover:border-white/20"
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                <span className="font-semibold">{tab.label}</span>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 blur-xl -z-10"></div>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Perfil Tab */}
          {activeTab === "perfil" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Card de Informações Pessoais */}
              <Card className="lg:col-span-2 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#8b5cf6]/30 to-purple-600/30 border border-[#8b5cf6]/50">
                      <User className="h-6 w-6 text-[#8b5cf6]" />
                    </div>
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white/90 font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome Completo
                      </Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                        className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 transition-all h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/90 font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                        className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 transition-all h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white/90 font-semibold flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Nova Senha
                        <span className="text-xs text-white/50 font-normal">(deixe vazio para não alterar)</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={profileData.password}
                          onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                          className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 pr-12 transition-all h-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {profileData.password && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-white/90 font-semibold">Confirmar Nova Senha</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={profileData.confirmPassword}
                          onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                          className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 transition-all h-12"
                        />
                        {profileData.password !== profileData.confirmPassword && profileData.confirmPassword && (
                          <p className="text-sm text-red-400 flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            As senhas não coincidem
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || !!(profileData.password && profileData.password !== profileData.confirmPassword)}
                      className="w-full bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/30 h-12 text-base font-semibold transition-all hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-5 w-5" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Card de Cursos Recentes */}
              {stats?.recentCourses && stats.recentCourses.length > 0 && (
                <Card className="bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                        <BookOpen className="h-5 w-5 text-blue-400" />
                      </div>
                      Cursos Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.recentCourses.map((course) => (
                        <Link
                          key={course.id}
                          href={`/curso/${course.slug}`}
                          className="group block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#8b5cf6]/50 hover:bg-white/10 transition-all"
                        >
                          {course.imageUrl && (
                            <div className="w-full h-24 mb-3 rounded-lg overflow-hidden bg-white/5 relative">
                              <Image
                                src={course.imageUrl}
                                alt={course.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                unoptimized
                              />
                            </div>
                          )}
                          <p className="font-semibold text-white group-hover:text-[#8b5cf6] transition-colors line-clamp-2 text-sm">
                            {course.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Assinatura Tab */}
          {activeTab === "assinatura" && (
            <div className="space-y-6">
              {hasActiveSubscription && subscription ? (
                <Card className="bg-gradient-to-br from-green-500/10 via-[#0a0a0a] to-[#0a0a0a] border border-green-500/30 shadow-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl text-white flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-green-500/30 border border-green-500/50">
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        </div>
                        Assinatura Ativa
                      </CardTitle>
                      <div className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 animate-pulse">
                        <span className="text-sm font-bold text-green-400">● ATIVA</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <p className="text-sm text-white/60 mb-2">Plano Atual</p>
                        <p className="text-2xl font-bold text-white flex items-center gap-2">
                          <Crown className="h-6 w-6 text-[#8b5cf6]" />
                          {plan?.name || "Assinatura Mensal"}
                        </p>
                      </div>
                      <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <p className="text-sm text-white/60 mb-2">Valor Mensal</p>
                        <p className="text-3xl font-black text-white">
                          R$ {plan?.price?.toFixed(2).replace('.', ',') || "0,00"}
                        </p>
                      </div>
                    </div>
                    
                    {subscription.currentPeriodEnd && (
                      <div className="p-6 rounded-xl bg-gradient-to-r from-[#8b5cf6]/10 to-purple-500/10 border border-[#8b5cf6]/20">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-[#8b5cf6]/30 border border-[#8b5cf6]/50">
                            <Calendar className="h-6 w-6 text-[#8b5cf6]" />
                          </div>
                          <div>
                            <p className="text-sm text-white/60 mb-1">Próxima Cobrança</p>
                            <p className="text-xl font-bold text-white">
                              {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-white/10">
                      <Button
                        onClick={handleCancelSubscription}
                        disabled={loading}
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/70 transition-all h-12 text-base font-semibold"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-2 h-5 w-5" />
                            Cancelar Assinatura
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-[#8b5cf6]/30 border border-[#8b5cf6]/50">
                        <Crown className="h-6 w-6 text-[#8b5cf6]" />
                      </div>
                      Assinatura
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-8 rounded-xl bg-gradient-to-r from-[#8b5cf6]/10 to-purple-500/10 border border-[#8b5cf6]/20 text-center">
                      <Crown className="h-16 w-16 text-[#8b5cf6] mx-auto mb-4" />
                      <p className="text-white/80 mb-6 text-lg">
                        Você não possui uma assinatura ativa. Assine agora e tenha acesso a todos os cursos!
                      </p>
                      <Link href="/subscription">
                        <Button className="bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/30 h-12 px-8 text-base font-semibold transition-all hover:scale-105">
                          <Crown className="mr-2 h-5 w-5" />
                          Assinar Agora
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Pedidos Tab */}
          {activeTab === "pedidos" && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/30 border border-blue-500/50">
                      <ShoppingBag className="h-6 w-6 text-blue-400" />
                    </div>
                    Histórico de Compras
                  </CardTitle>
                  <p className="text-sm text-white/60 mt-2">
                    Veja todas as suas compras de cursos individuais. Assinaturas aparecem na aba &quot;Assinatura&quot;.
                  </p>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-white/20" />
                      </div>
                      <p className="text-white/60 mb-2 font-semibold text-lg">Nenhuma compra encontrada</p>
                      <p className="text-sm text-white/40 mb-8">
                        Quando você comprar cursos individuais, eles aparecerão aqui
                      </p>
                      <Link href="/cursos">
                        <Button className="bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/30 h-12 px-8 text-base font-semibold transition-all hover:scale-105">
                          Explorar Cursos
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-[#8b5cf6]/30 hover:shadow-xl transition-all"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                  <ShoppingBag className="h-5 w-5 text-white/60" />
                                </div>
                                <div>
                                  <p className="font-bold text-white text-lg">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                                  <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <span
                                  className={`ml-auto text-xs px-3 py-1.5 rounded-full font-bold ${
                                    order.status === "completed"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : order.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                  }`}
                                >
                                  {order.status === "completed" ? "✓ Concluído" : order.status === "pending" ? "⏳ Pendente" : "✗ Falhou"}
                                </span>
                              </div>
                              
                              {order.items && order.items.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                  <p className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-[#8b5cf6]" />
                                    Cursos comprados:
                                  </p>
                                  <div className="space-y-2">
                                    {order.items.map((item: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                        <Link 
                                          href={`/curso/${item.course?.slug || '#'}`}
                                          className="flex items-center gap-3 flex-1 group"
                                        >
                                          <div className="w-2 h-2 rounded-full bg-[#8b5cf6] group-hover:scale-125 transition-transform" />
                                          <span className="text-white/90 group-hover:text-[#8b5cf6] transition-colors font-medium">
                                            {item.course?.title || "Curso removido"}
                                          </span>
                                        </Link>
                                        <span className="text-white font-bold">
                                          R$ {item.price.toFixed(2).replace('.', ',')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="lg:text-right lg:min-w-[160px]">
                              <p className="text-sm text-white/60 mb-2">Total do Pedido</p>
                              <div className="p-4 rounded-xl bg-gradient-to-br from-[#8b5cf6]/20 to-purple-500/20 border border-[#8b5cf6]/30">
                                <p className="text-3xl font-black text-white">
                                  R$ {order.total.toFixed(2).replace('.', ',')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Info sobre assinatura */}
              {orders.length > 0 && (
                <Card className="bg-gradient-to-r from-[#8b5cf6]/10 via-purple-500/10 to-[#8b5cf6]/10 border border-[#8b5cf6]/30 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-[#8b5cf6]/30 border border-[#8b5cf6]/50 flex-shrink-0">
                        <Crown className="h-6 w-6 text-[#8b5cf6]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-[#8b5cf6]" />
                          💡 Dica: Assinatura Mensal
                        </p>
                        <p className="text-sm text-white/70 mb-4">
                          Com uma assinatura mensal, você tem acesso a todos os cursos por um preço fixo. 
                          Economize comprando a assinatura!
                        </p>
                        <Link href="/subscription">
                          <Button 
                            className="bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/30 transition-all hover:scale-105"
                          >
                            <Crown className="mr-2 h-4 w-4" />
                            Ver Assinatura
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Notificações Tab */}
          {activeTab === "notificacoes" && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-[#8b5cf6]/30 border border-[#8b5cf6]/50">
                        <Bell className="h-6 w-6 text-[#8b5cf6]" />
                      </div>
                      Minhas Notificações
                    </CardTitle>
                    <Link href="/app/notificacoes">
                      <Button variant="outline" size="sm" className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                        Ver Todas
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <div className="text-center py-16">
                      <Bell className="h-16 w-16 text-white/20 mx-auto mb-4" />
                      <p className="text-white/60 mb-2 font-semibold">Nenhuma notificação</p>
                      <p className="text-sm text-white/40">
                        Suas notificações aparecerão aqui
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-5 rounded-xl border transition-all hover:scale-[1.02] ${
                            notification.read
                              ? "bg-white/5 border-white/10"
                              : "bg-gradient-to-r from-[#8b5cf6]/10 to-purple-500/10 border-[#8b5cf6]/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-bold text-white mb-2 text-lg">{notification.title}</p>
                              <p className="text-sm text-white/70 mb-3">{notification.message}</p>
                              <div className="flex items-center gap-2 text-xs text-white/50">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(notification.createdAt).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                            {!notification.read && (
                              <div className="w-3 h-3 rounded-full bg-[#8b5cf6] flex-shrink-0 mt-1 animate-pulse"></div>
                            )}
                          </div>
                          {notification.courseSlug && (
                            <Link href={`/curso/${notification.courseSlug}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-4 text-[#8b5cf6] hover:text-[#7c3aed] hover:bg-[#8b5cf6]/10"
                              >
                                Ver Curso
                              </Button>
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

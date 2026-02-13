"use client"

import { useState, useMemo } from "react"
import { User as UserIcon, BookOpen, Calendar, Search, MessageCircle, Mail, Crown, Filter, X, Grid3x3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserDetailsModal } from "@/components/admin/user-details-modal"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  enrollments: Array<{
    id: string
    expiresAt: Date | null
    createdAt: Date
    course: {
      id: string
      title: string
      slug: string
    }
  }>
  subscription?: {
    id: string
    status: string
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
  } | null
}

export function AdminUsuariosClient({ initialUsers }: { initialUsers: User[] }) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()

  const filteredUsers = useMemo(() => {
    return initialUsers.filter((user) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch = 
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.role?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false
      }

      // Subscription filter
      if (subscriptionFilter === "active" && (!user.subscription || user.subscription.status !== "active")) {
        return false
      }
      if (subscriptionFilter === "none" && user.subscription) {
        return false
      }

      return true
    })
  }, [initialUsers, search, roleFilter, subscriptionFilter])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (roleFilter !== "all") count++
    if (subscriptionFilter !== "all") count++
    return count
  }, [roleFilter, subscriptionFilter])

  const handleOpenChat = async (userId: string, userEmail: string) => {
    try {
      // Primeiro, buscar chats existentes
      const response = await fetch(`/api/admin/chats?search=${encodeURIComponent(userEmail)}`)
      const chats = await response.json()
      
      // Procurar chat aberto ou em progresso
      const openChat = chats.find((chat: any) => 
        (chat.status === "open" || chat.status === "in_progress") && 
        chat.userId === userId
      )
      
      if (openChat) {
        // Se existe chat aberto, redirecionar para ele
        router.push(`/admin/chats?chatId=${openChat.id}`)
      } else {
        // Se não existe, criar um novo chat
        const createResponse = await fetch("/api/admin/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })
        
        if (createResponse.ok) {
          const newChat = await createResponse.json()
          router.push(`/admin/chats?chatId=${newChat.id}`)
        } else {
          // Se falhar ao criar, redirecionar mesmo assim (o componente tentará criar)
          router.push(`/admin/chats?userId=${userId}`)
        }
      }
    } catch (error) {
      console.error("Error opening chat:", error)
      // Em caso de erro, redirecionar para a página de chats
      router.push(`/admin/chats?userId=${userId}`)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "CEO":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "ADMIN":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "ASSISTANT":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "FINANCIAL":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      default:
        return "bg-white/10 text-white/80 border-white/20"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "CEO": return "CEO"
      case "ADMIN": return "Admin"
      case "ASSISTANT": return "Assistente"
      case "FINANCIAL": return "Financeiro"
      case "STUDENT": return "Estudante"
      default: return role
    }
  }

  const clearFilters = () => {
    setRoleFilter("all")
    setSubscriptionFilter("all")
    setSearch("")
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, email ou cargo..."
            className="pl-9 pr-9 bg-[#0a0a0a] border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6]/50 h-10 sm:h-11 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={`border-white/10 text-white/60 hover:bg-white/5 h-10 sm:h-11 ${
              viewMode === "grid" ? "bg-[#8b5cf6]/10 border-[#8b5cf6]/50 text-[#8b5cf6]" : ""
            }`}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("list")}
            className={`border-white/10 text-white/60 hover:bg-white/5 h-10 sm:h-11 ${
              viewMode === "list" ? "bg-[#8b5cf6]/10 border-[#8b5cf6]/50 text-[#8b5cf6]" : ""
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`border-white/10 text-white/60 hover:bg-white/5 h-10 sm:h-11 ${
            showFilters || activeFiltersCount > 0 ? "bg-[#8b5cf6]/10 border-[#8b5cf6]/50 text-[#8b5cf6]" : ""
          }`}
        >
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#8b5cf6] text-white text-[10px] font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 rounded-lg bg-[#0a0a0a] border border-white/10 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Filtros</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-white/60 hover:text-white h-7"
              >
                Limpar filtros
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-xs text-white/60">Cargo</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="bg-[#0a0a0a] border-white/10 text-white h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Todos os cargos" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10">
                  <SelectItem value="all" className="text-white focus:bg-[#8b5cf6]">Todos</SelectItem>
                  <SelectItem value="STUDENT" className="text-white focus:bg-[#8b5cf6]">Estudante</SelectItem>
                  <SelectItem value="ADMIN" className="text-white focus:bg-[#8b5cf6]">Admin</SelectItem>
                  <SelectItem value="CEO" className="text-white focus:bg-[#8b5cf6]">CEO</SelectItem>
                  <SelectItem value="ASSISTANT" className="text-white focus:bg-[#8b5cf6]">Assistente</SelectItem>
                  <SelectItem value="FINANCIAL" className="text-white focus:bg-[#8b5cf6]">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/60">Assinatura</label>
              <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                <SelectTrigger className="bg-[#0a0a0a] border-white/10 text-white h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Todas as assinaturas" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10">
                  <SelectItem value="all" className="text-white focus:bg-[#8b5cf6]">Todas</SelectItem>
                  <SelectItem value="active" className="text-white focus:bg-[#8b5cf6]">Com Assinatura</SelectItem>
                  <SelectItem value="none" className="text-white focus:bg-[#8b5cf6]">Sem Assinatura</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Badges */}
      {(roleFilter !== "all" || subscriptionFilter !== "all") && (
        <div className="flex flex-wrap gap-2">
          {roleFilter !== "all" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 text-xs text-[#8b5cf6]">
              <span>Cargo: {getRoleLabel(roleFilter)}</span>
              <button
                onClick={() => setRoleFilter("all")}
                className="hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {subscriptionFilter !== "all" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 text-xs text-[#8b5cf6]">
              <span>Assinatura: {subscriptionFilter === "active" ? "Ativa" : "Sem assinatura"}</span>
              <button
                onClick={() => setSubscriptionFilter("all")}
                className="hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-xs sm:text-sm text-white/60">
        {filteredUsers.length} {filteredUsers.length === 1 ? "usuário encontrado" : "usuários encontrados"}
      </div>

      {/* Users Grid/List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg sm:rounded-xl p-8 sm:p-12 text-center">
          <div className="inline-block p-4 sm:p-6 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 mb-4">
            <UserIcon className="h-8 w-8 sm:h-12 sm:w-12 text-blue-400" />
          </div>
          <p className="text-white/60 text-sm sm:text-lg mb-2">
            {search || roleFilter !== "all" || subscriptionFilter !== "all" 
              ? "Nenhum usuário encontrado" 
              : "Nenhum usuário cadastrado"}
          </p>
          {(search || roleFilter !== "all" || subscriptionFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-4 border-white/10 text-white/60 hover:bg-white/5"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="group bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/5 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 hover:border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
            >
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-lg sm:text-xl font-black text-white">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold mb-1 group-hover:text-blue-400 transition-colors truncate">
                    {user.name || "Sem nome"}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-white/60 truncate flex items-center gap-1">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div>
                  <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60 p-1.5 sm:p-2 rounded-lg bg-white/5">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-blue-400" />
                    <span>{user.enrollments.length} curso{user.enrollments.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  {user.subscription && user.subscription.status === "active" && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60 p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-[#8b5cf6]/10 to-purple-600/10 border border-[#8b5cf6]/20">
                      <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">Assinante Ativo</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/40 p-1.5 sm:p-2 rounded-lg bg-white/5">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>
                      {new Date(user.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-2 sm:pt-3 space-y-2 border-t border-white/5">
                  <Button
                    onClick={() => handleOpenChat(user.id, user.email)}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 text-xs sm:text-sm h-8 sm:h-9"
                    size="sm"
                  >
                    <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Abrir Chat
                  </Button>
                  <UserDetailsModal user={user} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="group bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/5 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-white/10 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-lg sm:text-xl font-black text-white">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold mb-1 group-hover:text-blue-400 transition-colors truncate">
                      {user.name || "Sem nome"}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-white/60 truncate flex items-center gap-1 mb-2">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-white/60">
                        <BookOpen className="h-3 w-3 flex-shrink-0 text-blue-400" />
                        <span>{user.enrollments.length} curso{user.enrollments.length !== 1 ? 's' : ''}</span>
                      </div>
                      {user.subscription && user.subscription.status === "active" && (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-yellow-400">
                          <Crown className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium">Assinante</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={() => handleOpenChat(user.id, user.email)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 text-xs sm:text-sm h-8 sm:h-9"
                    size="sm"
                  >
                    <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Chat
                  </Button>
                  <UserDetailsModal user={user} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

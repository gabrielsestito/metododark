"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Info, BookOpen, Sparkles, GraduationCap, ArrowLeft, Clock, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button"
import { notifySuccess, notifyError } from "@/lib/notifications"
import { confirm } from "@/lib/confirm"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  course?: {
    slug: string
    title: string
  }
  createdAt: Date
}

export default function NotificacoesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) {
      router.push("/login")
      return
    }
    fetchNotifications()
  }, [session, router])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Excluir Notificação",
      description: "Tem certeza que deseja excluir esta notificação?",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      variant: "destructive",
    })
    
    if (!confirmed) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        await notifySuccess("Notificação excluída", "A notificação foi removida com sucesso")
      } else {
        await notifyError("Erro", "Não foi possível excluir a notificação")
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      await notifyError("Erro", "Erro ao excluir notificação")
    } finally {
      setDeleting(null)
    }
  }

  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {}
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt)
      let groupKey: string

      if (date >= today) {
        groupKey = "Hoje"
      } else if (date >= yesterday) {
        groupKey = "Ontem"
      } else {
        groupKey = date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(notification)
    })

    return groups
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "Agora"
    if (minutes < 60) return `${minutes}m atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "course_update":
        return <BookOpen className="h-4 w-4 text-[#8b5cf6]" />
      case "new_course":
        return <GraduationCap className="h-4 w-4 text-[#8b5cf6]" />
      case "subscription_active":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "admin_notice":
        return <Sparkles className="h-4 w-4 text-blue-400" />
      default:
        return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b5cf6]" />
      </div>
    )
  }

  const groupedNotifications = groupNotificationsByDate(notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/app">
            <Button 
              variant="ghost" 
              className="mb-4 text-white/60 hover:text-white hover:bg-white/5 h-9"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-3">
                <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
                <span className="text-xs font-medium text-white/80">Notificações</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Notificações
              </h1>
              {unreadCount > 0 && (
                <p className="text-white/60 text-sm">
                  {unreadCount} {unreadCount === 1 ? "não lida" : "não lidas"}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <MarkAllReadButton onUpdate={fetchNotifications} />
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-6">
          {notifications.length === 0 ? (
            <Card className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/10">
              <CardContent className="p-12 sm:p-16 text-center">
                <div className="inline-block p-4 rounded-full bg-gradient-to-br from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-4">
                  <Sparkles className="h-12 w-12 text-[#8b5cf6]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Nenhuma notificação</h2>
                <p className="text-white/60 text-sm">Você está em dia!</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
              <div key={dateGroup} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                    <Clock className="h-3.5 w-3.5 text-[#8b5cf6]" />
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                      {dateGroup}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>
                
                {/* Notifications */}
                {groupNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border transition-all hover:border-white/20 ${
                      !notification.read 
                        ? "border-[#8b5cf6]/30 bg-[#8b5cf6]/5" 
                        : "border-white/10"
                    } ${deleting === notification.id ? "opacity-50" : ""}`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h3 className={`font-semibold text-sm sm:text-base ${
                                !notification.read ? "text-white" : "text-white/80"
                              }`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-[#8b5cf6] flex-shrink-0" />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              disabled={deleting === notification.id}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0 flex-shrink-0"
                            >
                              {deleting === notification.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                          
                          <p className="text-white/70 text-sm mb-3 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {notification.course && (
                              <Link href={`/app/curso/${notification.course.slug}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#8b5cf6] hover:text-[#7c3aed] hover:bg-[#8b5cf6]/10 text-xs h-7"
                                >
                                  <BookOpen className="h-3 w-3 mr-1.5" />
                                  {notification.course.title}
                                </Button>
                              </Link>
                            )}
                            {!notification.read && (
                              <form
                                action={`/api/notifications/${notification.id}/read`}
                                method="POST"
                                className="inline"
                              >
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="sm"
                                  className="text-white/50 hover:text-white/80 hover:bg-white/10 text-xs h-7"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1.5" />
                                  Marcar como lida
                                </Button>
                              </form>
                            )}
                          </div>
                          
                          <p className="text-xs text-white/40 flex items-center gap-1.5 mt-3">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

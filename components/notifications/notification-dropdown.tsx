"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Info, BookOpen, Sparkles, GraduationCap, X, Clock, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  courseId: string | null
  courseSlug?: string | null
  createdAt: Date
}

interface NotificationDropdownProps {
  onClose: () => void
  onRead: () => void
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
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

const playNotificationSound = () => {
  if (typeof window === "undefined") return
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContext()
    
    const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = "sine"
      
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + duration)
    }
    
    playTone(600, audioContext.currentTime, 0.1, 0.15)
    playTone(800, audioContext.currentTime + 0.1, 0.1, 0.12)
  } catch (error) {
    // Silenciar erros
  }
}

export function NotificationDropdown({
  onClose,
  onRead,
}: NotificationDropdownProps) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const previousCountRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch("/api/notifications")
      const data = await response.json()
      const newCount = data.filter((n: Notification) => !n.read).length
      
      if (newCount > previousCountRef.current && previousCountRef.current > 0) {
        playNotificationSound()
      }
      
      previousCountRef.current = newCount
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (!session?.user?.id) return

    fetchNotifications()
    
    const unreadCount = notifications.filter((n) => !n.read).length
    const pollInterval = unreadCount > 0 ? 10000 : 30000
    
    intervalRef.current = setInterval(fetchNotifications, pollInterval)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, notifications.length, fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      onRead()
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      onRead()
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        onRead()
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    } finally {
      setDeleting(null)
    }
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

  const unreadCount = notifications.filter((n) => !n.read).length
  const groupedNotifications = groupNotificationsByDate(notifications)

  return (
    <>
      {/* Overlay para mobile */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="fixed md:absolute right-0 top-14 md:top-full mt-0 md:mt-2 w-full md:w-[380px] max-w-[calc(100vw-1rem)] md:max-w-none z-50">
        <div className="bg-[#0f0f0f] border border-white/10 shadow-2xl rounded-lg md:rounded-xl overflow-hidden flex flex-col h-[calc(100vh-3.5rem)] md:h-auto md:max-h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Sparkles className="h-4 w-4 text-[#8b5cf6] flex-shrink-0" />
              <h3 className="font-semibold text-white text-sm truncate">Notificações</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#8b5cf6] text-white text-xs font-medium flex-shrink-0">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#8b5cf6] hover:text-[#7c3aed] h-7 px-2 hidden sm:inline-flex"
                >
                  Todas
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#8b5cf6] border-t-transparent mb-3"></div>
                  <p className="text-white/60 text-sm">Carregando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <Sparkles className="h-10 w-10 text-[#8b5cf6]/30 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
                  <div key={dateGroup}>
                    {/* Date Header */}
                    <div className="sticky top-0 bg-[#0f0f0f]/95 backdrop-blur-sm px-3 sm:px-4 py-2 border-b border-white/5 z-10">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-white/40 flex-shrink-0" />
                        <span className="text-xs font-medium text-white/50 uppercase truncate">
                          {dateGroup}
                        </span>
                      </div>
                    </div>
                    
                    {/* Notifications */}
                    {groupNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 sm:p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                          !notification.read ? "bg-[#8b5cf6]/5" : ""
                        }`}
                      >
                        <div className="flex gap-2 sm:gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`text-sm font-medium flex-1 min-w-0 ${!notification.read ? "text-white" : "text-white/70"}`}>
                                <span className="line-clamp-1">{notification.title}</span>
                              </h4>
                              {!notification.read && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            
                            <p className="text-xs text-white/60 line-clamp-2 mb-2 leading-relaxed">
                              {notification.message}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span className="text-xs text-white/40">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                              
                              <div className="flex gap-1 flex-wrap">
                                {(notification.courseId || notification.courseSlug) && (
                                  <Link
                                    href={`/app/curso/${notification.courseSlug || notification.courseId}`}
                                    onClick={onClose}
                                    className="flex-shrink-0"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-[#8b5cf6] hover:text-[#7c3aed] h-7 px-2"
                                    >
                                      Ver
                                    </Button>
                                  </Link>
                                )}
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs text-white/40 hover:text-white/70 h-7 px-2 flex-shrink-0"
                                  >
                                    ✓
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(notification.id)}
                                  disabled={deleting === notification.id}
                                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2 flex-shrink-0"
                                >
                                  {deleting === notification.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

          {/* Footer - Sempre visível */}
          {notifications.length > 0 && (
            <div className="flex-shrink-0 p-3 border-t border-white/10 bg-[#0f0f0f]">
              <Link href="/app/notificacoes" className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-[#8b5cf6] hover:text-[#7c3aed] hover:bg-[#8b5cf6]/10 text-xs sm:text-sm font-medium w-full h-9 sm:h-8"
                >
                  Ver todas as notificações
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

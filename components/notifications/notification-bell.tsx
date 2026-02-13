"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "./notification-dropdown"

export function NotificationBell() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const previousCountRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications/unread-count", {
          cache: "no-store",
        })
        const data = await response.json()
        const newCount = data.count || 0
        
        // Se o contador aumentou, significa que há nova notificação
        if (newCount > previousCountRef.current && previousCountRef.current > 0) {
          // Animar o badge
          const badge = document.querySelector('[data-notification-badge]')
          if (badge) {
            badge.classList.add('animate-bounce')
            setTimeout(() => badge.classList.remove('animate-bounce'), 1000)
          }
        }
        
        previousCountRef.current = newCount
        setUnreadCount(newCount)
      } catch (error) {
        console.error("Error fetching unread count:", error)
      }
    }

    fetchUnreadCount()
    
    // Polling adaptativo: mais frequente quando há notificações não lidas
    const pollInterval = unreadCount > 0 ? 15000 : 45000 // 15s se houver não lidas, 45s caso contrário
    
    intervalRef.current = setInterval(fetchUnreadCount, pollInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session, unreadCount])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-notification-container]')) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  if (!session) return null

  return (
    <div className="relative" data-notification-container>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={`text-white/80 hover:text-white hover:bg-white/5 relative h-9 w-9 transition-all ${
          isOpen ? "bg-white/10 text-white" : ""
        }`}
      >
        <Bell className={`h-5 w-5 transition-transform ${isOpen ? "scale-110" : ""}`} />
        {mounted && unreadCount > 0 && (
          <span
            data-notification-badge
            className="absolute -top-1 -right-1 bg-[#8b5cf6] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg shadow-[#8b5cf6]/50"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          onRead={() => {
            setUnreadCount((prev) => Math.max(0, prev - 1))
            previousCountRef.current = Math.max(0, previousCountRef.current - 1)
          }}
        />
      )}
    </div>
  )
}


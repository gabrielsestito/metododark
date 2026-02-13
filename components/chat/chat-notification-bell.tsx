"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function ChatNotificationBell() {
  const { data: session } = useSession()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const playNotificationSound = () => {
    if (typeof window === "undefined") return
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContext()
      
      // Som tipo WhatsApp - "pop" característico
      const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = frequency
        oscillator.type = "sine"
        
        // Envelope tipo "pop" - rápido e suave
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      }
      
      // Som tipo WhatsApp - dois "pops" rápidos
      playTone(800, audioContext.currentTime, 0.08, 0.2)
      playTone(1000, audioContext.currentTime + 0.1, 0.08, 0.15)
    } catch (error) {
      // Silenciar erros de áudio
    }
  }

  useEffect(() => {
    if (!session?.user?.id || session.user.role !== "ADMIN") return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/chat/unread-count")
        const data = await response.json()
        const count = data.count || 0
        
        setUnreadCount((prevCount) => {
          // Se o contador aumentou, tocar som
          if (count > prevCount && prevCount >= 0) {
            playNotificationSound()
          }
          return count
        })
      } catch (error) {
        console.error("Error fetching unread chat count:", error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 8000) // Verificar a cada 8 segundos

    return () => clearInterval(interval)
  }, [session?.user?.id, session?.user?.role])

  if (!session || session.user.role !== "ADMIN") return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/admin/chats")}
        className="text-white/80 hover:text-white hover:bg-white/5 relative h-9 w-9"
      >
        <MessageCircle className="h-5 w-5" />
        {mounted && unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center shadow-2xl border-[3px] border-white/30 px-1.5 ring-2 ring-red-500/50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </div>
  )
}


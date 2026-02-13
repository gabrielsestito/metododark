"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { MessageCircle, X } from "lucide-react"
import { ChatModal } from "./chat-modal"

export function ChatButton() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [previousUnreadCount, setPreviousUnreadCount] = useState<number | null>(null)
  const isAdminArea = pathname?.startsWith("/admin")

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

  // Zerar contador quando entrar na área do admin
  useEffect(() => {
    if (isAdminArea) {
      setUnreadCount(0)
      setPreviousUnreadCount(null)
    }
  }, [isAdminArea])

  // Verificar mensagens não lidas (não verificar na área do admin)
  useEffect(() => {
    if (!session?.user?.id || isOpen || isAdminArea) return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/chat/unread-count")
        const data = await response.json()
        const count = data.count || 0
        
        setUnreadCount((prevCount) => {
          // Só tocar som se o contador aumentou E já tinha um valor anterior (não é primeira carga)
          if (previousUnreadCount !== null && count > previousUnreadCount) {
            playNotificationSound()
          }
          setPreviousUnreadCount(count)
          return count
        })
      } catch (error) {
        console.error("Error fetching unread count:", error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 8000) // Verificar a cada 8 segundos

    return () => clearInterval(interval)
  }, [session?.user?.id, isOpen, isAdminArea, previousUnreadCount])

  // Atualizar contador quando fechar o chat
  useEffect(() => {
    if (!isOpen && session?.user?.id) {
      // Quando fechar o chat, verificar novamente o contador
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch("/api/chat/unread-count")
          const data = await response.json()
          setUnreadCount(data.count || 0)
        } catch (error) {
          console.error("Error fetching unread count:", error)
        }
      }
      fetchUnreadCount()
    }
  }, [isOpen, session?.user?.id])

  // Não mostrar o botão para admins ou na área do admin
  const isAdminRole = session?.user?.role && ["ASSISTANT", "ADMIN", "FINANCIAL", "CEO"].includes(session.user.role)
  if (isAdminRole || isAdminArea) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group touch-manipulation"
        aria-label="Abrir chat de suporte"
      >
        <div className="relative flex items-center animate-fade-in-up">
          <div className="relative bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white text-xs sm:text-xs font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-l-full shadow-lg whitespace-nowrap border-r border-white/20 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            <span className="relative inline-block z-10 text-xs sm:text-xs">Precisa de ajuda?</span>
          </div>
          
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-r-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group-hover:rotate-6 flex-shrink-0 -ml-1 overflow-visible">
            {unreadCount > 0 && !isAdminArea && (
              <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white text-xs font-black rounded-full min-w-[20px] h-[20px] sm:min-w-[22px] sm:h-[22px] flex items-center justify-center z-30 shadow-2xl border-[2px] sm:border-[3px] border-white/30 px-1 sm:px-1.5 ring-2 ring-red-500/50 text-[10px] sm:text-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-110 z-10">
              <Image
                src="/logo.png"
                alt="Método Dark"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <div className="absolute inset-0 rounded-r-full bg-[#8b5cf6] opacity-0 group-hover:opacity-20 group-hover:animate-ping transition-opacity duration-300"></div>
          </div>
        </div>
      </button>

      {isOpen && <ChatModal onClose={() => setIsOpen(false)} />}
    </>
  )
}

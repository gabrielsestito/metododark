"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  MessageCircle, 
  Search, 
  X, 
  Send, 
  Loader2, 
  User, 
  BookOpen, 
  Play, 
  UserCheck, 
  UserX, 
  Paperclip, 
  Download,
  Filter,
  ChevronLeft,
  Menu,
  Clock,
  Check,
  CheckCheck,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { notifyError, notifySuccess } from "@/lib/notifications"

const SUBJECT_LABELS: Record<string, string> = {
  DUVIDA_CURSO: "Dúvida sobre curso",
  PROBLEMA_TECNICO: "Problema técnico",
  DUVIDA_PAGAMENTO: "Dúvida sobre pagamento",
  SUGESTAO: "Sugestão",
  OUTRO: "Outro",
}

interface ChatMessage {
  id: string
  chatId: string
  senderId: string | null
  content: string
  attachmentUrl: string | null
  attachmentName: string | null
  isSystem: boolean
  read: boolean
  readAt: string | null
  createdAt: string
}

interface ChatUser {
  id: string
  name: string
  email: string
}

interface ChatCourse {
  id: string
  title: string
}

interface ChatLesson {
  id: string
  title: string
}

interface ChatAdmin {
  id: string
  name: string
  email: string
}

interface Chat {
  id: string
  userId: string
  assignedTo: string | null
  subject: string
  description: string | null
  status: string
  courseId: string | null
  lessonId: string | null
  createdAt: string
  updatedAt: string
  user: ChatUser
  assignedAdmin: ChatAdmin | null
  course: ChatCourse | null
  lesson: ChatLesson | null
  messages: ChatMessage[]
  _count: {
    messages: number
  }
  unreadCount: number
}

export function AdminChatsClient({ 
  initialChats,
  initialChatId,
  initialUserId,
  userRole,
}: { 
  initialChats: any[]
  initialChatId?: string
  initialUserId?: string
  userRole?: string
}) {
  const [chats, setChats] = useState<Chat[]>(initialChats)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(() => {
    if (initialChatId) {
      const found = initialChats.find(c => c.id === initialChatId)
      return found && found.user ? found : null
    }
    return null
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "closed">("all")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newMessageNotification, setNewMessageNotification] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
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
      
      playTone(800, audioContext.currentTime, 0.08, 0.2)
      playTone(1000, audioContext.currentTime + 0.1, 0.08, 0.15)
    } catch (error) {
      // Silenciar erros
    }
  }

  const loadMessages = useCallback(async (chatId: string, shouldScroll: boolean = false) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`)
      if (response.ok) {
        const data = await response.json()
        
        setMessages((prevMessages) => {
          const currentMessageIds = new Set(prevMessages.map(m => m.id))
          const newMessageIds = new Set(data.map((m: ChatMessage) => m.id))
          const hasNewMessages = data.length > prevMessages.length || 
            Array.from(newMessageIds).some((id) => !currentMessageIds.has(id as string))
          
          if (hasNewMessages && prevMessages.length > 0) {
            const newMessages = data.filter((m: ChatMessage) => !currentMessageIds.has(m.id))
            const userMessage = newMessages.find((m: ChatMessage) => m.senderId !== null)
            if (userMessage && typeof window !== "undefined") {
              playNotificationSound()
              setNewMessageNotification("Nova mensagem recebida!")
              setTimeout(() => setNewMessageNotification(null), 3000)
            }
          }
          
          if (shouldScroll && (hasNewMessages || prevMessages.length === 0)) {
            setTimeout(() => {
              scrollToBottom()
            }, 100)
          }
          
          return data
        })
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }, [])

  const checkTypingStatus = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/typing`)
      if (response.ok) {
        const data = await response.json()
        if (data.typing && data.userId !== "staff") {
          setTypingIndicator(data.userName || "Usuário")
        } else {
          setTypingIndicator(null)
        }
      }
    } catch (error) {
      // Silenciar erros
    }
  }, [])

  const sendTypingIndicator = async (chatId: string, typing: boolean) => {
    try {
      await fetch(`/api/chat/${chatId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typing }),
      })
    } catch (error) {
      // Silenciar erros de digitação
    }
  }

  useEffect(() => {
    if (initialChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === initialChatId)
      if (chat && chat.user) {
        setSelectedChat(chat)
        setShowSidebar(false)
      }
    } else if (initialUserId) {
      // Procurar chat existente (incluindo fechados para reabrir se necessário)
      const userChat = chats.find(c => c.userId === initialUserId && (c.status === "open" || c.status === "in_progress"))
      if (userChat && userChat.user) {
        setSelectedChat(userChat)
        setShowSidebar(false)
      } else if (chats.length > 0) {
        // Se já carregou os chats mas não encontrou, criar novo
        const createChat = async () => {
          try {
            setLoading(true)
            const response = await fetch("/api/admin/chats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: initialUserId }),
            })
            
            if (response.ok) {
              const newChat = await response.json()
              // Adicionar o novo chat à lista
              setChats(prev => [newChat, ...prev])
              setSelectedChat(newChat)
              setShowSidebar(false)
            } else {
              const error = await response.json()
              console.error("Error creating chat:", error)
            }
          } catch (error) {
            console.error("Error creating chat:", error)
          } finally {
            setLoading(false)
          }
        }
        createChat()
      }
      // Se chats ainda não foram carregados, aguardar
    }
  }, [initialChatId, initialUserId, chats])

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id, true)
      const interval = setInterval(() => {
        loadMessages(selectedChat.id, false)
        checkTypingStatus(selectedChat.id)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedChat, loadMessages, checkTypingStatus])

  useEffect(() => {
    if (newMessage.trim() && selectedChat) {
      setIsTyping(true)
      sendTypingIndicator(selectedChat.id, true)
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        sendTypingIndicator(selectedChat.id, false)
      }, 3000)
    } else if (selectedChat) {
      setIsTyping(false)
      sendTypingIndicator(selectedChat.id, false)
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [newMessage, selectedChat])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        await notifyError("Arquivo muito grande", "O tamanho máximo permitido é 10MB.")
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedChat || sending) return

    setSending(true)
    try {
      let attachmentUrl: string | null = null
      let attachmentName: string | null = null

      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)
        formData.append("chatId", selectedChat.id)

        const uploadResponse = await fetch("/api/chat/upload", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          attachmentUrl = uploadData.url
          attachmentName = selectedFile.name
        } else {
          throw new Error("Erro ao fazer upload do arquivo")
        }
      }

      const response = await fetch(`/api/chat/${selectedChat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage.trim() || (selectedFile ? `Arquivo: ${selectedFile.name}` : ""),
          attachmentUrl,
          attachmentName,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem")
      }

      await loadMessages(selectedChat.id, true)
      setNewMessage("")
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      refreshChats()
    } catch (error) {
      console.error("Error sending message:", error)
      await notifyError("Erro ao enviar mensagem", "Não foi possível enviar a mensagem. Tente novamente.")
    } finally {
      setSending(false)
    }
  }

  const refreshChats = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/admin/chats?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setChats(data)
        
        if (selectedChat) {
          const updatedChat = data.find((c: Chat) => c.id === selectedChat.id)
          if (updatedChat) {
            setSelectedChat({
              ...selectedChat,
              ...updatedChat,
              user: updatedChat.user || selectedChat.user || { id: "", name: "Usuário desconhecido", email: "" },
              assignedAdmin: updatedChat.assignedAdmin || selectedChat.assignedAdmin || null,
              course: updatedChat.course || selectedChat.course || null,
              lesson: updatedChat.lesson || selectedChat.lesson || null,
            })
          } else {
            // Se o chat não foi encontrado na lista atualizada, significa que foi deletado
            setSelectedChat(null)
            setShowSidebar(true)
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing chats:", error)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/admin/chats?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setChats(data)
      }
    } catch (error) {
      console.error("Error searching chats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/assign`, {
        method: "POST",
      })

      if (response.ok) {
        await notifySuccess("Ticket assumido", "Você assumiu este ticket com sucesso!")
        refreshChats()
        if (selectedChat?.id === chatId) {
          const updatedChat = await response.json()
          setSelectedChat({
            ...selectedChat,
            ...updatedChat,
            user: updatedChat.user || selectedChat.user,
            assignedAdmin: updatedChat.assignedAdmin,
            course: updatedChat.course || selectedChat.course,
            lesson: updatedChat.lesson || selectedChat.lesson,
          })
        }
      }
    } catch (error) {
      console.error("Error assigning chat:", error)
    }
  }

  const handleUnassignChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/assign`, {
        method: "DELETE",
      })

      if (response.ok) {
        await notifySuccess("Ticket liberado", "Ticket liberado com sucesso!")
        refreshChats()
        if (selectedChat?.id === chatId) {
          const updatedChat = await response.json()
          setSelectedChat({
            ...selectedChat,
            ...updatedChat,
            user: updatedChat.user || selectedChat.user,
            assignedAdmin: updatedChat.assignedAdmin,
            course: updatedChat.course || selectedChat.course,
            lesson: updatedChat.lesson || selectedChat.lesson,
          })
        }
      }
    } catch (error) {
      console.error("Error unassigning chat:", error)
    }
  }

  const getMessageStatus = (message: ChatMessage, isAdminMessage: boolean) => {
    if (!isAdminMessage) return null
    if (message.read) return "read"
    return "delivered"
  }

  const handleCloseChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      })

      if (response.ok) {
        await notifySuccess("Chat fechado", "Chat fechado com sucesso!")
        refreshChats()
        if (selectedChat?.id === chatId) {
          setSelectedChat(null)
          setShowSidebar(true)
        }
      }
    } catch (error) {
      console.error("Error closing chat:", error)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este chat? Esta ação não pode ser desfeita e todas as mensagens serão perdidas.")) {
      return
    }

    try {
      // Tentar primeiro com DELETE, se falhar usar POST como alternativa
      let response = await fetch(`/api/chat/${chatId}`, {
        method: "DELETE",
      })
      
      // Se receber 405, tentar com a rota alternativa POST
      if (response.status === 405) {
        response = await fetch(`/api/chat/${chatId}/delete`, {
          method: "POST",
        })
      }

      // Verificar se há conteúdo na resposta antes de tentar fazer parse
      const contentType = response.headers.get("content-type")
      let data: any = null
      
      if (contentType && contentType.includes("application/json")) {
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch (parseError) {
            console.error("Error parsing JSON:", parseError, "Response text:", text)
          }
        }
      }

      if (response.ok) {
        // Remover o chat da lista localmente imediatamente
        setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId))
        
        // Se o chat deletado estava selecionado, limpar seleção
        if (selectedChat?.id === chatId) {
          setSelectedChat(null)
          setShowSidebar(true)
        }
        
        await notifySuccess("Chat deletado", "Chat deletado com sucesso!")
        
        // Recarregar a lista de chats do servidor
        await refreshChats()
      } else {
        const errorMsg = data?.error || `Erro ${response.status}: ${response.statusText}` || "Não foi possível deletar o chat."
        console.error("Delete error:", errorMsg, data, response.status)
        await notifyError("Erro ao deletar", errorMsg)
      }
    } catch (error: any) {
      console.error("Error deleting chat:", error)
      await notifyError("Erro ao deletar", error.message || "Erro ao deletar o chat. Tente novamente.")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return "Hoje"
    } else if (days === 1) {
      return "Ontem"
    } else if (days < 7) {
      return `${days} dias atrás`
    } else {
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  const filteredChats = chats.filter((chat) => {
    if (statusFilter !== "all" && chat.status !== statusFilter) return false
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        (chat.user?.name?.toLowerCase().includes(searchLower) || false) ||
        (chat.user?.email?.toLowerCase().includes(searchLower) || false) ||
        (chat.description && chat.description.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  return (
    <div className="flex h-[calc(100vh-250px)] lg:h-[calc(100vh-300px)] bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden">
      {/* Sidebar - Lista de chats */}
      <div 
        className={`${
          showSidebar ? "flex" : "hidden"
        } lg:flex flex-col w-full lg:w-96 border-r border-white/5 bg-[#0a0a0a] transition-all duration-300`}
      >
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-[#8b5cf6]/10 to-purple-600/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#8b5cf6]" />
              Chats
            </h2>
            <div className="text-xs text-white/60">
              {filteredChats.length} {filteredChats.length === 1 ? 'chat' : 'chats'}
            </div>
          </div>

          {/* Busca */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
              placeholder="Pesquisar chats..."
              className="pl-9 bg-[#0f0f0f] border-white/10 text-white placeholder:text-white/40 h-10"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "open", "in_progress", "closed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status)
                  handleSearch()
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === status
                    ? status === "all"
                      ? "bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/30"
                      : status === "open"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : status === "in_progress"
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                    : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                }`}
              >
                {status === "all" ? "Todos" : status === "open" ? "Abertos" : status === "in_progress" ? "Em Andamento" : "Fechados"}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de chats */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nenhum chat encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    if (chat.user) {
                      setSelectedChat(chat)
                      setShowSidebar(false)
                    }
                  }}
                  className={`w-full text-left p-4 hover:bg-white/5 transition-all ${
                    selectedChat?.id === chat.id ? "bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border-l-2 border-[#8b5cf6]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex-shrink-0">
                      <User className="h-4 w-4 text-[#8b5cf6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-white truncate text-sm">
                          {chat.user?.name || "Usuário desconhecido"}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="bg-[#8b5cf6] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 ml-2">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 truncate mb-1">{chat.user?.email || ""}</p>
                      {/* Informações do Curso/Aula */}
                      {(chat.course || chat.lesson) && (
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {chat.course && (
                            <div className="flex items-center gap-1 text-[10px] text-white/50">
                              <BookOpen className="h-2.5 w-2.5 text-[#8b5cf6]" />
                              <span className="truncate max-w-[150px]">{chat.course.title}</span>
                            </div>
                          )}
                          {chat.lesson && (
                            <div className="flex items-center gap-1 text-[10px] text-white/50">
                              <Play className="h-2.5 w-2.5 text-[#8b5cf6]" />
                              <span className="truncate max-w-[150px]">{chat.lesson.title}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {chat.messages[0] && (
                        <p className="text-xs text-white/50 truncate mb-2">
                          {chat.messages[0].content}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          chat.status === "open"
                            ? "bg-green-500/20 text-green-400"
                            : chat.status === "in_progress"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {chat.status === "open" ? "Aberto" : chat.status === "in_progress" ? "Em andamento" : "Fechado"}
                        </span>
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(chat.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Área principal - Chat */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a] relative">
        {selectedChat ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-[#0f0f0f] to-[#0a0a0a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => {
                      setShowSidebar(true)
                      setSelectedChat(null)
                    }}
                    className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-white/60" />
                  </button>
                  <div className="p-2 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/30">
                    <User className="h-5 w-5 text-[#8b5cf6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{selectedChat.user?.name || "Usuário desconhecido"}</h3>
                    <p className="text-xs text-white/60 truncate">{selectedChat.user?.email || ""}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {SUBJECT_LABELS[selectedChat.subject] || selectedChat.subject}
                    </p>
                    {/* Informações do Curso/Aula */}
                    {(selectedChat.course || selectedChat.lesson) && (
                      <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
                        {selectedChat.course && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <BookOpen className="h-3 w-3 text-[#8b5cf6] flex-shrink-0" />
                            <span className="text-white/50">Curso:</span>
                            <span className="text-white/80 font-medium truncate">{selectedChat.course.title}</span>
                          </div>
                        )}
                        {selectedChat.lesson && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Play className="h-3 w-3 text-[#8b5cf6] flex-shrink-0" />
                            <span className="text-white/50">Aula:</span>
                            <span className="text-white/80 font-medium truncate">{selectedChat.lesson.title}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedChat.assignedAdmin ? (
                    <Button
                      onClick={() => handleAssignChat(selectedChat.id)}
                      size="sm"
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 h-9"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Assumir</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUnassignChat(selectedChat.id)}
                      size="sm"
                      variant="outline"
                      className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 h-9"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Liberar</span>
                    </Button>
                  )}
                  {(selectedChat.status === "open" || selectedChat.status === "in_progress") && (
                    <Button
                      onClick={() => handleCloseChat(selectedChat.id)}
                      size="sm"
                      variant="outline"
                      className="border-white/10 text-white/80 hover:bg-white/5 h-9"
                    >
                      Fechar
                    </Button>
                  )}
                  {userRole === "CEO" && (
                    <Button
                      onClick={() => handleDeleteChat(selectedChat.id)}
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Notificação de nova mensagem */}
            {newMessageNotification && (
              <div className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-purple-600 text-white text-sm font-semibold text-center animate-pulse">
                {newMessageNotification}
              </div>
            )}

            {/* Área de mensagens */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center text-white/60">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="font-semibold">Nenhuma mensagem ainda</p>
                    <p className="text-sm mt-2">Envie a primeira mensagem para começar</p>
                  </div>
                </div>
              )}
              {messages.map((message, index) => {
                const isAdmin = message.senderId === null && !message.isSystem
                const isSystem = message.isSystem || false
                const messageStatus = getMessageStatus(message, isAdmin)
                const prevMessage = index > 0 ? messages[index - 1] : null
                const showDateSeparator = !prevMessage || 
                  new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString()
                
                if (isSystem) {
                  return (
                    <div key={message.id} className="flex justify-center my-4">
                      <div className="max-w-[85%]">
                        <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
                          <p className="text-xs font-semibold text-yellow-400 mb-1">Sistema</p>
                          <p className="text-sm text-white/90 whitespace-pre-wrap">{message.content}</p>
                          <p className="text-[10px] text-white/40 mt-2">
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                          <span className="text-xs text-white/60">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-2xl p-3 ${
                            isAdmin
                              ? "bg-gradient-to-br from-[#8b5cf6] to-purple-600 text-white rounded-tr-sm"
                              : "bg-white/5 text-white/90 border border-white/10 rounded-tl-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          {message.attachmentUrl && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              <a
                                href={message.attachmentUrl}
                                download={message.attachmentName || "arquivo"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs hover:underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{message.attachmentName || "Anexo"}</span>
                                <Download className="h-3 w-3 ml-auto" />
                              </a>
                            </div>
                          )}
                          <div className={`flex items-center gap-2 mt-2 ${isAdmin ? "justify-end" : "justify-start"}`}>
                            <p className="text-[10px] opacity-60">
                              {formatMessageTime(message.createdAt)}
                            </p>
                            {isAdmin && messageStatus && (
                              <div className="flex items-center">
                                {messageStatus === "read" ? (
                                  <CheckCheck className="h-3 w-3 text-white/90" />
                                ) : (
                                  <Check className="h-3 w-3 text-white/70" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Indicador de digitação */}
            {typingIndicator && (
              <div className="px-4 py-2 border-t border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="h-2 w-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="h-2 w-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                  <p className="text-xs text-white/60 italic">
                    {typingIndicator} está digitando...
                  </p>
                </div>
              </div>
            )}

            {/* Input de mensagem */}
            <div className="p-4 border-t border-white/5 bg-[#0f0f0f]">
              {selectedFile && (
                <div className="mb-3 flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                  <Paperclip className="h-4 w-4 text-white/60" />
                  <span className="text-xs text-white/80 truncate flex-1">{selectedFile.name}</span>
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                    className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={selectedChat.status === "closed"}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedChat.status === "closed"}
                  className="border-white/10 text-white/60 hover:bg-white/5 h-10 w-10 p-0"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  disabled={selectedChat.status === "closed"}
                  className="flex-1 bg-[#0a0a0a] border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 h-10"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || sending || selectedChat.status === "closed"}
                  className="bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-10 w-10 p-0 shadow-lg shadow-[#8b5cf6]/30"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/60">
            <div className="text-center">
              <MessageCircle className="h-20 w-20 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">Selecione um chat</p>
              <p className="text-sm">Escolha um chat da lista para começar a conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

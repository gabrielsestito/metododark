"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { X, Send, Loader2, MessageCircle, Paperclip, Download, Check, CheckCheck, Clock, BookOpen, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { notifyError } from "@/lib/notifications"

type ChatSubject = "DUVIDA_CURSO" | "PROBLEMA_TECNICO" | "DUVIDA_PAGAMENTO" | "SUGESTAO" | "OUTRO"

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

interface ChatCourse {
  id: string
  title: string
}

interface ChatLesson {
  id: string
  title: string
}

interface Chat {
  id: string
  userId: string
  subject: ChatSubject
  description: string | null
  status: string
  courseId: string | null
  lessonId: string | null
  createdAt: string
  updatedAt: string
  course: ChatCourse | null
  lesson: ChatLesson | null
}

const SUBJECT_OPTIONS = [
  { value: "DUVIDA_CURSO", label: "Dúvida sobre curso" },
  { value: "PROBLEMA_TECNICO", label: "Problema técnico" },
  { value: "DUVIDA_PAGAMENTO", label: "Dúvida sobre pagamento" },
  { value: "SUGESTAO", label: "Sugestão" },
  { value: "OUTRO", label: "Outro" },
]

export function ChatModal({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession()
  const [step, setStep] = useState<"form" | "chat">("form")
  const [subject, setSubject] = useState<ChatSubject | "">("")
  const [description, setDescription] = useState("")
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [loadingChats, setLoadingChats] = useState(true)
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newMessageNotification, setNewMessageNotification] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      // Silenciar erros de áudio
    }
  }

  const loadMessages = useCallback(async (chatId: string, shouldScroll: boolean = true) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`)
      if (response.ok) {
        const data = await response.json()
        
        // Usar função de atualização para evitar dependência de messages
        setMessages((prevMessages) => {
          // Só atualizar se houver mudanças (evitar re-renders desnecessários)
          const currentMessageIds = new Set(prevMessages.map(m => m.id))
          const hasNewMessages = data.length > prevMessages.length || 
            data.some((m: ChatMessage) => !currentMessageIds.has(m.id))
          
          // Se houver novas mensagens do admin, mostrar notificação
          if (hasNewMessages && prevMessages.length > 0) {
            const newMessages = data.filter((m: ChatMessage) => !currentMessageIds.has(m.id))
            const adminMessage = newMessages.find((m: ChatMessage) => m.senderId === null)
            if (adminMessage) {
              playNotificationSound()
              setNewMessageNotification("Nova mensagem do admin!")
              setTimeout(() => setNewMessageNotification(null), 3000)
            }
          }
          
          // Scroll automático apenas se solicitado e houver novas mensagens ou se for a primeira carga
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
        if (data.typing && data.userId === "staff") {
          setTypingIndicator(data.userName || "Admin")
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

  const loadExistingChats = useCallback(async () => {
    try {
      const response = await fetch("/api/chat")
      if (response.ok) {
        const chats = await response.json()
        // Se houver um chat aberto ou em andamento, abrir ele
        const openChat = chats.find((c: Chat) => c.status === "open" || c.status === "in_progress")
        if (openChat) {
          setChat(openChat)
          setStep("chat")
          loadMessages(openChat.id, true) // true = fazer scroll na primeira carga
        }
      }
    } catch (error) {
      console.error("Error loading chats:", error)
    } finally {
      setLoadingChats(false)
    }
  }, [loadMessages])

  // Carregar chats existentes ao abrir o modal
  useEffect(() => {
    if (session?.user) {
      loadExistingChats()
    } else {
      setLoadingChats(false)
    }
  }, [session, loadExistingChats])

  // Polling de mensagens quando estiver no chat (menos agressivo)
  useEffect(() => {
    if (step === "chat" && chat) {
      const interval = setInterval(() => {
        loadMessages(chat.id, false) // false = não fazer scroll automático
        checkTypingStatus(chat.id) // Verificar se alguém está digitando
      }, 5000) // Aumentado para 5 segundos
      return () => clearInterval(interval)
    }
  }, [step, chat, loadMessages, checkTypingStatus])

  // Indicador de digitação
  useEffect(() => {
    if (newMessage.trim() && chat && step === "chat") {
      sendTypingIndicator(chat.id, true)
      
      // Limpar timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Parar de digitar após 3 segundos sem digitar
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(chat.id, false)
      }, 3000)
    } else if (chat && step === "chat") {
      sendTypingIndicator(chat.id, false)
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [newMessage, chat, step])

  const handleStartChat = async () => {
    if (!subject || !session?.user) return

    setLoading(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          description: description.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar chat")
      }

      const newChat = await response.json()
      setChat(newChat)
      setStep("chat")
      
      // Aguardar um pouco para garantir que a mensagem inicial foi criada
      await new Promise(resolve => setTimeout(resolve, 500))
      loadMessages(newChat.id, true) // true = fazer scroll na primeira carga
    } catch (error) {
      console.error("Error creating chat:", error)
      await notifyError("Erro ao iniciar chat", "Não foi possível iniciar o chat. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Função para agrupar mensagens por data
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {}
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    messages.forEach((message) => {
      const date = new Date(message.createdAt)
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
      groups[groupKey].push(message)
    })

    return groups
  }

  // Função para obter o status da mensagem (sent, delivered, read)
  const getMessageStatus = (message: ChatMessage, isCurrentUser: boolean) => {
    if (!isCurrentUser || message.isSystem) return null
    
    // Se a mensagem foi lida (tem readAt)
    if (message.read && message.readAt) {
      return "read" // 2 checks azuis - lida
    }
    
    // Sempre retornar "delivered" para mensagens do usuário
    // Mesmo que não tenha sido lida ainda, ela foi entregue ao servidor
    return "delivered" // 1 check cinza - entregue mas não lida
  }


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Limitar tamanho a 10MB
      if (file.size > 10 * 1024 * 1024) {
        await notifyError("Arquivo muito grande", "O tamanho máximo permitido é 10MB.")
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !chat || sending) return

    setSending(true)
    try {
      let attachmentUrl: string | null = null
      let attachmentName: string | null = null

      // Upload do arquivo se houver
      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)
        formData.append("chatId", chat.id)

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

      const response = await fetch(`/api/chat/${chat.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim() || (selectedFile ? `Arquivo: ${selectedFile.name}` : ""),
          attachmentUrl,
          attachmentName,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem")
      }

      // Recarregar mensagens do servidor para garantir sincronização
      await loadMessages(chat.id, true)
      setNewMessage("")
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error sending message:", error)
      await notifyError("Erro ao enviar mensagem", "Não foi possível enviar a mensagem. Tente novamente.")
    } finally {
      setSending(false)
    }
  }

  // Se não estiver logado, mostrar formulário de login
  if (!session) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/10 max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Chat de Suporte</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-white/60 mb-4">
            Você precisa estar logado para usar o chat. Faça login ou cadastre-se para continuar.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/10 text-white/80 hover:bg-white/5"
            >
              Fechar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
      <Card className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/10 w-full h-full sm:h-[600px] sm:max-w-2xl flex flex-col rounded-none sm:rounded-lg">
        {/* Header */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between p-4 sm:p-4 border-b border-white/10">
            <div className="flex items-center gap-2 sm:gap-2">
              <MessageCircle className="h-6 w-6 sm:h-5 sm:w-5 text-[#8b5cf6]" />
              <h2 className="text-xl sm:text-xl font-bold text-white">Chat de Suporte</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-2 sm:p-1 touch-manipulation"
            >
              <X className="h-6 w-6 sm:h-5 sm:w-5" />
            </button>
          </div>
          
          {/* Informações do Curso/Aula */}
          {chat && (chat.course || chat.lesson) && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-[#8b5cf6]/10 to-purple-600/10 border-b border-white/5">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                {chat.course && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#8b5cf6] flex-shrink-0" />
                    <span className="text-white/60">Curso:</span>
                    <span className="text-white font-medium">{chat.course.title}</span>
                  </div>
                )}
                {chat.lesson && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#8b5cf6] flex-shrink-0" />
                    <span className="text-white/60">Aula:</span>
                    <span className="text-white font-medium">{chat.lesson.title}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loadingChats ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-[#8b5cf6]" />
            </div>
          ) : step === "form" ? (
            <div className="p-4 sm:p-6 h-full flex flex-col overflow-y-auto">
              <h3 className="text-lg sm:text-lg font-semibold text-white mb-4">
                Como podemos ajudar?
              </h3>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-base sm:text-sm font-medium text-white/80 mb-3">
                    Selecione o assunto
                  </label>
                  <div className="space-y-2.5">
                    {SUBJECT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSubject(option.value as ChatSubject)}
                        className={`w-full text-left p-4 sm:p-3 rounded-lg border transition-all touch-manipulation text-base sm:text-sm ${
                          subject === option.value
                            ? "border-[#8b5cf6] bg-[#8b5cf6]/10 text-white"
                            : "border-white/10 bg-[#0a0a0a] text-white/80 hover:border-white/20"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-base sm:text-sm font-medium text-white/80 mb-3">
                    Descreva sua necessidade (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Conte-nos mais sobre o que você precisa..."
                    className="w-full p-4 sm:p-3 rounded-lg border border-white/10 bg-[#0a0a0a] text-white placeholder:text-white/40 focus:outline-none focus:border-[#8b5cf6] resize-none text-base sm:text-sm"
                    rows={4}
                  />
                  {description && (
                    <p className="text-xs text-white/50 mt-2">
                      Esta descrição será enviada como sua primeira mensagem no chat
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleStartChat}
                disabled={!subject || loading}
                className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 mt-4 h-12 sm:h-11 text-base touch-manipulation"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    Iniciando chat...
                  </>
                ) : (
                  "Iniciar Conversa"
                )}
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Notificação de nova mensagem */}
              {newMessageNotification && (
                <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white text-xs sm:text-sm font-semibold text-center animate-pulse">
                  {newMessageNotification}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-4">
                {/* Mensagem informativa inicial */}
                {messages.length === 0 && (
                  <div className="flex justify-center py-4">
                    <div className="max-w-[95%] sm:max-w-[80%] rounded-lg p-4 sm:p-4 bg-gradient-to-br from-[#8b5cf6]/10 to-purple-600/10 border border-[#8b5cf6]/30">
                      <div className="flex items-start gap-3 sm:gap-3">
                        <MessageCircle className="h-5 w-5 sm:h-5 sm:w-5 text-[#8b5cf6] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm sm:text-sm font-semibold text-white mb-2 sm:mb-2">
                            Bem-vindo ao chat de suporte!
                          </p>
                          <p className="text-xs sm:text-xs text-white/70 leading-relaxed">
                            Olá! 👋 Estamos aqui para ajudar. Descreva sua dúvida ou problema e nossa equipe responderá o mais breve possível. 
                            Você pode enviar mensagens a qualquer momento e acompanhar o status do seu ticket.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {Object.entries(groupMessagesByDate(messages)).map(([dateGroup, groupMessages]) => (
                  <div key={dateGroup} className="mb-4">
                    {/* Date Header */}
                    <div className="flex items-center gap-2 sm:gap-3 my-3 sm:my-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#8b5cf6]" />
                        <span className="text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide">
                          {dateGroup}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>

                    {/* Messages in this group */}
                    <div className="space-y-3 sm:space-y-4">
                      {groupMessages.map((message) => {
                        const isSystem = message.isSystem || false
                        const isAdmin = message.senderId === null && !isSystem
                        const isCurrentUser = !isAdmin && !isSystem && message.senderId === session?.user?.id
                        const messageStatus = getMessageStatus(message, isCurrentUser)
                        
                        // Mensagens do sistema são centralizadas com estilo diferente
                        if (isSystem) {
                          return (
                            <div key={message.id} className="flex justify-center my-2">
                              <div className="max-w-[90%] sm:max-w-[85%]">
                                <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border border-yellow-500/30 rounded-lg p-2 sm:p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1">
                                    <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
                                    <p className="text-[10px] sm:text-xs font-semibold text-yellow-400/90 uppercase tracking-wide">
                                      Sistema
                                    </p>
                                    <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
                                  </div>
                                  <p className="text-xs sm:text-sm text-white/90 whitespace-pre-wrap break-words">{message.content}</p>
                                  <p className="text-[9px] sm:text-[10px] text-white/40 mt-1 sm:mt-1.5">
                                    {new Date(message.createdAt).toLocaleString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
                          >
                            <div className={`max-w-[90%] sm:max-w-[80%] flex flex-col ${isAdmin ? "items-start" : "items-end"}`}>
                              {/* Nome do remetente */}
                              <p className={`text-xs sm:text-xs text-white/50 mb-1.5 px-1 ${isAdmin ? "text-left" : "text-right"}`}>
                                {isAdmin ? "Admin" : session?.user?.name || "Você"}
                              </p>
                              <div
                                className={`rounded-lg p-3 sm:p-3 ${
                                  isAdmin
                                    ? "bg-white/5 text-white/80"
                                    : "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white"
                                }`}
                              >
                                <p className="text-sm sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                                {message.attachmentUrl && (
                                  <div className="mt-2 pt-2 border-t border-white/10">
                                    <a
                                      href={message.attachmentUrl}
                                      download={message.attachmentName || "arquivo"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs hover:underline"
                                    >
                                      <Paperclip className="h-3 w-3" />
                                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{message.attachmentName || "Anexo"}</span>
                                      <Download className="h-3 w-3 ml-auto" />
                                    </a>
                                  </div>
                                )}
                                <div className="flex items-center justify-end gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
                                  {isCurrentUser && (
                                    <div className="flex items-center" title={messageStatus === "read" ? "Lida" : "Entregue"}>
                                      {messageStatus === "read" ? (
                                        <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" strokeWidth={2.5} />
                                      ) : (
                                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/70" strokeWidth={2.5} />
                                      )}
                                    </div>
                                  )}
                                  <p className="text-[10px] sm:text-xs text-white/50">
                                    {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Indicador de digitação */}
              {typingIndicator && (
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#8b5cf6] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#8b5cf6] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#8b5cf6] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-xs sm:text-sm text-white/70">
                      <span className="font-medium text-[#8b5cf6]">{typingIndicator}</span> está digitando...
                    </p>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 sm:p-4 border-t border-white/10 flex-shrink-0">
                {selectedFile && (
                  <div className="mb-3 flex items-center gap-2 p-3 bg-white/5 rounded border border-white/10">
                    <Paperclip className="h-4 w-4 sm:h-4 sm:w-4 text-white/60 flex-shrink-0" />
                    <span className="text-xs sm:text-xs text-white/80 truncate flex-1">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                      className="h-8 w-8 p-0 text-white/60 hover:text-white flex-shrink-0 touch-manipulation"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2 sm:gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-white/10 text-white/60 hover:bg-white/5 h-12 sm:h-10 px-4 sm:px-3 touch-manipulation"
                  >
                    <Paperclip className="h-5 w-5 sm:h-4 sm:w-4" />
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
                    className="flex-1 bg-[#0a0a0a] border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] h-12 sm:h-10 text-base sm:text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || sending}
                    className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 sm:h-10 px-5 sm:px-4 touch-manipulation"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, Loader2, Ban, Paperclip, X, Download, Image as ImageIcon } from "lucide-react"
import { notifyError } from "@/lib/notifications"
import Image from "next/image"

interface GroupChatMessage {
  id: string
  content: string
  senderId: string | null
  sender: {
    id: string
    name: string
    email: string
    role: string
  } | null
  attachmentUrl: string | null
  attachmentName: string | null
  createdAt: string
  isDeleted: boolean
}

interface CourseGroupChatProps {
  courseId: string
}

export function CourseGroupChat({ courseId }: CourseGroupChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<GroupChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [banned, setBanned] = useState(false)
  const [suspended, setSuspended] = useState(false)
  const [suspensionInfo, setSuspensionInfo] = useState<{ days: number; expiresAt: string; reason: string | null } | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/group-chat/messages`)
      const data = await response.json()

      if (response.status === 403 && data.banned) {
        if (data.suspended) {
          setSuspended(true)
          setSuspensionInfo(data.suspensionInfo || null)
        } else {
          setBanned(true)
        }
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar mensagens")
      }

      setMessages(data.messages || [])
      setChatId(data.chatId)
      setBanned(false)
      setSuspended(false)
      setSuspensionInfo(null)
    } catch (error: any) {
      console.error("Error loading messages:", error)
      await notifyError("Erro", error.message || "Erro ao carregar mensagens")
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (session?.user) {
      loadMessages()
      // Polling para novas mensagens a cada 3 segundos
      const interval = setInterval(loadMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [session, courseId, loadMessages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Arquivo muito grande. Tamanho máximo: 10MB")
        setTimeout(() => setErrorMessage(null), 5000)
        return
      }
      setSelectedFile(file)
    }
  }

  const isImageFile = (url: string | null): boolean => {
    if (!url) return false
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    return imageExtensions.some(ext => url.toLowerCase().includes(ext))
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if ((!newMessage.trim() && !selectedFile) || sending || uploadingFile) return

    setSending(true)
    setUploadingFile(selectedFile !== null)

    try {
      let attachmentUrl: string | null = null
      let attachmentName: string | null = null

      // Upload do arquivo se houver
      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)
        formData.append("courseId", courseId)

        const uploadResponse = await fetch(`/api/courses/${courseId}/group-chat/upload`, {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          throw new Error(uploadData.error || "Erro ao fazer upload do arquivo")
        }

        const uploadData = await uploadResponse.json()
        attachmentUrl = uploadData.url
        attachmentName = uploadData.fileName
      }

      const response = await fetch(`/api/courses/${courseId}/group-chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: newMessage.trim() || (selectedFile ? `Arquivo: ${selectedFile.name}` : ""),
          attachmentUrl,
          attachmentName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Mensagem especial para palavrões - mostrar no chat
        if (data.profanity) {
          setErrorMessage(data.error || "Você não pode enviar mensagens com palavras inadequadas. Por favor, seja respeitoso.")
          setTimeout(() => setErrorMessage(null), 5000)
        } else {
          setErrorMessage(data.error || "Erro ao enviar mensagem")
          setTimeout(() => setErrorMessage(null), 5000)
        }
        setSending(false)
        setUploadingFile(false)
        return
      }

      setNewMessage("")
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      // Recarregar mensagens para pegar a nova
      await loadMessages()
      // Scroll apenas quando o usuário envia uma mensagem
      setTimeout(() => scrollToBottom(), 100)
    } catch (error: any) {
      console.error("Error sending message:", error)
      setErrorMessage(error.message || "Erro ao enviar mensagem")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setSending(false)
      setUploadingFile(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#8b5cf6]" />
      </div>
    )
  }

  if (banned) {
    return (
      <div className="p-6 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
        <Ban className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-400 mb-2">Você está banido deste chat</h3>
        <p className="text-white/60">
          Você foi banido do chat deste curso e não pode ver novas mensagens nem enviar mensagens.
        </p>
      </div>
    )
  }

  if (suspended && suspensionInfo) {
    const daysRemaining = Math.ceil((new Date(suspensionInfo.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return (
      <div className="p-6 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
        <Ban className="h-12 w-12 text-orange-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-orange-400 mb-2">Você está suspenso deste chat</h3>
        <p className="text-white/60 mb-2">
          Você está suspenso por <span className="font-bold text-orange-400">{suspensionInfo.days} dia(s)</span>.
        </p>
        {suspensionInfo.reason && (
          <p className="text-white/80 mb-2">
            <span className="font-semibold">Motivo:</span> <span className="text-orange-300">{suspensionInfo.reason}</span>
          </p>
        )}
        <p className="text-white/60 text-sm">
          Sua suspensão expira em: <span className="font-semibold text-orange-400">{new Date(suspensionInfo.expiresAt).toLocaleString("pt-BR")}</span>
        </p>
        <p className="text-white/40 text-xs mt-2">
          Você não pode ver novas mensagens nem enviar mensagens durante este período.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Modal de Visualização de Imagem */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
            >
              <X className="h-6 w-6" />
            </Button>
            <Image
              src={selectedImage}
              alt="Imagem ampliada"
              width={1200}
              height={1200}
              className="max-w-full max-h-full object-contain rounded-lg"
              unoptimized
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col h-[500px] sm:h-[600px] bg-[#0a0a0a] border border-white/5 rounded-lg overflow-hidden">
        {/* Header */}
      <div className="p-4 border-b border-white/5 bg-[#0f0f0f]">
        <div className="flex items-center gap-2 sm:gap-2">
          <MessageCircle className="h-6 w-6 sm:h-5 sm:w-5 text-[#8b5cf6]" />
          <h3 className="text-lg sm:text-base font-bold text-white">Chat do Curso</h3>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center text-white/60 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-white/20" />
            <p>Nenhuma mensagem ainda. Seja o primeiro a comentar!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === session?.user?.id
            const isSystem = !message.sender

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-3 sm:p-3 ${
                    isSystem
                      ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                      : isOwnMessage
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-white/5 text-white border border-white/10"
                  }`}
                >
                  {!isSystem && message.sender && (
                    <div className="text-sm sm:text-xs font-semibold mb-1.5 sm:mb-1 opacity-80">
                      {message.sender.name}
                      {message.sender.role !== "STUDENT" && (
                        <span className="ml-2 px-2 py-0.5 sm:px-1.5 sm:py-0.5 rounded text-xs sm:text-[10px] bg-purple-500/30">
                          Admin
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-base sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </div>
                  
                  {/* Anexos */}
                  {message.attachmentUrl && (
                    <div className="mt-3">
                      {isImageFile(message.attachmentUrl) ? (
                        <div 
                          className="rounded-lg overflow-hidden max-w-[180px] cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImage(message.attachmentUrl)}
                        >
                          <Image
                            src={message.attachmentUrl}
                            alt={message.attachmentName || "Imagem"}
                            width={180}
                            height={180}
                            className="w-full h-auto object-cover rounded-lg"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <a
                          href={message.attachmentUrl}
                          download={message.attachmentName}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <Download className="h-4 w-4 text-white/60" />
                          <span className="text-sm text-white/80 truncate">
                            {message.attachmentName || "Arquivo"}
                          </span>
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs opacity-60 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-[#0f0f0f]">
        {errorMessage && (
          <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {errorMessage}
          </div>
        )}
        
        {/* Arquivo selecionado */}
        {selectedFile && (
          <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
            {isImageFile(selectedFile.name) ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-white/80 truncate">{selectedFile.name}</span>
                    <span className="text-xs text-white/40">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white/60 hover:text-white touch-manipulation"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="rounded-lg overflow-hidden max-w-[150px] relative w-full aspect-square">
                  <Image
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Paperclip className="h-4 w-4 text-white/60 flex-shrink-0" />
                  <span className="text-sm text-white/80 truncate">{selectedFile.name}</span>
                  <span className="text-xs text-white/40">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/60 hover:text-white touch-manipulation"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.zip,.txt"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="border-white/10 text-white/80 hover:bg-white/5 h-12 sm:h-10 px-4 sm:px-3 touch-manipulation"
            disabled={sending || uploadingFile}
          >
            <Paperclip className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              setErrorMessage(null) // Limpa erro ao digitar
            }}
            placeholder="Digite sua mensagem..."
            className="bg-[#0a0a0a] border-white/10 text-white placeholder:text-white/40 h-12 sm:h-10 text-base sm:text-sm"
            disabled={sending || uploadingFile}
          />
          <Button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || sending || uploadingFile}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-12 sm:h-10 px-5 sm:px-4 touch-manipulation"
          >
            {sending || uploadingFile ? (
              <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Send className="h-5 w-5 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </form>
      </div>
    </>
  )
}

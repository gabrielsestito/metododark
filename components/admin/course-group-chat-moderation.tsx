"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2, Ban, Unlock, MessageSquare, Loader2, AlertCircle, X } from "lucide-react"
import { notifyError, notifySuccess } from "@/lib/notifications"

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
  createdAt: string
  isDeleted: boolean
}

interface BannedUser {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  reason: string | null
  type: string
  expiresAt: string | null
  createdAt: string
}

interface CourseGroupChatModerationProps {
  courseId: string
}

export function CourseGroupChatModeration({ courseId }: CourseGroupChatModerationProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<GroupChatMessage[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [suspendedUsers, setSuspendedUsers] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [banning, setBanning] = useState<string | null>(null)
  const [showBanModal, setShowBanModal] = useState(false)
  const [banUserId, setBanUserId] = useState<string | null>(null)
  const [banUserName, setBanUserName] = useState<string>("")
  const [banReason, setBanReason] = useState<string>("")
  const [banType, setBanType] = useState<"ban" | "suspension">("ban")
  const [suspensionDays, setSuspensionDays] = useState<number>(1)

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/group-chat/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }, [courseId])

  const loadBannedUsers = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/group-chat/bans`)
      if (response.ok) {
        const data = await response.json()
        const now = new Date()
        // Separar banidos e suspensos
        const banned = (data.bans || []).filter((ban: BannedUser) => 
          ban.type === "ban" || (ban.type === "suspension" && ban.expiresAt && new Date(ban.expiresAt) <= now)
        )
        const suspended = (data.bans || []).filter((ban: BannedUser) => 
          ban.type === "suspension" && ban.expiresAt && new Date(ban.expiresAt) > now
        )
        setBannedUsers(banned)
        setSuspendedUsers(suspended)
      }
    } catch (error) {
      console.error("Error loading banned users:", error)
    }
  }, [courseId])

  useEffect(() => {
    if (session?.user) {
      loadMessages()
      loadBannedUsers()
      setLoading(false)
      // Atualizar a cada 5 segundos
      const interval = setInterval(() => {
        loadMessages()
        loadBannedUsers()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [session, courseId, loadMessages, loadBannedUsers])

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta mensagem?")) return

    setDeleting(messageId)
    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/group-chat/messages/${messageId}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        await notifySuccess("Sucesso", "Mensagem deletada com sucesso")
        await loadMessages()
      } else {
        const data = await response.json()
        await notifyError("Erro", data.error || "Erro ao deletar mensagem")
      }
    } catch (error: any) {
      await notifyError("Erro", "Erro ao deletar mensagem")
    } finally {
      setDeleting(null)
    }
  }

  const handleBanUser = (userId: string, userName: string) => {
    setBanUserId(userId)
    setBanUserName(userName)
    setBanReason("")
    setBanType("ban")
    setSuspensionDays(1)
    setShowBanModal(true)
  }

  const confirmBanUser = async () => {
    if (!banUserId) return

    setShowBanModal(false)
    setBanning(banUserId)
    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/group-chat/bans`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: banUserId, 
            reason: banReason || null,
            type: banType,
            days: banType === "suspension" ? suspensionDays : null
          }),
        }
      )

      if (response.ok) {
        await notifySuccess("Sucesso", "Usuário banido com sucesso")
        await loadBannedUsers()
        await loadMessages()
      } else {
        const data = await response.json()
        await notifyError("Erro", data.error || "Erro ao banir usuário")
      }
    } catch (error: any) {
      await notifyError("Erro", "Erro ao banir usuário")
    } finally {
      setBanning(null)
      setBanUserId(null)
      setBanUserName("")
      setBanReason("")
      setBanType("ban")
      setSuspensionDays(1)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    setBanning(userId)
    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/group-chat/bans/${userId}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        await notifySuccess("Sucesso", "Banimento removido com sucesso")
        await loadBannedUsers()
      } else {
        const data = await response.json()
        await notifyError("Erro", data.error || "Erro ao remover banimento")
      }
    } catch (error: any) {
      await notifyError("Erro", "Erro ao remover banimento")
    } finally {
      setBanning(null)
    }
  }

  const handleClearChat = async () => {
    if (!confirm("Tem certeza que deseja limpar TODAS as mensagens do chat? Esta ação não pode ser desfeita.")) return

    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/group-chat/clear`,
        { method: "POST" }
      )

      if (response.ok) {
        await notifySuccess("Sucesso", "Chat limpo com sucesso")
        await loadMessages()
      } else {
        const data = await response.json()
        await notifyError("Erro", data.error || "Erro ao limpar chat")
      }
    } catch (error: any) {
      await notifyError("Erro", "Erro ao limpar chat")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#8b5cf6]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Modal de Banimento */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Banir Usuário</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBanModal(false)
                  setBanUserId(null)
                  setBanUserName("")
                  setBanReason("")
                }}
                className="text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-white/80 mb-4">
              Escolha a punição para <span className="font-semibold">{banUserName}</span>:
            </p>
            
            {/* Tipo de Punição */}
            <div className="mb-4">
              <label className="text-sm text-white/60 mb-2 block">Tipo de Punição</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setBanType("ban")}
                  variant={banType === "ban" ? "default" : "outline"}
                  className={`flex-1 ${banType === "ban" ? "bg-red-500 hover:bg-red-600" : "border-white/10 text-white/80 hover:bg-white/5"}`}
                >
                  Banir Permanentemente
                </Button>
                <Button
                  type="button"
                  onClick={() => setBanType("suspension")}
                  variant={banType === "suspension" ? "default" : "outline"}
                  className={`flex-1 ${banType === "suspension" ? "bg-orange-500 hover:bg-orange-600" : "border-white/10 text-white/80 hover:bg-white/5"}`}
                >
                  Suspender
                </Button>
              </div>
            </div>

            {/* Dias de Suspensão */}
            {banType === "suspension" && (
              <div className="mb-4">
                <label className="text-sm text-white/60 mb-2 block">Dias de Suspensão</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(parseInt(e.target.value) || 1)}
                  className="bg-[#0a0a0a] border-white/10 text-white"
                />
              </div>
            )}

            {/* Motivo */}
            <div className="mb-4">
              <label className="text-sm text-white/60 mb-2 block">Motivo (opcional)</label>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Motivo da punição (opcional)"
                className="bg-[#0a0a0a] border-white/10 text-white placeholder:text-white/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    confirmBanUser()
                  }
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowBanModal(false)
                  setBanUserId(null)
                  setBanUserName("")
                  setBanReason("")
                  setBanType("ban")
                  setSuspensionDays(1)
                }}
                variant="outline"
                className="flex-1 border-white/10 text-white/80 hover:bg-white/5"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmBanUser}
                className={`flex-1 ${banType === "ban" ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"} text-white`}
              >
                <Ban className="h-4 w-4 mr-2" />
                {banType === "ban" ? "Banir" : "Suspender"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ações Rápidas */}
      <Card className="bg-[#0f0f0f] border border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#8b5cf6]" />
            Moderação do Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={handleClearChat}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Todas as Mensagens
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usuários Suspensos */}
      <Card className="bg-[#0f0f0f] border border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-orange-400" />
            Usuários Suspensos ({suspendedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suspendedUsers.length === 0 ? (
            <p className="text-white/60">Nenhum usuário suspenso</p>
          ) : (
            <div className="space-y-2">
              {suspendedUsers.map((ban) => {
                const daysRemaining = ban.expiresAt 
                  ? Math.ceil((new Date(ban.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : 0
                return (
                  <div
                    key={ban.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/20"
                  >
                    <div>
                      <p className="font-semibold text-white">{ban.user.name}</p>
                      <p className="text-sm text-white/60">{ban.user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-orange-500/30 text-orange-400">
                          Suspenso
                        </span>
                        {ban.expiresAt && (
                          <span className="text-xs text-orange-400 font-semibold">
                            {daysRemaining} dia(s) restante(s) - Expira em: {new Date(ban.expiresAt).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                      {ban.reason && (
                        <p className="text-xs text-white/40 mt-1">Motivo: {ban.reason}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleUnbanUser(ban.userId)}
                      disabled={banning === ban.userId}
                      size="sm"
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      {banning === ban.userId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Remover Suspensão
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usuários Banidos */}
      <Card className="bg-[#0f0f0f] border border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-400" />
            Usuários Banidos ({bannedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bannedUsers.length === 0 ? (
            <p className="text-white/60">Nenhum usuário banido</p>
          ) : (
            <div className="space-y-2">
              {bannedUsers.map((ban) => (
                <div
                  key={ban.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                >
                  <div>
                    <p className="font-semibold text-white">{ban.user.name}</p>
                    <p className="text-sm text-white/60">{ban.user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/30 text-red-400">
                        Banido Permanentemente
                      </span>
                    </div>
                    {ban.reason && (
                      <p className="text-xs text-white/40 mt-1">Motivo: {ban.reason}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleUnbanUser(ban.userId)}
                    disabled={banning === ban.userId}
                    size="sm"
                    variant="outline"
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    {banning === ban.userId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Desbanir
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensagens */}
      <Card className="bg-[#0f0f0f] border border-white/5">
        <CardHeader>
          <CardTitle>Mensagens do Chat ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-white/60 text-center py-8">Nenhuma mensagem</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      {message.sender ? (
                        <>
                          <p className="font-semibold text-white">
                            {message.sender.name}
                            {message.sender.role !== "STUDENT" && (
                              <span className="ml-2 px-2 py-0.5 rounded text-xs bg-purple-500/30">
                                Admin
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-white/60">{message.sender.email}</p>
                        </>
                      ) : (
                        <p className="font-semibold text-yellow-400">Sistema</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {message.sender && (
                        <Button
                          onClick={() => handleBanUser(message.sender!.id, message.sender!.name)}
                          disabled={banning === message.sender!.id}
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          {banning === message.sender!.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteMessage(message.id)}
                        disabled={deleting === message.id}
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        {deleting === message.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-white/80 mt-2 whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p className="text-xs text-white/40 mt-2">
                    {new Date(message.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

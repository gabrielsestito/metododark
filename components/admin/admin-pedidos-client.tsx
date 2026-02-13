"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, Clock, XCircle, Copy, Eye, User, ShoppingBag, Calendar, Search, Filter, Trash2, Edit2, Loader2, MoreVertical } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/notifications"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Order {
  id: string
  userId: string
  paymentId: string | null
  paymentMethod: string
  pixCopyPaste: string | null
  total: number
  status: string
  expiresAt: Date | null
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
  }
  items: Array<{
    id: string
    courseId: string
    price: number
    course: {
      id: string
      title: string
    }
  }>
}

interface AdminPedidosClientProps {
  orders: Order[]
}

export function AdminPedidosClient({ orders: initialOrders }: AdminPedidosClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [loading, setLoading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "failed">("all")
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-order-dropdown]')) {
        setSelectedOrder(null)
      }
    }

    if (selectedOrder) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [selectedOrder])

  const handleConfirmPayment = async (orderId: string) => {
    if (!confirm("Confirmar que o pagamento foi recebido na conta Nubank?")) {
      return
    }

    setLoading(orderId)
    try {
      const response = await fetch("/api/checkout/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        await notifySuccess("Pagamento confirmado", "Pagamento confirmado com sucesso! O cliente agora tem acesso aos cursos.")
        window.location.reload()
      } else {
        await notifyError("Erro", data.error || "Erro ao confirmar pagamento")
      }
    } catch (error) {
      console.error("Error confirming payment:", error)
      await notifyError("Erro", "Erro ao confirmar pagamento. Tente novamente.")
    } finally {
      setLoading(null)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        )
        await notifySuccess("Status atualizado", `Status do pedido atualizado para ${newStatus === "completed" ? "Concluído" : newStatus === "pending" ? "Pendente" : "Falhado"}`)
        setSelectedOrder(null)
      } else {
        await notifyError("Erro", data.error || "Erro ao atualizar status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      await notifyError("Erro", "Erro ao atualizar status do pedido")
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    const orderStatus = order?.status === "completed" ? "concluído" : order?.status === "pending" ? "pendente" : "falhado"
    
    if (!confirm(`Tem certeza que deseja excluir este pedido ${orderStatus}?\n\nEsta ação é irreversível e ${order?.status === "completed" ? "removerá o acesso aos cursos do cliente" : ""}.`)) {
      return
    }

    setDeleting(orderId)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        setOrders((prev) => prev.filter((order) => order.id !== orderId))
        await notifySuccess("Pedido excluído", "O pedido foi excluído com sucesso")
      } else {
        await notifyError("Erro", data.error || "Erro ao excluir pedido")
      }
    } catch (error) {
      console.error("Error deleting order:", error)
      await notifyError("Erro", "Erro ao excluir pedido")
    } finally {
      setDeleting(null)
      setSelectedOrder(null)
    }
  }

  const copyPixCode = async (pixCode: string, orderId: string) => {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(orderId)
      await notifySuccess("Copiado!", "Código PIX copiado para a área de transferência")
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error("Error copying:", error)
      await notifyError("Erro", "Erro ao copiar código PIX")
    }
  }

  // Filtrar pedidos
  const filteredOrders = orders.filter((order) => {
    // Filtro de status
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false
    }

    // Filtro de busca
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        order.id.toLowerCase().includes(searchLower) ||
        order.user.name.toLowerCase().includes(searchLower) ||
        order.user.email.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.course.title.toLowerCase().includes(searchLower))
      )
    }

    return true
  })

  const pendingOrders = filteredOrders.filter(o => o.status === "pending")
  const otherOrders = filteredOrders.filter(o => o.status !== "pending")

  return (
    <div className="space-y-6">
      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, cliente, email ou curso..."
            className="pl-9 bg-[#0a0a0a] border-white/10 text-white placeholder:text-white/40 focus:border-orange-500/50 h-11"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className={statusFilter === "all" ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0" : "border-white/10 text-white/80 hover:bg-white/5"}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            className={statusFilter === "pending" ? "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white border-0" : "border-white/10 text-white/80 hover:bg-white/5"}
          >
            Pendentes
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            onClick={() => setStatusFilter("completed")}
            className={statusFilter === "completed" ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0" : "border-white/10 text-white/80 hover:bg-white/5"}
          >
            Concluídos
          </Button>
          <Button
            variant={statusFilter === "failed" ? "default" : "outline"}
            onClick={() => setStatusFilter("failed")}
            className={statusFilter === "failed" ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0" : "border-white/10 text-white/80 hover:bg-white/5"}
          >
            Falhados
          </Button>
        </div>
      </div>

      {/* Pedidos Pendentes - Destaque */}
      {pendingOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Pedidos Pendentes</h2>
              <p className="text-sm text-white/60">{pendingOrders.length} aguardando confirmação</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border-2 border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all ${
                  deleting === order.id ? "opacity-50" : ""
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                        <span className="text-sm font-bold text-yellow-400">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
                        ⏳ Aguardando Pagamento
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/20">
                        {order.paymentMethod === "pix" ? "PIX" : order.paymentMethod === "credit_card" ? "Cartão" : order.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <User className="h-4 w-4 text-white/60" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{order.user.name}</p>
                        <p className="text-xs text-white/60">{order.user.email}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-white/60 mb-1">Valor Total</p>
                      <p className="text-3xl font-black text-white">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    
                    {/* Informações PIX */}
                    {order.paymentMethod === "pix" && order.pixCopyPaste && (
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm font-medium text-white/80 mb-3">Código PIX do Pedido:</p>
                        <div className="flex gap-2 items-start">
                          <textarea
                            readOnly
                            value={order.pixCopyPaste}
                            className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 font-mono resize-none focus:outline-none focus:border-yellow-500/50"
                            rows={4}
                          />
                          <Button
                            size="sm"
                            onClick={() => copyPixCode(order.pixCopyPaste!, order.id)}
                            className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-auto px-4"
                          >
                            {copied === order.id ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-yellow-400/80 mt-3 flex items-center gap-2">
                          <span>💡</span>
                          <span>Verifique se o pagamento foi recebido na sua conta Nubank antes de confirmar</span>
                        </p>
                      </div>
                    )}

                    {/* Cursos */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingBag className="h-4 w-4 text-white/60" />
                        <p className="text-sm font-medium text-white/80">Cursos ({order.items.length}):</p>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-white/60">• {item.course.title}</span>
                            <span className="text-white/80 font-medium">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.expiresAt && (
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Calendar className="h-3 w-3" />
                        <span>Expira em: {new Date(order.expiresAt).toLocaleString("pt-BR")}</span>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-3 lg:min-w-[200px]">
                    <Button
                      onClick={() => handleConfirmPayment(order.id)}
                      disabled={loading === order.id}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg shadow-green-500/20"
                    >
                      {loading === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirmar Pagamento
                        </>
                      )}
                    </Button>
                    
                    <div className="relative" data-order-dropdown>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                        className="w-full border-white/10 text-white/80 hover:bg-white/5"
                      >
                        <MoreVertical className="h-4 w-4 mr-2" />
                        Gerenciar
                      </Button>
                      
                      {selectedOrder === order.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f0f0f] border border-white/10 rounded-lg shadow-xl z-10 p-2 space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, "failed")}
                            disabled={updating === order.id}
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Marcar como Falhado
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                            disabled={deleting === order.id}
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            {deleting === order.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Excluir Pedido
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outros Pedidos */}
      {otherOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-purple-600">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Todos os Pedidos</h2>
              <p className="text-sm text-white/60">{otherOrders.length} pedido{otherOrders.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {otherOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all transform hover:scale-[1.01] ${
                  deleting === order.id ? "opacity-50" : ""
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-sm font-bold text-white">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          order.status === "completed"
                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                            : "bg-red-500/20 text-red-400 border-red-500/50"
                        }`}
                      >
                        {order.status === "completed" ? "✅ Concluído" : "❌ Falhou"}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/20">
                        {order.paymentMethod === "pix" ? "PIX" : order.paymentMethod === "credit_card" ? "Cartão" : order.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <User className="h-4 w-4 text-white/60" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{order.user.name}</p>
                        <p className="text-xs text-white/60">{order.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-wrap">
                      <div>
                        <p className="text-xs text-white/60 mb-1">Valor</p>
                        <p className="text-2xl font-black text-white">
                          R$ {order.total.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 mb-1">Data</p>
                        <p className="text-sm font-medium text-white/80">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 mb-1">Cursos</p>
                        <p className="text-sm font-medium text-white/80">{order.items.length}</p>
                      </div>
                    </div>

                    {/* Lista de Cursos */}
                    {order.items.length > 0 && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-white/60 mb-2">Cursos incluídos:</p>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-xs text-white/60">
                              • {item.course.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-3 lg:min-w-[200px]">
                    <div className="relative" data-order-dropdown>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                        className="w-full border-white/10 text-white/80 hover:bg-white/5"
                      >
                        <MoreVertical className="h-4 w-4 mr-2" />
                        Gerenciar
                      </Button>
                      
                      {selectedOrder === order.id && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#0f0f0f] border border-white/10 rounded-lg shadow-xl z-10 p-2 space-y-1">
                          {order.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "completed")}
                              disabled={updating === order.id}
                              className="w-full justify-start text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            >
                              {updating === order.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Marcar como Concluído
                            </Button>
                          )}
                          {order.status !== "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "pending")}
                              disabled={updating === order.id}
                              className="w-full justify-start text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                            >
                              {updating === order.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Clock className="h-4 w-4 mr-2" />
                              )}
                              Marcar como Pendente
                            </Button>
                          )}
                          {order.status !== "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "failed")}
                              disabled={updating === order.id}
                              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              {updating === order.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                              )}
                              Marcar como Falhado
                            </Button>
                          )}
                          <div className="border-t border-white/10 my-1"></div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                            disabled={deleting === order.id}
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            {deleting === order.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Excluir Pedido
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredOrders.length === 0 && (
        <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-12 text-center">
          <div className="inline-block p-6 rounded-full bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 mb-4">
            <ShoppingBag className="h-12 w-12 text-orange-400" />
          </div>
          <p className="text-white/60 text-lg mb-2">
            {search || statusFilter !== "all" 
              ? "Nenhum pedido encontrado com os filtros aplicados" 
              : "Nenhum pedido encontrado"}
          </p>
          {(search || statusFilter !== "all") && (
            <Button
              onClick={() => {
                setSearch("")
                setStatusFilter("all")
              }}
              variant="outline"
              className="mt-4 border-white/10 text-white/80 hover:bg-white/5"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit2, BookOpen, Calendar, CheckCircle, Clock, X, MessageCircle, Crown, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { notifySuccess, notifyError } from "@/lib/notifications"
import { confirm } from "@/lib/confirm"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserDetailsModalProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    enrollments: Array<{
      id: string
      expiresAt: Date | null
      createdAt: Date
      course: {
        id: string
        title: string
        slug: string
      }
    }>
    subscription?: {
      id: string
      status: string
      currentPeriodStart: Date | null
      currentPeriodEnd: Date | null
    } | null
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case "STUDENT": return "Estudante"
    case "ASSISTANT": return "Assistente"
    case "ADMIN": return "Administrador"
    case "FINANCIAL": return "Financeiro"
    case "CEO": return "CEO"
    default: return role
  }
}

export function UserDetailsModal({ user }: UserDetailsModalProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const canChangeRole = session?.user?.role === "ADMIN" || session?.user?.role === "CEO"
  const [userData, setUserData] = useState({
    name: user.name,
    email: user.email,
    password: "",
    role: user.role,
  })
  const [enrollments, setEnrollments] = useState(user.enrollments)
  const [courseProgress, setCourseProgress] = useState<Record<string, any>>({})
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [expiresIn, setExpiresIn] = useState("")
  const [showExpirationModal, setShowExpirationModal] = useState(false)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null)
  const [expirationDays, setExpirationDays] = useState("")
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState(user.subscription?.status || "")
  const [subscriptionMonths, setSubscriptionMonths] = useState("")
  const [subscriptionData, setSubscriptionData] = useState(user.subscription)
  const [subscriptionPlans, setSubscriptionPlans] = useState<Array<{ id: string; name: string; price: number; courses: any[] }>>([])
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [fetchingPlans, setFetchingPlans] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Buscar progresso dos cursos
      Promise.all(
        user.enrollments.map(async (enrollment) => {
          const response = await fetch(
            `/api/admin/users/${user.id}/progress/${enrollment.course.id}`
          )
          const data = await response.json()
          return { courseId: enrollment.course.id, progress: data }
        })
      ).then((results) => {
        const progressMap: Record<string, any> = {}
        results.forEach(({ courseId, progress }) => {
          progressMap[courseId] = progress
        })
        setCourseProgress(progressMap)
      })

      // Buscar lista de cursos
      fetch("/api/admin/courses")
        .then((res) => res.json())
        .then((data) => setCourses(data))
        .catch((error) => console.error("Error fetching courses:", error))

      // Buscar planos de assinatura
      fetch("/api/admin/subscription-plans")
        .then((res) => res.json())
        .then((data) => {
          setSubscriptionPlans(data.filter((plan: any) => plan.isActive))
          // Se já existe assinatura, tentar encontrar o plano relacionado
          if (user.subscription) {
            // Por enquanto, deixar vazio - será selecionado manualmente
          }
        })
        .catch((error) => console.error("Error fetching plans:", error))
    }
  }, [isOpen, user.id, user.enrollments, user.subscription])

  const handleUpdateUser = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        await notifySuccess("Sucesso", "Usuário atualizado com sucesso!")
        setIsOpen(false)
        window.location.reload()
      } else {
        await notifyError("Erro", "Erro ao atualizar usuário")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      await notifyError("Erro", "Erro ao atualizar usuário")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCourse = async () => {
    if (!selectedCourseId) {
      await notifyError("Selecione um curso", "Por favor, selecione um curso antes de continuar.")
      return
    }

    // Validar se expiresIn é um número válido
    let expiresAt: string | null = null
    if (expiresIn && expiresIn.trim() !== "") {
      const days = parseInt(expiresIn)
      if (isNaN(days) || days <= 0) {
        await notifyError("Dias inválidos", "Por favor, insira um número válido de dias")
        return
      }
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          courseId: selectedCourseId, 
          expiresAt: expiresAt 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await notifySuccess("Curso adicionado", "Curso adicionado com sucesso!")
        setShowAddCourse(false)
        setSelectedCourseId("")
        setExpiresIn("")
        window.location.reload()
      } else {
        const errorMsg = data.error || data.details || "Erro ao adicionar curso"
        await notifyError("Erro", errorMsg)
        console.error("Error details:", data)
      }
    } catch (error: any) {
      console.error("Error adding course:", error)
      await notifyError("Erro", `Erro ao adicionar curso: ${error.message || "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEnrollment = async (
    enrollmentId: string,
    expiresAt: Date | null
  ) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt }),
      })

      if (response.ok) {
        await notifySuccess("Sucesso", "Acesso atualizado com sucesso!")
        window.location.reload()
      } else {
        await notifyError("Erro", "Erro ao atualizar acesso")
      }
    } catch (error) {
      console.error("Error updating enrollment:", error)
      await notifyError("Erro", "Erro ao atualizar acesso")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    const confirmed = await confirm({
      title: "Remover Curso",
      description: "Tem certeza que deseja remover este curso do usuário?",
      confirmText: "Remover",
      cancelText: "Cancelar",
      variant: "destructive",
    })
    
    if (!confirmed) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await notifySuccess("Sucesso", "Curso removido com sucesso!")
        window.location.reload()
      } else {
        await notifyError("Erro", "Erro ao remover curso")
      }
    } catch (error) {
      console.error("Error removing enrollment:", error)
      await notifyError("Erro", "Erro ao remover curso")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0"
      >
        <Edit2 className="h-4 w-4 mr-2" />
        Gerenciar
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-0 sm:p-4" style={{ zIndex: 99999 }}>
      <Card className="w-full h-full sm:w-[95vw] sm:h-[95vh] sm:max-w-6xl sm:max-h-[95vh] flex flex-col bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/5 shadow-2xl rounded-none sm:rounded-lg relative" style={{ zIndex: 100000 }}>
        <CardHeader className="flex-shrink-0 border-b border-white/5 p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl sm:text-2xl text-white">
              Gerenciar Usuário
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 flex-1 p-4 sm:p-6 min-h-0 overflow-y-auto" style={{ paddingBottom: '4rem' }}>
          {/* Botão de Chat */}
          <div className="flex justify-end mb-4">
            <Button
              onClick={async () => {
                try {
                  const response = await fetch(`/api/admin/chats?search=${encodeURIComponent(user.email)}`)
                  const chats = await response.json()
                  const openChat = chats.find((chat: any) => chat.status === "open" && chat.userId === user.id)
                  
                  if (openChat) {
                    router.push(`/admin/chats?chatId=${openChat.id}`)
                  } else {
                    router.push(`/admin/chats?userId=${user.id}`)
                  }
                  setIsOpen(false)
                } catch (error) {
                  console.error("Error opening chat:", error)
                  router.push("/admin/chats")
                }
              }}
              className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Abrir Chat
            </Button>
          </div>

          {/* Editar Dados do Usuário */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white">Dados do Usuário</h3>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/80">Nome</Label>
              <Input
                id="name"
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
              />
            </div>
            {canChangeRole && (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-white/80">Cargo</Label>
                <Select
                  value={userData.role}
                  onValueChange={(value) =>
                    setUserData({ ...userData, role: value })
                  }
                >
                  <SelectTrigger className="bg-[#0a0a0a] border border-white/10 text-white focus:border-[#8b5cf6] focus:ring-[#8b5cf6] h-10 sm:h-11">
                    <SelectValue placeholder="Selecione o cargo">
                      {getRoleLabel(userData.role)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-[#0a0a0a] border border-white/10" 
                    style={{ zIndex: 100001 }}
                    position="popper"
                    sideOffset={5}
                  >
                    <SelectItem value="STUDENT" className="text-white focus:bg-[#8b5cf6] hover:bg-[#8b5cf6]/20 cursor-pointer">
                      Estudante
                    </SelectItem>
                    <SelectItem value="ASSISTANT" className="text-white focus:bg-[#8b5cf6] hover:bg-[#8b5cf6]/20 cursor-pointer">
                      Assistente
                    </SelectItem>
                    <SelectItem value="ADMIN" className="text-white focus:bg-[#8b5cf6] hover:bg-[#8b5cf6]/20 cursor-pointer">
                      Administrador
                    </SelectItem>
                    <SelectItem value="FINANCIAL" className="text-white focus:bg-[#8b5cf6] hover:bg-[#8b5cf6]/20 cursor-pointer">
                      Financeiro
                    </SelectItem>
                    <SelectItem value="CEO" className="text-white focus:bg-[#8b5cf6] hover:bg-[#8b5cf6]/20 cursor-pointer">
                      CEO
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">
                Nova Senha (deixe vazio para não alterar)
              </Label>
              <Input
                id="password"
                type="password"
                value={userData.password}
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
                }
                className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
              />
            </div>
            <Button
              onClick={handleUpdateUser}
              disabled={loading}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>

          {/* Cursos do Usuário */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-white">Cursos do Usuário</h3>
              <Button
                onClick={() => setShowAddCourse(!showAddCourse)}
                disabled={loading}
                variant="outline"
                className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {showAddCourse ? "Cancelar" : "Adicionar Curso"}
              </Button>
            </div>

            {showAddCourse && (
              <div className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-white/10 space-y-3">
                <div className="space-y-2">
                  <Label className="text-white/80">Selecionar Curso</Label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                  >
                    <option value="">Selecione um curso</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">
                    Dias de acesso (deixe vazio para vitalício)
                  </Label>
                  <Input
                    type="number"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    placeholder="Ex: 30"
                    className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                  />
                </div>
                <Button
                  onClick={handleAddCourse}
                  disabled={loading || !selectedCourseId}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0"
                >
                  Adicionar
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {enrollments.map((enrollment) => {
                const progress = courseProgress[enrollment.course.id] || {}
                const isExpired =
                  enrollment.expiresAt &&
                  new Date(enrollment.expiresAt) < new Date()

                return (
                  <div
                    key={enrollment.id}
                    className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-white/10"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white mb-1 text-sm sm:text-base break-words">
                          {enrollment.course.title}
                        </h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>
                              {progress.completedLessons || 0}/
                              {progress.totalLessons || 0} aulas concluídas
                            </span>
                          </div>
                          {progress.progress !== undefined && (
                            <div className="flex items-center gap-1">
                              <span>Progresso: {Math.round(progress.progress)}%</span>
                            </div>
                          )}
                        </div>
                        {progress.lastLesson && (
                          <p className="text-xs text-gray-500 mt-1">
                            Última aula: {progress.lastLesson}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEnrollment(enrollment.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {enrollment.expiresAt ? (
                            <>
                              Expira em:{" "}
                              {new Date(enrollment.expiresAt).toLocaleDateString(
                                "pt-BR"
                              )}
                              {isExpired && (
                                <span className="ml-2 text-red-400 font-semibold">
                                  (Expirado)
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-green-400">Acesso Vitalício</span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateEnrollment(enrollment.id, null)}
                          className="border-green-500/50 text-green-300 hover:bg-green-500/10 text-xs w-full sm:w-auto"
                        >
                          Tornar Vitalício
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEnrollmentId(enrollment.id)
                            setExpirationDays("")
                            setShowExpirationModal(true)
                          }}
                          className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white text-xs w-full sm:w-auto"
                        >
                          Definir Expiração
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {enrollments.length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  Nenhum curso atribuído
                </p>
              )}
            </div>
          </div>

          {/* Assinatura do Usuário */}
          <div className="space-y-3 sm:space-y-4 pt-6 mt-6 border-t-2 border-white/10 bg-gradient-to-br from-[#8b5cf6]/5 to-purple-600/5 p-4 sm:p-6 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-400" />
                Assinatura
              </h3>
              <Button
                onClick={() => {
                  setSubscriptionStatus(user.subscription?.status || "active")
                  setSubscriptionMonths("")
                  setSelectedPlanId("")
                  setFetchingPlans(true)
                  fetch("/api/admin/subscription-plans")
                    .then((res) => res.json())
                    .then((data) => {
                      setSubscriptionPlans(data.filter((plan: any) => plan.isActive))
                      setFetchingPlans(false)
                    })
                    .catch((error) => {
                      console.error("Error fetching plans:", error)
                      setFetchingPlans(false)
                    })
                  setShowSubscriptionModal(true)
                }}
                disabled={loading}
                variant="outline"
                className="border-[#8b5cf6]/50 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 hover:text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                {subscriptionData ? "Editar Assinatura" : "Criar Assinatura"}
              </Button>
            </div>

            {subscriptionData ? (
              <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="h-5 w-5 text-[#8b5cf6]" />
                  <span className="font-semibold text-white">Status: </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      subscriptionData.status === "active"
                        ? "bg-green-500/20 text-green-400 border border-green-500/50"
                        : subscriptionData.status === "canceled"
                        ? "bg-red-500/20 text-red-400 border border-red-500/50"
                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                    }`}
                  >
                    {subscriptionData.status === "active"
                      ? "Ativa"
                      : subscriptionData.status === "canceled"
                      ? "Cancelada"
                      : subscriptionData.status === "expired"
                      ? "Expirada"
                      : subscriptionData.status}
                  </span>
                </div>
                {subscriptionData.currentPeriodStart && (
                  <p className="text-sm text-white/60 mb-1">
                    Início:{" "}
                    {new Date(subscriptionData.currentPeriodStart).toLocaleDateString("pt-BR")}
                  </p>
                )}
                {subscriptionData.currentPeriodEnd && (
                  <p className="text-sm text-white/60">
                    Expira em:{" "}
                    {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                Nenhuma assinatura ativa
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Assinatura */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4" style={{ zIndex: 100001 }}>
          <Card className="w-full h-full sm:w-[90vw] sm:h-auto sm:max-w-lg sm:max-h-[90vh] flex flex-col bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/5 shadow-2xl rounded-none sm:rounded-lg relative" style={{ zIndex: 100002 }}>
            <CardHeader className="flex-shrink-0 border-b border-white/5 p-4 sm:p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg sm:text-xl text-white">
                  {subscriptionData ? "Editar" : "Criar"} Assinatura
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowSubscriptionModal(false)
                    setSubscriptionMonths("")
                  }}
                  className="text-white/60 hover:text-white hover:bg-white/5"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 p-4 sm:p-6 min-h-0">
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!subscriptionStatus) {
                    await notifyError("Selecione um status", "Por favor, selecione um status antes de continuar.")
                    return
                  }

                  if (!selectedPlanId) {
                    await notifyError("Selecione um plano", "Por favor, selecione um plano de assinatura antes de continuar.")
                    return
                  }

                  setLoading(true)
                  try {
                    const months = subscriptionMonths ? parseInt(subscriptionMonths) : null
                    let currentPeriodStart: Date | null = new Date()
                    let currentPeriodEnd: Date | null = null

                    if (months && months > 0) {
                      currentPeriodEnd = new Date()
                      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + months)
                    }

                    const response = await fetch(`/api/admin/users/${user.id}/subscription`, {
                      method: subscriptionData ? "PUT" : "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        planId: selectedPlanId,
                        status: subscriptionStatus,
                        currentPeriodStart: currentPeriodStart.toISOString(),
                        currentPeriodEnd: currentPeriodEnd?.toISOString() || null,
                      }),
                    })

                    if (response.ok) {
                      const data = await response.json()
                      setSubscriptionData(data)
                      await notifySuccess("Sucesso", "Assinatura salva com sucesso!")
                      setShowSubscriptionModal(false)
                      window.location.reload()
                    } else {
                      const errorData = await response.json()
                      await notifyError("Erro", errorData.error || "Erro ao salvar assinatura")
                    }
                  } catch (error) {
                    console.error("Error saving subscription:", error)
                    await notifyError("Erro", "Erro ao salvar assinatura")
                  } finally {
                    setLoading(false)
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-white/80">Plano de Assinatura *</Label>
                  {fetchingPlans ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-[#8b5cf6]" />
                    </div>
                  ) : (
                    <Select
                      value={selectedPlanId}
                      onValueChange={setSelectedPlanId}
                      required
                    >
                      <SelectTrigger className="bg-[#0a0a0a] border border-white/10 text-white focus:border-[#8b5cf6] focus:ring-[#8b5cf6]">
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border border-white/10 z-[100002]" style={{ zIndex: 100002 }}>
                        {subscriptionPlans.map((plan) => (
                          <SelectItem
                            key={plan.id}
                            value={plan.id}
                            className="text-white focus:bg-[#8b5cf6]"
                          >
                            {plan.name} - R$ {plan.price.toFixed(2)}/mês ({plan.courses?.length || 0} cursos)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedPlanId && (
                    <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-white/60 mb-2">Cursos incluídos neste plano:</p>
                      <div className="space-y-1">
                        {subscriptionPlans
                          .find((p) => p.id === selectedPlanId)
                          ?.courses?.map((planCourse: any) => (
                            <div
                              key={planCourse.courseId || planCourse.course?.id}
                              className="text-xs text-white/80 flex items-center gap-2"
                            >
                              <CheckCircle className="h-3 w-3 text-green-400" />
                              {planCourse.course?.title || "Curso"}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Status *</Label>
                  <Select
                    value={subscriptionStatus}
                    onValueChange={setSubscriptionStatus}
                  >
                    <SelectTrigger className="bg-[#0a0a0a] border border-white/10 text-white focus:border-[#8b5cf6] focus:ring-[#8b5cf6]">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border border-white/10 z-[100002]" style={{ zIndex: 100002 }}>
                      <SelectItem value="active" className="text-white focus:bg-[#8b5cf6]">
                        Ativa
                      </SelectItem>
                      <SelectItem value="canceled" className="text-white focus:bg-[#8b5cf6]">
                        Cancelada
                      </SelectItem>
                      <SelectItem value="expired" className="text-white focus:bg-[#8b5cf6]">
                        Expirada
                      </SelectItem>
                      <SelectItem value="pending" className="text-white focus:bg-[#8b5cf6]">
                        Pendente
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">
                    Duração em meses (deixe vazio para vitalício)
                  </Label>
                  <Input
                    type="number"
                    value={subscriptionMonths}
                    onChange={(e) => setSubscriptionMonths(e.target.value)}
                    placeholder="Ex: 12"
                    min="1"
                    className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowSubscriptionModal(false)
                      setSubscriptionMonths("")
                    }}
                    className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Expiração */}
      {showExpirationModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4" style={{ zIndex: 100001 }}>
          <Card className="w-full h-full sm:w-[90vw] sm:h-auto sm:max-w-md sm:max-h-[90vh] flex flex-col bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-white/5 shadow-2xl rounded-none sm:rounded-lg relative" style={{ zIndex: 100002 }}>
            <CardHeader className="flex-shrink-0 border-b border-white/5 p-4 sm:p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg sm:text-xl text-white">Definir Expiração</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowExpirationModal(false)
                    setSelectedEnrollmentId(null)
                    setExpirationDays("")
                  }}
                  className="text-white/60 hover:text-white hover:bg-white/5"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!selectedEnrollmentId) return

                  const days = parseInt(expirationDays)
                  if (isNaN(days) || days <= 0) {
                    await notifyError("Dias inválidos", "Por favor, insira um número válido de dias")
                    return
                  }

                  const expiresAt = new Date(
                    Date.now() + days * 24 * 60 * 60 * 1000
                  )
                  handleUpdateEnrollment(selectedEnrollmentId, expiresAt)
                  setShowExpirationModal(false)
                  setSelectedEnrollmentId(null)
                  setExpirationDays("")
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-white/80">Dias de acesso</Label>
                  <Input
                    type="number"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(e.target.value)}
                    placeholder="Ex: 30"
                    required
                    min="1"
                    autoFocus
                    className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowExpirationModal(false)
                      setSelectedEnrollmentId(null)
                      setExpirationDays("")
                    }}
                    className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


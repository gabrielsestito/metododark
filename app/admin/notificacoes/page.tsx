"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notifySuccess, notifyError } from "@/lib/notifications"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  Search, 
  Users, 
  BookOpen, 
  User,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  GraduationCap,
  MessageSquare
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminNotificacoesPage() {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "admin_notice",
    courseId: "",
    userId: "",
    userName: "",
    target: "all", // all, course, user
  })
  const [userSearch, setUserSearch] = useState("")
  const [userResults, setUserResults] = useState<User[]>([])
  const [showUserResults, setShowUserResults] = useState(false)
  const [searchingUsers, setSearchingUsers] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const userSearchRef = useRef<HTMLDivElement>(null)
  const selectedUserRef = useRef<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetch("/api/admin/courses")
      .then((res) => res.json())
      .then((data) => setCourses(data))
      .catch((error) => console.error("Error fetching courses:", error))
  }, [])

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Buscar usuários
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Se o usuário já está selecionado e o texto corresponde ao nome formatado, não buscar
    if (selectedUserRef.current && userSearch === selectedUserRef.current.name) {
      setUserResults([])
      setShowUserResults(false)
      return
    }

    if (userSearch.length < 1) {
      setUserResults([])
      setShowUserResults(false)
      return
    }

    setSearchingUsers(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/users/search?search=${encodeURIComponent(userSearch)}&limit=10`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Search API error:", response.status, errorData)
          setUserResults([])
          setShowUserResults(false)
          return
        }
        const data = await response.json()
        if (Array.isArray(data)) {
          setUserResults(data)
          setShowUserResults(data.length > 0)
        } else {
          console.error("Invalid response format:", data)
          setUserResults([])
          setShowUserResults(false)
        }
      } catch (error) {
        console.error("Error searching users:", error)
        setUserResults([])
        setShowUserResults(false)
      } finally {
        setSearchingUsers(false)
      }
    }, 300)
  }, [userSearch])

  const handleSelectUser = (user: User) => {
    const displayText = `${user.name} (${user.email})`
    selectedUserRef.current = { id: user.id, name: displayText }
    setFormData({
      ...formData,
      userId: user.id,
      userName: displayText,
    })
    setUserSearch(displayText)
    setShowUserResults(false)
    setUserResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.message.trim()) {
      await notifyError("Campos obrigatórios", "Título e mensagem são obrigatórios")
      return
    }

    if (formData.target === "user" && !formData.userId) {
      await notifyError("Usuário não selecionado", "Por favor, selecione um usuário")
      return
    }

    if (formData.target === "course" && !formData.courseId) {
      await notifyError("Curso não selecionado", "Por favor, selecione um curso")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          courseId: formData.target === "course" ? formData.courseId : null,
          userId: formData.target === "user" ? formData.userId : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const message = data.message || `Notificação criada com sucesso! ${data.count || 0} notificação(ões) enviada(s).`
        await notifySuccess("Notificação criada", message)
        setFormData({
          title: "",
          message: "",
          type: "admin_notice",
          courseId: "",
          userId: "",
          userName: "",
          target: "all",
        })
        setUserSearch("")
      } else {
        const errorMsg = data.details || data.error || "Erro ao criar notificação"
        await notifyError("Erro", errorMsg)
        console.error("Error response:", data)
      }
    } catch (error: any) {
      console.error("Error creating notification:", error)
      await notifyError("Erro", `Erro ao criar notificação: ${error.message || "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "admin_notice":
        return <MessageSquare className="h-5 w-5 text-[#8b5cf6]" />
      default:
        return <Info className="h-5 w-5 text-[#8b5cf6]" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "admin_notice":
        return "from-[#8b5cf6]/20 to-purple-600/20 border-[#8b5cf6]/30"
      default:
        return "from-[#8b5cf6]/20 to-purple-600/20 border-[#8b5cf6]/30"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8">
          <Link href="/admin">
            <Button 
              variant="ghost" 
              className="mb-6 text-white/60 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-4">
            <Sparkles className="h-5 w-5 text-[#8b5cf6]" />
            <span className="text-sm font-semibold text-white/80">Notificações</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            Criar Notificação
          </h1>
          <p className="text-white/60 text-base sm:text-lg">
            Envie notificações para todos os usuários do sistema, alunos de um curso ou um usuário específico
          </p>
        </div>

        <Card className="bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30">
                <MessageSquare className="h-6 w-6 text-[#8b5cf6]" />
              </div>
              Nova Notificação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destinatário */}
              <div className="space-y-3">
                <Label className="text-white/90 font-semibold flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-[#8b5cf6]" />
                  Destinatário
                </Label>
                <Select
                  value={formData.target}
                  onValueChange={(value) => {
                    setFormData({ ...formData, target: value, userId: "", courseId: "", userName: "" })
                    setUserSearch("")
                    selectedUserRef.current = null
                    setUserResults([])
                    setShowUserResults(false)
                  }}
                >
                  <SelectTrigger className="bg-[#0a0a0a] border border-white/10 text-white h-12 hover:border-[#8b5cf6]/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-white/10">
                    <SelectItem value="all" className="text-white hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Todos os Usuários
                      </div>
                    </SelectItem>
                    <SelectItem value="course" className="text-white hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Alunos de um Curso
                      </div>
                    </SelectItem>
                    <SelectItem value="user" className="text-white hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Usuário Específico
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Seleção de Curso */}
              {formData.target === "course" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-white/90 font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    Curso
                  </Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                  >
                    <SelectTrigger className="bg-[#0a0a0a] border border-white/10 text-white h-12 hover:border-blue-500/50 transition-colors">
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f0f] border-white/10">
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id} className="text-white hover:bg-white/5 cursor-pointer">
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Busca de Usuário */}
              {formData.target === "user" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2" ref={userSearchRef}>
                  <Label className="text-white/90 font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-400" />
                    Usuário
                  </Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                      <Input
                        value={userSearch}
                        onChange={(e) => {
                          const newValue = e.target.value
                          // Se o usuário começar a digitar algo diferente do selecionado, limpar seleção
                          if (selectedUserRef.current && newValue !== selectedUserRef.current.name) {
                            selectedUserRef.current = null
                            setFormData(prev => ({
                              ...prev,
                              userId: "",
                              userName: "",
                            }))
                          }
                          setUserSearch(newValue)
                        }}
                        placeholder="Digite o nome ou email do usuário..."
                        className="pl-10 bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 h-12"
                      />
                      {userSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserSearch("")
                            selectedUserRef.current = null
                            setFormData(prev => ({ ...prev, userId: "", userName: "" }))
                            setUserResults([])
                            setShowUserResults(false)
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      {searchingUsers && (
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#8b5cf6]" />
                        </div>
                      )}
                    </div>
                    
                    {/* Resultados da busca */}
                    {showUserResults && userResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {userResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex items-center gap-3"
                          >
                            <div className="p-2 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/30">
                              <User className="h-4 w-4 text-[#8b5cf6]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold truncate">{user.name}</p>
                              <p className="text-white/60 text-sm truncate">{user.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {showUserResults && userSearch.length >= 1 && userResults.length === 0 && !searchingUsers && (
                      <div className="absolute z-50 w-full mt-2 bg-[#0f0f0f] border border-white/10 rounded-xl p-4 text-center text-white/60">
                        Nenhum usuário encontrado com &quot;{userSearch}&quot;
                      </div>
                    )}
                  </div>
                  
                  {formData.userName && (
                    <div className="p-3 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#8b5cf6]" />
                      <span className="text-sm text-white/80">Selecionado: {formData.userName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Título */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-white/90 font-semibold text-base">
                  Título *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ex: Nova aula disponível!"
                  className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 h-12"
                />
              </div>

              {/* Mensagem */}
              <div className="space-y-3">
                <Label htmlFor="message" className="text-white/90 font-semibold text-base">
                  Mensagem *
                </Label>
                <textarea
                  id="message"
                  className="flex min-h-[140px] w-full rounded-md border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] transition-all resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  placeholder="Digite a mensagem da notificação..."
                  rows={6}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-3">
                <Label className="text-white/90 font-semibold text-base flex items-center gap-2">
                  Tipo de Notificação
                </Label>
                <div className="bg-[#0a0a0a] border border-white/10 text-white h-12 rounded-md flex items-center gap-2 px-3">
                  {getTypeIcon("admin_notice")}
                  <span className="text-white/80">Aviso do Admin</span>
                </div>
              </div>

              {/* Preview do tipo */}
              <div className={`p-4 rounded-xl bg-gradient-to-r ${getTypeColor(formData.type)} border`}>
                <div className="flex items-start gap-3">
                  {getTypeIcon(formData.type)}
                  <div className="flex-1">
                    <p className="font-semibold text-white mb-1">
                      {formData.title || "Título da notificação"}
                    </p>
                    <p className="text-sm text-white/80">
                      {formData.message || "Mensagem da notificação aparecerá aqui..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão de envio */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/30 h-14 text-base font-semibold transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Enviar Notificação
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

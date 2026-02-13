"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit2, 
  X, 
  Upload, 
  File, 
  Download, 
  Loader2,
  BookOpen,
  PlayCircle,
  FileText,
  Video,
  Clock,
  CheckCircle2,
  Sparkles,
  Layers,
  Move,
  ChevronDown
} from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/notifications"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ContentManagerProps {
  course: {
    id: string
    modules: Array<{
      id: string
      title: string
      order: number
      lessons: Array<{
        id: string
        title: string
        order: number
        videoUrl: string | null
        duration: number | null
        isFreePreview: boolean
        content: string | null
      }>
    }>
  }
}

export function ContentManager({ course }: ContentManagerProps) {
  const router = useRouter()
  const [modules, setModules] = useState(course.modules)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  const [showAddModule, setShowAddModule] = useState(false)
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "module" | "lesson"; id: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Sincronizar módulos quando o curso mudar
  useEffect(() => {
    setModules(course.modules)
    // Expandir todos os módulos por padrão
    setExpandedModules(new Set(course.modules.map(m => m.id)))
  }, [course.modules])

  // Função para recarregar os dados do curso
  const reloadCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`)
      if (response.ok) {
        const updatedCourse = await response.json()
        setModules(updatedCourse.modules || [])
        setExpandedModules(new Set(updatedCourse.modules?.map((m: any) => m.id) || []))
      }
    } catch (error) {
      console.error("Error reloading course:", error)
    }
  }

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const handleAddModule = async (title: string) => {
    if (!title.trim()) {
      setError("O título do módulo é obrigatório")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/courses/${course.id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        await reloadCourse()
        setShowAddModule(false)
        router.refresh()
        await notifySuccess("Módulo adicionado", "Módulo criado com sucesso!")
      } else {
        const errorMsg = data.error || "Erro ao criar módulo"
        setError(errorMsg)
        await notifyError("Erro ao criar módulo", errorMsg)
      }
    } catch (error: any) {
      console.error("Error adding module:", error)
      const errorMsg = "Erro ao criar módulo. Tente novamente."
      setError(errorMsg)
      await notifyError("Erro", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLesson = async (moduleId: string, title: string) => {
    if (!title.trim()) {
      setError("O título da aula é obrigatório")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        await reloadCourse()
        setShowAddLesson(null)
        router.refresh()
        await notifySuccess("Aula adicionada", "Aula criada com sucesso!")
      } else {
        const errorMsg = data.error || "Erro ao criar aula"
        setError(errorMsg)
        await notifyError("Erro ao criar aula", errorMsg)
      }
    } catch (error: any) {
      console.error("Error adding lesson:", error)
      const errorMsg = "Erro ao criar aula. Tente novamente."
      setError(errorMsg)
      await notifyError("Erro", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        await reloadCourse()
        setDeleteConfirm(null)
        router.refresh()
        await notifySuccess("Módulo removido", "Módulo deletado com sucesso!")
      } else {
        const errorMsg = data.error || "Erro ao deletar módulo"
        setError(errorMsg)
        await notifyError("Erro ao deletar módulo", errorMsg)
      }
    } catch (error: any) {
      console.error("Error deleting module:", error)
      const errorMsg = "Erro ao deletar módulo. Tente novamente."
      setError(errorMsg)
      await notifyError("Erro", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        await reloadCourse()
        setDeleteConfirm(null)
        router.refresh()
        await notifySuccess("Aula removida", "Aula deletada com sucesso!")
      } else {
        const errorMsg = data.error || "Erro ao deletar aula"
        setError(errorMsg)
        await notifyError("Erro ao deletar aula", errorMsg)
      }
    } catch (error: any) {
      console.error("Error deleting lesson:", error)
      const errorMsg = "Erro ao deletar aula. Tente novamente."
      setError(errorMsg)
      await notifyError("Erro", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0)

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#8b5cf6]/30 border border-[#8b5cf6]/50">
              <Layers className="h-5 w-5 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{modules.length}</p>
              <p className="text-xs text-white/60">Módulos</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/30 border border-blue-500/50">
              <PlayCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{totalLessons}</p>
              <p className="text-xs text-white/60">Aulas</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/30 border border-green-500/50">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">
                {modules.reduce((acc, m) => acc + m.lessons.filter(l => l.isFreePreview).length, 0)}
              </p>
              <p className="text-xs text-white/60">Previews Grátis</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}

      {modules.length === 0 ? (
        <Card className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] border border-white/5">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Layers className="h-10 w-10 text-white/20" />
            </div>
            <p className="text-white/60 mb-2 font-semibold text-lg">Nenhum módulo cadastrado</p>
            <p className="text-sm text-white/40 mb-6">
              Adicione o primeiro módulo para começar a estruturar o conteúdo do curso
            </p>
            <Button
              onClick={() => setShowAddModule(true)}
              className="bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Módulo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.has(module.id)
            return (
              <Card 
                key={module.id}
                className="bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 hover:border-[#8b5cf6]/30 transition-all shadow-xl"
              >
                <CardHeader className="cursor-pointer" onClick={() => toggleModule(module.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-[#8b5cf6]/30 to-purple-600/30 border border-[#8b5cf6]/50">
                        <BookOpen className="h-6 w-6 text-[#8b5cf6]" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl text-white flex items-center gap-3">
                          <span className="text-2xl font-black text-[#8b5cf6]">#{module.order}</span>
                          {module.title}
                        </CardTitle>
                        <p className="text-sm text-white/60 mt-1">
                          {module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAddLesson(module.id)
                        }}
                        className="text-[#8b5cf6] hover:text-[#7c3aed] hover:bg-[#8b5cf6]/10"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Aula
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm({ type: "module", id: module.id })
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronDown className={`h-5 w-5 text-white/60 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3 mt-4">
                      {module.lessons.length === 0 ? (
                        <div className="text-center py-8 text-white/40">
                          <PlayCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma aula neste módulo</p>
                        </div>
                      ) : (
                        module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#8b5cf6]/30 transition-all"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="p-2 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex-shrink-0">
                                  <Move className="h-4 w-4 text-[#8b5cf6]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-[#8b5cf6] bg-[#8b5cf6]/20 px-2 py-0.5 rounded">
                                      Aula {lesson.order}
                                    </span>
                                    {lesson.isFreePreview && (
                                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 font-medium">
                                        Preview Grátis
                                      </span>
                                    )}
                                    {lesson.videoUrl && (
                                      <Video className="h-3 w-3 text-white/40" />
                                    )}
                                    {lesson.duration && (
                                      <span className="text-xs text-white/40 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {Math.floor(lesson.duration / 60)}m
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-semibold text-white text-base">
                                    {lesson.title}
                                  </p>
                                  {lesson.content && (
                                    <p className="text-xs text-white/50 mt-1 line-clamp-1">
                                      {lesson.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingLesson(lesson.id)}
                                  className="text-white/80 hover:text-[#8b5cf6] hover:bg-[#8b5cf6]/10"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm({ type: "lesson", id: lesson.id })}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddLesson(module.id)}
                      className="mt-4 w-full border-[#8b5cf6]/30 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 hover:text-[#7c3aed] hover:border-[#8b5cf6]/50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Aula ao Módulo
                    </Button>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Button 
        onClick={() => setShowAddModule(true)} 
        className="w-full bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/30 h-12 text-base font-semibold"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Novo Módulo
      </Button>

      {/* Modais */}
      {showAddModule && (
        <AddModuleModal
          onClose={() => setShowAddModule(false)}
          onConfirm={handleAddModule}
        />
      )}

      {showAddLesson && (
        <AddLessonModal
          moduleId={showAddLesson}
          onClose={() => setShowAddLesson(null)}
          onConfirm={handleAddLesson}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          type={deleteConfirm.type}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm.type === "module") {
              handleDeleteModule(deleteConfirm.id)
            } else {
              handleDeleteLesson(deleteConfirm.id)
            }
          }}
        />
      )}

      {editingLesson && (
        <LessonEditModal
          lessonId={editingLesson}
          onClose={() => setEditingLesson(null)}
          onReload={reloadCourse}
        />
      )}
    </div>
  )
}

function LessonEditModal({
  lessonId,
  onClose,
  onReload,
}: {
  lessonId: string
  onClose: () => void
  onReload: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    videoUrl: "",
    attachmentUrl: "",
    duration: "",
    isFreePreview: false,
    content: "",
  })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Buscar dados da aula
  useEffect(() => {
    if (!lessonId) {
      setError("ID da aula não fornecido")
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    const fetchLesson = async () => {
      try {
        const response = await fetch(`/api/admin/lessons/${lessonId}`)

        if (!response.ok) {
          throw new Error(`Erro ${response.status}`)
        }

        const data = await response.json()
        
        setFormData({
          title: data.title || "",
          videoUrl: data.videoUrl || "",
          attachmentUrl: data.attachmentUrl || "",
          duration: data.duration?.toString() || "",
          isFreePreview: data.isFreePreview || false,
          content: data.content || "",
        })
        setFetching(false)
      } catch (error: any) {
        console.error("Error fetching lesson:", error)
        setError("Erro ao carregar dados da aula.")
        setFetching(false)
      }
    }

    fetchLesson()
  }, [lessonId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError("O título da aula é obrigatório")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : null,
          attachmentUrl: formData.attachmentUrl || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await notifySuccess("Aula atualizada", "Aula atualizada com sucesso!")
        onReload()
        router.refresh()
        onClose()
      } else {
        const errorMsg = data.error || "Erro ao atualizar aula"
        setError(errorMsg)
        await notifyError("Erro ao atualizar aula", errorMsg)
      }
    } catch (error: any) {
      console.error("Error updating lesson:", error)
      setError("Erro ao atualizar aula. Tente novamente.")
      await notifyError("Erro", "Erro ao atualizar aula. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const [detectingDuration, setDetectingDuration] = useState(false)

  const detectVideoDuration = async (videoUrl: string) => {
    if (!videoUrl) return
    
    setDetectingDuration(true)
    setError(null)
    
    try {
      // Para YouTube e Vimeo, usar API route
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo.com')) {
        const response = await fetch('/api/admin/lessons/detect-duration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl }),
        })
        
        const data = await response.json()
        
        if (response.ok && data.duration) {
          setFormData({ ...formData, duration: data.duration.toString() })
          setDetectingDuration(false)
          notifySuccess("Duração detectada", `Duração: ${Math.floor(data.duration / 60)}:${String(data.duration % 60).padStart(2, '0')}`)
          return
        } else {
          const errorMsg = data.error || "Não foi possível detectar a duração automaticamente"
          setError(errorMsg)
          setDetectingDuration(false)
          notifyError("Erro ao detectar", errorMsg)
          return
        }
      }
      
      // Para outros vídeos (URLs diretas), tentar carregar via elemento video
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.crossOrigin = 'anonymous'
      video.src = videoUrl
      
      const handleLoadedMetadata = () => {
        if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
          setFormData({ ...formData, duration: Math.floor(video.duration).toString() })
        } else {
          setError("Não foi possível detectar a duração. Por favor, insira manualmente.")
        }
        setDetectingDuration(false)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('error', handleError)
      }
      
      const handleError = () => {
        setError("Não foi possível carregar o vídeo. Verifique a URL ou insira a duração manualmente.")
        setDetectingDuration(false)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('error', handleError)
      }
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('error', handleError)
      video.load()
      
      // Timeout após 15 segundos
      setTimeout(() => {
        if (detectingDuration) {
          setError("Tempo limite excedido. Por favor, insira a duração manualmente.")
          setDetectingDuration(false)
          video.removeEventListener('loadedmetadata', handleLoadedMetadata)
          video.removeEventListener('error', handleError)
        }
      }, 15000)
    } catch (error) {
      console.error("Error detecting video duration:", error)
      setError("Erro ao detectar duração. Por favor, insira manualmente.")
      setDetectingDuration(false)
    }
  }

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-3xl bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] border border-white/5 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#8b5cf6] mx-auto mb-4" />
            <p className="text-white/60">Carregando dados da aula...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 shadow-2xl my-8">
        <CardHeader className="sticky top-0 bg-[#0a0a0a] z-10 border-b border-white/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/30">
                <Edit2 className="h-5 w-5 text-[#8b5cf6]" />
              </div>
              Editar Aula
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <X className="h-4 w-4" />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-white/90 font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Título da Aula
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 h-12"
                placeholder="Ex: Introdução ao React Hooks"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/90 font-semibold flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  URL do Vídeo
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    onBlur={() => {
                      if (formData.videoUrl && !formData.duration) {
                        detectVideoDuration(formData.videoUrl)
                      }
                    }}
                    placeholder="YouTube, Vimeo, etc."
                    className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30"
                  />
                  {formData.videoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => detectVideoDuration(formData.videoUrl)}
                      disabled={detectingDuration}
                      className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {detectingDuration ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Detectando...
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Detectar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/90 font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duração (segundos)
                </Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Ex: 600"
                  className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30"
                />
                {formData.duration && (
                  <p className="text-xs text-white/50">
                    {Math.floor(parseInt(formData.duration) / 60)} minutos e {parseInt(formData.duration) % 60} segundos
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/90 font-semibold flex items-center gap-2">
                <File className="h-4 w-4" />
                Anexo/Arquivo
              </Label>
              <div className="flex gap-2">
                <Input
                  value={formData.attachmentUrl}
                  onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                  placeholder="URL do arquivo ou faça upload"
                  className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.zip,.doc,.docx,.txt,.rar,.7z,.tar"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    setUploading(true)
                    try {
                      const uploadFormData = new FormData()
                      uploadFormData.append("file", file)

                      const response = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: uploadFormData,
                      })

                      const data = await response.json()
                      if (response.ok && data.url) {
                        setFormData({ ...formData, attachmentUrl: data.url })
                        await notifySuccess("Upload concluído", "Arquivo enviado com sucesso!")
                      } else {
                        const msg = data.error || "Erro ao fazer upload do arquivo"
                        await notifyError("Erro", msg)
                      }
                    } catch (error) {
                      console.error("Upload error:", error)
                      await notifyError("Erro", "Erro ao fazer upload do arquivo")
                    } finally {
                      setUploading(false)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white whitespace-nowrap"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              {formData.attachmentUrl && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/30">
                  <File className="h-4 w-4 text-[#8b5cf6]" />
                  <a
                    href={formData.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#8b5cf6] hover:underline flex items-center gap-1"
                  >
                    Ver arquivo
                    <Download className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-white/90 font-semibold">Descrição/Conteúdo</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] transition-all"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Descrição ou conteúdo adicional da aula..."
                rows={5}
              />
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-[#8b5cf6]/10 to-purple-500/10 border border-[#8b5cf6]/20">
              <input
                type="checkbox"
                checked={formData.isFreePreview}
                onChange={(e) => setFormData({ ...formData, isFreePreview: e.target.checked })}
                className="h-5 w-5 accent-[#8b5cf6] cursor-pointer"
              />
              <div>
                <Label className="text-white font-semibold cursor-pointer">Preview Grátis</Label>
                <p className="text-xs text-white/60 mt-0.5">
                  Esta aula ficará disponível gratuitamente para todos os usuários
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/30 h-12 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white h-12"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function AddModuleModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: (title: string) => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    setLoading(true)
    await onConfirm(title)
    setLoading(false)
    if (title.trim()) {
      setTitle("")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/30">
                <Layers className="h-5 w-5 text-[#8b5cf6]" />
              </div>
              Adicionar Módulo
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/90 font-semibold">Título do Módulo</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Introdução ao React"
                required
                autoFocus
                className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 h-12"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                disabled={loading || !title.trim()}
                className="flex-1 bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/30 h-11 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white h-11"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function AddLessonModal({
  moduleId,
  onClose,
  onConfirm,
}: {
  moduleId: string
  onClose: () => void
  onConfirm: (moduleId: string, title: string) => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    setLoading(true)
    await onConfirm(moduleId, title)
    setLoading(false)
    if (title.trim()) {
      setTitle("")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                <PlayCircle className="h-5 w-5 text-blue-400" />
              </div>
              Adicionar Aula
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/90 font-semibold">Título da Aula</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Configurando o ambiente"
                required
                autoFocus
                className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 h-12"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                disabled={loading || !title.trim()}
                className="flex-1 bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/30 h-11 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white h-11"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function DeleteConfirmModal({
  type,
  onClose,
  onConfirm,
}: {
  type: "module" | "lesson"
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-red-500/30 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-red-400 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              Confirmar Exclusão
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-white/80 mb-6">
            Tem certeza que deseja deletar este {type === "module" ? "módulo" : "aula"}? 
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 border-0 h-11 font-semibold"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white h-11"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

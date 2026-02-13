"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckSquare, Square, X } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/notifications"

interface SubscriptionPlanFormProps {
  plan?: {
    id: string
    name: string
    price: number
    isActive: boolean
    courses?: Array<{ 
      courseId: string
      course?: { id: string; title: string }
    }>
  } | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function SubscriptionPlanForm({ plan, onSuccess, onCancel }: SubscriptionPlanFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [fetchingCourses, setFetchingCourses] = useState(true)
  const [formData, setFormData] = useState({
    name: plan?.name || "Assinatura Mensal",
    price: plan?.price.toString() || "29.90",
  })

  useEffect(() => {
    // Buscar cursos disponíveis
    fetch("/api/admin/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data)
        // Se já existe um plano, marcar os cursos selecionados
        if (plan?.courses) {
          const courseIds = plan.courses
            .map((c: any) => c.courseId || c.course?.id)
            .filter((id: string) => id) // Filtrar valores undefined/null
          setSelectedCourses(new Set(courseIds))
        }
      })
      .catch((error) => console.error("Error fetching courses:", error))
      .finally(() => setFetchingCourses(false))
  }, [plan])

  const handleToggleCourse = (courseId: string) => {
    const newSelected = new Set(selectedCourses)
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId)
    } else {
      newSelected.add(courseId)
    }
    setSelectedCourses(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedCourses.size === courses.length) {
      setSelectedCourses(new Set())
    } else {
      setSelectedCourses(new Set(courses.map((c) => c.id)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = "/api/admin/subscription-plan"
      const method = plan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(plan && { id: plan.id }),
          ...formData,
          price: parseFloat(formData.price),
          isActive: true,
          courseIds: Array.from(selectedCourses),
        }),
      })

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
        await notifySuccess("Sucesso", "Plano de assinatura salvo com sucesso!")
      } else {
        const data = await response.json()
        await notifyError("Erro", data.error || "Erro ao salvar plano")
      }
    } catch (error) {
      console.error("Error saving plan:", error)
      await notifyError("Erro", "Erro ao salvar plano")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-[#0a0a0a] border border-white/5">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-white">
            {plan ? "Editar" : "Criar"} Plano de Assinatura
          </CardTitle>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80">Nome do Plano *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-white/80">Preço Mensal (R$) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Cursos Incluídos na Assinatura</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white text-xs"
              >
                {selectedCourses.size === courses.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
            </div>
            {fetchingCourses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#8b5cf6]" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 p-3 rounded-lg bg-[#0a0a0a] border border-white/10">
                {courses.length === 0 ? (
                  <p className="text-white/60 text-sm text-center py-4">
                    Nenhum curso disponível
                  </p>
                ) : (
                  courses.map((course) => (
                    <label
                      key={course.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourses.has(course.id)}
                        onChange={() => handleToggleCourse(course.id)}
                        className="hidden"
                      />
                      {selectedCourses.has(course.id) ? (
                        <CheckSquare className="h-5 w-5 text-[#8b5cf6] flex-shrink-0" />
                      ) : (
                        <Square className="h-5 w-5 text-white/40 flex-shrink-0" />
                      )}
                      <span className="text-sm text-white/80">{course.title}</span>
                    </label>
                  ))
                )}
              </div>
            )}
            <p className="text-xs text-white/60">
              {selectedCourses.size} curso(s) selecionado(s)
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading || selectedCourses.size === 0}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Plano"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


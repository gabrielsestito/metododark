"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notifyError, notifySuccess } from "@/lib/notifications"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, X, Sparkles, DollarSign, Tag, Image as ImageIcon, Video, BookOpen, FileText } from "lucide-react"

interface CourseFormProps {
  course?: {
    id: string
    title: string
    slug: string
    subtitle: string | null
    description: string | null
    thumbnailUrl: string | null
    trailerUrl: string | null
    price: number
    promoPrice: number | null
    level: string
    category: string
    isPublished: boolean
  }
}

export function CourseForm({ course }: CourseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: course?.title || "",
    subtitle: course?.subtitle || "",
    description: course?.description || "",
    thumbnailUrl: course?.thumbnailUrl || "",
    trailerUrl: course?.trailerUrl || "",
    price: course?.price.toString() || "",
    promoPrice: course?.promoPrice?.toString() || "",
    level: course?.level || "INICIANTE",
    category: course?.category || "PROGRAMACAO",
    isPublished: course?.isPublished || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = course
        ? `/api/admin/courses/${course.id}`
        : "/api/admin/courses"
      const method = course ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          promoPrice: formData.promoPrice
            ? parseFloat(formData.promoPrice)
            : null,
        }),
      })

      if (response.ok) {
        await notifySuccess("Sucesso", course ? "Curso atualizado com sucesso!" : "Curso criado com sucesso!")
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push("/admin/cursos")
        router.refresh()
      } else {
        const errorData = await response.json()
        await notifyError("Erro", errorData.error || "Erro ao salvar curso")
      }
    } catch (error) {
      console.error("Error saving course:", error)
      await notifyError("Erro", "Erro ao salvar curso")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Informações Básicas */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-purple-600">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Informações Básicas</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white/90 font-semibold flex items-center gap-2">
              <span>Título *</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 transition-all h-12"
              placeholder="Ex: Curso Completo de React"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle" className="text-white/90 font-semibold">Subtítulo</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) =>
                setFormData({ ...formData, subtitle: e.target.value })
              }
              className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 transition-all h-12"
              placeholder="Ex: Aprenda React do zero ao avançado"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-white/90 font-semibold">Descrição</Label>
          <textarea
            id="description"
            className="flex min-h-[120px] w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={6}
            placeholder="Descreva o curso em detalhes..."
          />
        </div>
      </div>

      {/* Preços */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Preços</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-white/90 font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Preço *</span>
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
              className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 transition-all h-12"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoPrice" className="text-white/90 font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>Preço Promocional</span>
            </Label>
            <Input
              id="promoPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.promoPrice}
              onChange={(e) =>
                setFormData({ ...formData, promoPrice: e.target.value })
              }
              className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 transition-all h-12"
              placeholder="0.00 (opcional)"
            />
            {formData.promoPrice && parseFloat(formData.promoPrice) >= parseFloat(formData.price) && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <X className="h-3 w-3" />
                O preço promocional deve ser menor que o preço normal
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Categoria e Nível */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Categoria e Nível</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-white/90 font-semibold">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger className="bg-[#0a0a0a] border border-white/10 text-white h-12 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-white/10">
                <SelectItem value="PROGRAMACAO" className="text-white">Programação</SelectItem>
                <SelectItem value="DESIGN" className="text-white">Design</SelectItem>
                <SelectItem value="MARKETING" className="text-white">Marketing</SelectItem>
                <SelectItem value="NEGOCIOS" className="text-white">Negócios</SelectItem>
                <SelectItem value="OUTROS" className="text-white">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level" className="text-white/90 font-semibold">Nível *</Label>
            <Select
              value={formData.level}
              onValueChange={(value) =>
                setFormData({ ...formData, level: value })
              }
            >
              <SelectTrigger className="bg-[#0a0a0a] border border-white/10 text-white h-12 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-white/10">
                <SelectItem value="INICIANTE" className="text-white">Iniciante</SelectItem>
                <SelectItem value="INTERMEDIARIO" className="text-white">Intermediário</SelectItem>
                <SelectItem value="AVANCADO" className="text-white">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* URLs de Mídia */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Mídia</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl" className="text-white/90 font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>URL da Thumbnail</span>
            </Label>
            <Input
              id="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={(e) =>
                setFormData({ ...formData, thumbnailUrl: e.target.value })
              }
              placeholder="https://..."
              className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 transition-all h-12"
            />
            {formData.thumbnailUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-white/10 relative w-full h-32">
                <Image 
                  src={formData.thumbnailUrl} 
                  alt="Preview" 
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trailerUrl" className="text-white/90 font-semibold flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>URL do Trailer</span>
            </Label>
            <Input
              id="trailerUrl"
              value={formData.trailerUrl}
              onChange={(e) =>
                setFormData({ ...formData, trailerUrl: e.target.value })
              }
              placeholder="https://..."
              className="bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/30 transition-all h-12"
            />
          </div>
        </div>
      </div>

      {/* Publicação */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Publicação</h2>
        </div>

        <div className="flex items-center space-x-3 p-6 rounded-xl bg-gradient-to-br from-[#8b5cf6]/10 to-purple-600/10 border-2 border-[#8b5cf6]/30">
          <input
            type="checkbox"
            id="isPublished"
            checked={formData.isPublished}
            onChange={(e) =>
              setFormData({ ...formData, isPublished: e.target.checked })
            }
            className="h-5 w-5 accent-[#8b5cf6] cursor-pointer"
          />
          <Label htmlFor="isPublished" className="text-white/90 font-semibold cursor-pointer flex-1">
            Publicar curso
          </Label>
          {formData.isPublished && (
            <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-semibold">
              Visível para todos
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
        <Button 
          type="submit" 
          disabled={loading || !!(formData.promoPrice && parseFloat(formData.promoPrice) >= parseFloat(formData.price))}
          className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 px-8 shadow-lg shadow-[#8b5cf6]/20 flex-1 sm:flex-none"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              {course ? "Atualizar Curso" : "Criar Curso"}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/cursos")}
          className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white h-12 px-8"
        >
          <X className="mr-2 h-5 w-5" />
          Cancelar
        </Button>
      </div>
    </form>
  )
}

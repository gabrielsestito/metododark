"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Search, Filter, X, Play, Sparkles, BookOpen, Grid3x3, List, TrendingUp, Star, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CursosPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlSearch = searchParams.get("search") || ""
  const urlCategory = searchParams.get("category") || "all"
  const urlLevel = searchParams.get("level") || "all"
  
  const [search, setSearch] = useState(urlSearch)
  const [category, setCategory] = useState(urlCategory)
  const [level, setLevel] = useState(urlLevel)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    setSearch(urlSearch)
    setCategory(urlCategory)
    setLevel(urlLevel)
  }, [urlSearch, urlCategory, urlLevel])

  useEffect(() => {
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const currentSearch = searchParams.get("search") || ""
      const currentCategory = searchParams.get("category") || "all"
      const currentLevel = searchParams.get("level") || "all"
      
      if (currentSearch) params.append("search", currentSearch)
      if (currentCategory !== "all") params.append("category", currentCategory)
      if (currentLevel !== "all") params.append("level", currentLevel)

      console.log("[CursosPage] Buscando cursos:", params.toString())
      
      const response = await fetch(`/api/courses?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[CursosPage] Erro na resposta:", response.status, errorData)
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`[CursosPage] Recebidos ${Array.isArray(data) ? data.length : 0} cursos`)
      
      if (Array.isArray(data)) {
        setCourses(data)
      } else if (data.error) {
        console.error("[CursosPage] Erro retornado pela API:", data.error)
        setCourses([])
      } else {
        console.warn("[CursosPage] Resposta inesperada:", data)
        setCourses([])
      }
    } catch (error: any) {
      console.error("[CursosPage] Erro ao buscar cursos:", error)
      console.error("[CursosPage] Mensagem:", error?.message)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (category !== "all") params.append("category", category)
    if (level !== "all") params.append("level", level)
    router.push(`/cursos?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch("")
    setCategory("all")
    setLevel("all")
    router.push("/cursos")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 w-fit">
            <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
            <span className="text-xs font-medium text-white/80">Catálogo</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            Cursos
          </h1>
          <p className="text-white/60 text-base sm:text-lg">Explore nossa biblioteca completa de cursos</p>
        </div>

        <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6 lg:p-8">
          {/* Search and Filters Bar */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Busque por assuntos, aulas e pessoas"
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6]/50 h-12"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("")
                        router.push("/cursos")
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/5 rounded transition-colors"
                    >
                      <X className="h-4 w-4 text-white/40" />
                    </button>
                  )}
                </div>
              </form>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`border-white/10 text-white/80 hover:bg-white/5 hover:text-white ${
                    showFilters || category !== "all" || level !== "all" ? "border-[#8b5cf6]/50 bg-[#8b5cf6]/10" : ""
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {(category !== "all" || level !== "all") && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#8b5cf6] text-white text-xs font-bold">
                      {(category !== "all" ? 1 : 0) + (level !== "all" ? 1 : 0)}
                    </span>
                  )}
                </Button>
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={`h-8 px-3 ${viewMode === "grid" ? "bg-[#8b5cf6] text-white" : "text-white/60 hover:text-white"}`}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`h-8 px-3 ${viewMode === "list" ? "bg-[#8b5cf6] text-white" : "text-white/60 hover:text-white"}`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(category !== "all" || level !== "all" || search) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-white/60">Filtros ativos:</span>
                {search && (
                  <span className="px-3 py-1 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 text-white/80 text-xs font-medium flex items-center gap-2">
                    {search}
                    <button
                      onClick={() => {
                        setSearch("")
                        const params = new URLSearchParams()
                        if (category !== "all") params.append("category", category)
                        if (level !== "all") params.append("level", level)
                        router.push(`/cursos?${params.toString()}`)
                      }}
                      className="hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {category !== "all" && (
                  <span className="px-3 py-1 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 text-white/80 text-xs font-medium flex items-center gap-2">
                    {category}
                    <button
                      onClick={() => {
                        setCategory("all")
                        const params = new URLSearchParams()
                        if (search) params.append("search", search)
                        if (level !== "all") params.append("level", level)
                        router.push(`/cursos?${params.toString()}`)
                      }}
                      className="hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {level !== "all" && (
                  <span className="px-3 py-1 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 text-white/80 text-xs font-medium flex items-center gap-2">
                    {level}
                    <button
                      onClick={() => {
                        setLevel("all")
                        const params = new URLSearchParams()
                        if (search) params.append("search", search)
                        if (category !== "all") params.append("category", category)
                        router.push(`/cursos?${params.toString()}`)
                      }}
                      className="hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-white/60 hover:text-white h-auto py-1"
                >
                  Limpar tudo
                </Button>
              </div>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-6 p-5 bg-[#0a0a0a] border border-white/5 rounded-xl">
              <div className="flex flex-col md:flex-row gap-4">
                <Select 
                  value={category} 
                  onValueChange={(value) => {
                    setCategory(value)
                    const params = new URLSearchParams()
                    if (search) params.append("search", search)
                    if (value !== "all") params.append("category", value)
                    if (level !== "all") params.append("level", level)
                    router.push(`/cursos?${params.toString()}`)
                  }}
                >
                  <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10 text-white hover:border-[#8b5cf6]/50">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-white/10">
                    <SelectItem value="all" className="text-white">Todas as categorias</SelectItem>
                    <SelectItem value="PROGRAMACAO" className="text-white">Programação</SelectItem>
                    <SelectItem value="DESIGN" className="text-white">Design</SelectItem>
                    <SelectItem value="MARKETING" className="text-white">Marketing</SelectItem>
                    <SelectItem value="NEGOCIOS" className="text-white">Negócios</SelectItem>
                    <SelectItem value="OUTROS" className="text-white">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={level} 
                  onValueChange={(value) => {
                    setLevel(value)
                    const params = new URLSearchParams()
                    if (search) params.append("search", search)
                    if (category !== "all") params.append("category", category)
                    if (value !== "all") params.append("level", value)
                    router.push(`/cursos?${params.toString()}`)
                  }}
                >
                  <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10 text-white hover:border-[#8b5cf6]/50">
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-white/10">
                    <SelectItem value="all" className="text-white">Todos os níveis</SelectItem>
                    <SelectItem value="INICIANTE" className="text-white">Iniciante</SelectItem>
                    <SelectItem value="INTERMEDIARIO" className="text-white">Intermediário</SelectItem>
                    <SelectItem value="AVANCADO" className="text-white">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Courses Grid/List */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mb-4"></div>
              <p className="text-white/60">Carregando cursos...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block p-6 rounded-full bg-gradient-to-br from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-4">
                <Search className="h-16 w-16 text-[#8b5cf6]" />
              </div>
              <p className="text-white/60 text-lg mb-2">Nenhum curso encontrado</p>
              <p className="text-white/40 text-sm mb-4">Tente ajustar os filtros de busca</p>
              {(category !== "all" || level !== "all" || search) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-white/10 text-white/80 hover:bg-white/5"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-white/60 text-sm">
                  {courses.length} {courses.length === 1 ? "curso encontrado" : "cursos encontrados"}
                </p>
              </div>
              
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {courses.map((course) => (
                    <Link key={course.id} href={`/curso/${course.slug}`}>
                      <div className="group bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden hover:border-[#8b5cf6]/50 transition-all cursor-pointer h-full flex flex-col transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#8b5cf6]/10">
                        {course.thumbnailUrl && (
                          <div className="relative h-48 w-full overflow-hidden">
                            <Image
                              src={course.thumbnailUrl}
                              alt={course.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                              <div className="flex items-center gap-2 text-xs text-white/90">
                                <Play className="h-3.5 w-3.5" />
                                <span className="font-semibold">CURSO</span>
                              </div>
                            </div>
                            <div className="absolute top-3 right-3">
                              <span className="px-2 py-1 rounded bg-[#8b5cf6]/80 backdrop-blur-sm text-white text-xs font-semibold">
                                {course.level}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-white/40 uppercase tracking-wider">{course.category}</span>
                          </div>
                          <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-[#8b5cf6] transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-white/60 mb-4 line-clamp-2 flex-1">{course.subtitle}</p>
                          <div className="mt-auto pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-black text-white">
                                {course.promoPrice ? (
                                  <>
                                    <span className="line-through text-white/40 text-sm mr-2">
                                      R$ {course.price.toFixed(2).replace('.', ',')}
                                    </span>
                                    R$ {course.promoPrice.toFixed(2).replace('.', ',')}
                                  </>
                                ) : (
                                  `R$ ${course.price.toFixed(2).replace('.', ',')}`
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <Link key={course.id} href={`/curso/${course.slug}`}>
                      <div className="group bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden hover:border-[#8b5cf6]/50 transition-all cursor-pointer p-6 flex flex-col md:flex-row gap-6">
                        {course.thumbnailUrl && (
                          <div className="relative w-full md:w-64 h-48 md:h-32 flex-shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={course.thumbnailUrl}
                              alt={course.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-white/40 uppercase tracking-wider">{course.category}</span>
                              <span className="text-xs text-white/40">•</span>
                              <span className="text-xs text-white/40">{course.level}</span>
                            </div>
                            <h3 className="font-bold text-white mb-2 group-hover:text-[#8b5cf6] transition-colors text-xl">
                              {course.title}
                            </h3>
                            <p className="text-sm text-white/60 mb-4 line-clamp-2">{course.subtitle}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-black text-white">
                              {course.promoPrice ? (
                                <>
                                  <span className="line-through text-white/40 text-sm mr-2">
                                    R$ {course.price.toFixed(2).replace('.', ',')}
                                  </span>
                                  R$ {course.promoPrice.toFixed(2).replace('.', ',')}
                                </>
                              ) : (
                                `R$ ${course.price.toFixed(2).replace('.', ',')}`
                              )}
                            </span>
                            <Button className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0">
                              Ver Curso
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

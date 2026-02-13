import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles, ArrowLeft, Edit2, FileText, BookOpen, TrendingUp, Users, Eye, EyeOff, MessageSquare } from "lucide-react"
import Image from "next/image"
import { isAdminRole, getPermissions } from "@/lib/permissions"
import { DeleteCourseButton } from "@/components/admin/delete-course-button"

export default async function AdminCursosPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/")
  }

  const permissions = getPermissions(session.user.role)
  if (!permissions.canManageCourses) {
    redirect("/admin")
  }

  const [courses, stats] = await Promise.all([
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          }
        }
      }
    }),
    Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.course.count({ where: { isPublished: false } }),
      prisma.enrollment.count(),
    ]).then(([total, published, drafts, enrollments]) => ({
      total,
      published,
      drafts,
      enrollments,
    }))
  ])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <Link href="/admin">
              <Button 
                variant="ghost" 
                className="mb-4 text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-4">
              <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
              <span className="text-xs font-medium text-white/80">Gerenciamento</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Cursos
            </h1>
            <p className="text-white/60 text-base sm:text-lg">Gerencie todos os cursos da plataforma</p>
          </div>
          <Link href="/admin/cursos/novo">
            <Button className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/20">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Novo Curso</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-white/60 mb-1">Total de Cursos</p>
            <p className="text-3xl font-black text-white">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <Eye className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-white/60 mb-1">Publicados</p>
            <p className="text-3xl font-black text-green-400">{stats.published}</p>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                <EyeOff className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-white/60 mb-1">Rascunhos</p>
            <p className="text-3xl font-black text-orange-400">{stats.drafts}</p>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-white/60 mb-1">Matrículas</p>
            <p className="text-3xl font-black text-blue-400">{stats.enrollments}</p>
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-12 text-center">
            <div className="inline-block p-6 rounded-full bg-gradient-to-br from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-4">
              <FileText className="h-12 w-12 text-[#8b5cf6]" />
            </div>
            <p className="text-white/60 text-lg mb-4">Nenhum curso criado ainda</p>
            <Link href="/admin/cursos/novo">
              <Button className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Curso
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group relative bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#8b5cf6]/10"
              >
                {/* Thumbnail */}
                {course.thumbnailUrl ? (
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${
                          course.isPublished
                            ? "bg-green-500/80 text-white border-green-400/50"
                            : "bg-white/20 text-white border-white/30"
                        }`}
                      >
                        {course.isPublished ? "Publicado" : "Rascunho"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-[#8b5cf6]/20 to-purple-600/20 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-[#8b5cf6]/50" />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-[#8b5cf6] transition-colors">
                    {course.title}
                  </h3>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-white/60 mb-1">Módulos</p>
                      <p className="text-lg font-black text-white">{course._count.modules}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-white/60 mb-1">Matrículas</p>
                      <p className="text-lg font-black text-white">{course._count.enrollments}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-[#8b5cf6]/10 to-purple-600/10 border border-[#8b5cf6]/20">
                    <p className="text-xs text-white/60 mb-1">Preço</p>
                    <div className="flex items-baseline gap-2">
                      {course.promoPrice && course.promoPrice < course.price && (
                        <span className="text-sm text-white/50 line-through">
                          R$ {course.price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <p className="text-2xl font-black bg-gradient-to-r from-[#8b5cf6] to-purple-600 bg-clip-text text-transparent">
                        R$ {(course.promoPrice || course.price).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Link href={`/admin/cursos/${course.id}`} className="flex-1">
                        <Button 
                          variant="outline" 
                          className="w-full border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <Link
                        href={`/admin/cursos/${course.id}/conteudo`}
                        className="flex-1"
                      >
                        <Button 
                          className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Conteúdo
                        </Button>
                      </Link>
                    </div>
                    {/* Botão de exclusão apenas para CEO */}
                    {session.user.role === "CEO" && (
                      <DeleteCourseButton 
                        courseId={course.id} 
                        courseTitle={course.title}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { CourseForm } from "@/components/admin/course-form"
import { ArrowLeft, Sparkles, BookOpen, Edit2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export default async function AdminCursoEditPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/")
  }

  const permissions = getPermissions(session.user.role)
  if (!permissions.canManageCourses) {
    redirect("/admin")
  }

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          enrollments: true,
          modules: true,
        },
      },
    },
  })

  if (!course) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link href="/admin/cursos">
            <Button 
              variant="ghost" 
              className="w-fit text-white/60 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Cursos
            </Button>
          </Link>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 w-fit">
            <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
            <span className="text-xs font-medium text-white/80">Edição de Curso</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            Editar Curso
          </h1>
          <p className="text-white/60 text-base sm:text-lg">Atualize as informações do curso abaixo</p>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-purple-600">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs text-white/60">Módulos</span>
            </div>
            <p className="text-2xl font-black text-white">{course._count.modules}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <Edit2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs text-white/60">Matrículas</span>
            </div>
            <p className="text-2xl font-black text-green-400">{course._count.enrollments}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                <span className="text-xs text-white font-bold">R$</span>
              </div>
              <span className="text-xs text-white/60">Preço</span>
            </div>
            <p className="text-2xl font-black text-blue-400">
              {course.promoPrice ? (
                <>
                  <span className="line-through text-white/40 text-sm mr-1">
                    {course.price.toFixed(2).replace('.', ',')}
                  </span>
                  {course.promoPrice.toFixed(2).replace('.', ',')}
                </>
              ) : (
                course.price.toFixed(2).replace('.', ',')
              )}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${course.isPublished ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
                <span className="text-xs text-white font-bold">●</span>
              </div>
              <span className="text-xs text-white/60">Status</span>
            </div>
            <p className={`text-2xl font-black ${course.isPublished ? 'text-green-400' : 'text-orange-400'}`}>
              {course.isPublished ? 'Publicado' : 'Rascunho'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6 lg:p-8">
          <CourseForm course={course} />
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Ações Rápidas</h3>
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/cursos/${course.id}/conteudo`}>
              <Button 
                variant="outline"
                className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Gerenciar Conteúdo
              </Button>
            </Link>
            <Link href={`/curso/${course.slug}`} target="_blank">
              <Button 
                variant="outline"
                className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Ver Curso
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

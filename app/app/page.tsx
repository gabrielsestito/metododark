import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Play, Clock, BookOpen, ArrowRight, Sparkles, TrendingUp, Award, Zap, CheckCircle2 } from "lucide-react"

export default async function AppPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  // Calcular progresso para cada curso
  const coursesWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const totalLessons = enrollment.course.modules.reduce(
        (acc, module) => acc + module.lessons.length,
        0
      )

      const completedLessons = await prisma.lessonProgress.count({
        where: {
          userId: session.user.id,
          completed: true,
          lesson: {
            module: {
              courseId: enrollment.course.id,
            },
          },
        },
      })

      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      return {
        ...enrollment.course,
        progress,
        totalLessons,
        completedLessons,
      }
    })
  )

  // Calcular estatísticas gerais
  const totalProgress = coursesWithProgress.reduce((acc, course) => acc + course.progress, 0)
  const averageProgress = coursesWithProgress.length > 0 ? totalProgress / coursesWithProgress.length : 0
  const totalCompleted = coursesWithProgress.reduce((acc, course) => acc + course.completedLessons, 0)
  const totalLessons = coursesWithProgress.reduce((acc, course) => acc + course.totalLessons, 0)
  const completedCourses = coursesWithProgress.filter(c => c.progress === 100).length

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl space-y-7 sm:space-y-9">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-4">
              <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
              <span className="text-xs font-medium text-white/80">Meus Cursos</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Meus Cursos
            </h1>
            <p className="text-white/60 text-sm sm:text-base md:text-lg">Continue de onde parou</p>
          </div>
          <Link href="/cursos">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 px-6 shadow-lg shadow-[#8b5cf6]/20">
              <BookOpen className="h-4 w-4 mr-2" />
              Explorar Cursos
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {coursesWithProgress.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-purple-600">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-white/60 mb-1">Cursos</p>
              <p className="text-3xl font-black text-white">{coursesWithProgress.length}</p>
            </div>

            <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-white/60 mb-1">Progresso Médio</p>
              <p className="text-3xl font-black text-green-400">{Math.round(averageProgress)}%</p>
            </div>

            <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-white/60 mb-1">Concluídos</p>
              <p className="text-3xl font-black text-blue-400">{completedCourses}</p>
            </div>

            <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                  <Play className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-white/60 mb-1">Aulas Totais</p>
              <p className="text-3xl font-black text-purple-400">{totalLessons}</p>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6 lg:p-8">
          {coursesWithProgress.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block p-6 rounded-full bg-gradient-to-br from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-6">
                <BookOpen className="h-16 w-16 text-[#8b5cf6]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                Você ainda não possui cursos
              </h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                Explore nossa biblioteca e encontre o curso perfeito para você
              </p>
              <Link href="/cursos">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 px-8 shadow-lg shadow-[#8b5cf6]/20"
                >
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Explorar Cursos
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Seus Cursos</h2>
                <span className="text-sm text-white/60">{coursesWithProgress.length} curso{coursesWithProgress.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
                {coursesWithProgress.map((course) => (
                    <Link key={course.id} href={`/app/curso/${course.slug}`}>
                      <div className="group bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-[#8b5cf6]/50 hover:shadow-xl hover:shadow-[#8b5cf6]/10 transition-all cursor-pointer h-full flex flex-col transform hover:scale-[1.02]">
                        {course.thumbnailUrl && (
                          <div className="relative h-56 sm:h-48 w-full overflow-hidden">
                            <Image
                              src={course.thumbnailUrl}
                              alt={course.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="absolute top-3 right-3">
                              <div className={`px-3 py-1.5 rounded-full backdrop-blur-sm text-white text-xs font-bold shadow-lg ${
                                course.progress === 100 
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600"
                                  : "bg-gradient-to-r from-[#8b5cf6] to-purple-600"
                              }`}>
                                {course.progress === 100 ? (
                                  <div className="flex items-center gap-1">
                                    <Award className="h-3 w-3" />
                                    <span>100%</span>
                                  </div>
                                ) : (
                                  `${Math.round(course.progress)}%`
                                )}
                              </div>
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <div className="flex items-center gap-2 text-xs text-white/90">
                                <Play className="h-3.5 w-3.5" />
                                <span className="font-semibold">CURSO</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="p-5 sm:p-6 flex-1 flex flex-col">
                          <h3 className="font-bold text-white mb-3 line-clamp-2 group-hover:text-[#8b5cf6] transition-colors text-base sm:text-lg">
                            {course.title}
                          </h3>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-white/50 font-medium">Progresso</span>
                            <span className="font-bold text-white/70">
                              {course.completedLessons}/{course.totalLessons} aulas
                            </span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                course.progress === 100
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600"
                                  : "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed]"
                              }`}
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-white/50 mb-5">
                          <div className="flex items-center gap-1.5">
                            <Play className="h-3.5 w-3.5" />
                            <span className="font-medium">{course.totalLessons} aulas</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-medium">Acesso vitalício</span>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <Button 
                          className={`w-full border-0 mt-auto h-11 font-semibold shadow-lg ${
                            course.progress === 100
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/20"
                              : "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] shadow-[#8b5cf6]/20"
                          } text-white`}
                        >
                          {course.progress === 100 ? (
                            <>
                              <Award className="h-4 w-4 mr-2" />
                              Revisar Curso
                            </>
                          ) : course.progress > 0 ? (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Continuar Assistindo
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Começar Agora
                            </>
                          )}
                        </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

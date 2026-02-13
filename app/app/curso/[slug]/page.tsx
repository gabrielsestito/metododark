import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, PlayCircle, Lock, ArrowLeft, Sparkles } from "lucide-react"
import { CourseGroupChat } from "@/components/course-group-chat"

export default async function AppCursoPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
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
  })

  if (!course) {
    notFound()
  }

  // Verificar assinatura ativa
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  const hasActiveSubscription = !!(subscription?.status === "active" && 
    subscription.currentPeriodEnd && 
    new Date(subscription.currentPeriodEnd) > new Date())

  // Verificar se o usuário está inscrito (se não tiver assinatura)
  let enrollment = null
  if (!hasActiveSubscription) {
    enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    })

    if (!enrollment) {
      redirect(`/curso/${params.slug}`)
    }

    // Verificar se o acesso expirou
    if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
      redirect(`/curso/${params.slug}`)
    }
  }

  // Buscar progresso das aulas
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lesson: {
        module: {
          courseId: course.id,
        },
      },
    },
  })

  const progressMap = new Map(
    lessonProgress.map((lp) => [lp.lessonId, lp])
  )

  // Encontrar primeira aula não concluída
  const firstUncompletedLesson = course.modules
    .flatMap((m) => m.lessons)
    .find((lesson) => {
      const progress = progressMap.get(lesson.id)
      return !progress || !progress.completed
    })

  // Calcular progresso total
  const totalLessons = course.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  )
  const completedLessons = lessonProgress.filter((lp) => lp.completed).length
  const courseProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 sm:py-10 lg:py-14 px-3 sm:px-5 lg:px-10">
      <div className="mx-auto w-full max-w-none">
        <div className="p-0">
          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <Link href="/app">
              <Button 
                variant="ghost" 
                className="mb-6 text-white/60 hover:text-white text-sm sm:text-base h-11 sm:h-11 touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Voltar para Meus Cursos</span>
                <span className="sm:hidden">Voltar</span>
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 mb-7">
              <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
              <span className="text-sm sm:text-sm text-white/80">{course.category}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-5 text-white leading-tight">
              {course.title}
            </h1>
            <p className="text-white/60 text-base sm:text-lg md:text-xl leading-relaxed">{course.subtitle}</p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-10 sm:mb-14 bg-[#0a0a0a] border border-white/5">
            <CardContent className="p-7 sm:p-9">
              <div className="flex items-center justify-between mb-7">
                <div>
                  <p className="text-sm text-white/60 mb-1">Progresso do Curso</p>
                  <p className="text-4xl sm:text-5xl font-black text-white">
                    {Math.round(courseProgress)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/60 mb-1">Aulas Concluídas</p>
                  <p className="text-2xl font-bold text-white">
                    {completedLessons}/{totalLessons}
                  </p>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] transition-all duration-500 relative"
                  style={{ width: `${courseProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-9 sm:gap-11">
            <div className="lg:col-span-2 space-y-7 sm:space-y-9">
              {course.modules.map((module, moduleIndex) => (
                <Card 
                  key={module.id}
                  className="bg-[#0a0a0a] border border-white/5"
                >
                  <CardHeader className="p-7 sm:p-8">
                    <CardTitle className="text-xl sm:text-2xl text-white">
                      Módulo {moduleIndex + 1}: {module.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-7 sm:p-8 pt-0">
                    <div className="space-y-5 sm:space-y-5">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const progress = progressMap.get(lesson.id)
                        const isCompleted = progress?.completed || false
                        const lessonNumber = lessonIndex + 1

                        return (
                          <Link
                            key={lesson.id}
                            href={`/app/aula/${lesson.id}`}
                            className="flex items-center gap-4 p-5 sm:p-6 rounded-2xl border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 transition-all group touch-manipulation"
                          >
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-green-500 flex items-center justify-center">
                                  <CheckCircle className="h-6 w-6 sm:h-5 sm:w-5 text-white" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-[#8b5cf6] flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <PlayCircle className="h-6 w-6 sm:h-5 sm:w-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 sm:mb-1">
                                <span className="text-sm sm:text-sm text-white/40">
                                  Aula {lessonNumber}
                                </span>
                                {lesson.isFreePreview && (
                                  <span className="text-xs sm:text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-full border border-blue-500/50">
                                    Grátis
                                  </span>
                                )}
                              </div>
                              <h3 className="font-semibold text-base sm:text-lg text-white group-hover:text-[#8b5cf6] transition-colors break-words">
                                {lesson.title}
                              </h3>
                              {lesson.duration && (
                                <p className="text-sm text-white/40 mt-1.5 sm:mt-1">
                                  {Math.floor(lesson.duration / 60)} min
                                </p>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card className="lg:sticky lg:top-6 bg-[#0a0a0a] border border-white/5">
                <CardHeader className="p-7 sm:p-8">
                  <CardTitle className="text-lg sm:text-xl text-white">
                    Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-7 sm:p-8 pt-0">
                  {firstUncompletedLesson ? (
                    <Link href={`/app/aula/${firstUncompletedLesson.id}`}>
                      <Button className="w-full mb-5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0 h-13 text-base touch-manipulation">
                        <PlayCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                        Continuar Assistindo
                      </Button>
                    </Link>
                  ) : (
                    <div className="text-center py-7 sm:py-8">
                      <div className="w-16 h-16 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <p className="font-bold text-lg sm:text-lg text-white mb-2">Curso Concluído!</p>
                      <p className="text-sm sm:text-sm text-white/60">Parabéns por completar este curso</p>
                    </div>
                  )}
                  <div className="mt-6 p-5 sm:p-5 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                    <p className="text-base sm:text-sm text-white/60 mb-3 sm:mb-2 font-medium">Estatísticas</p>
                    <div className="space-y-3 sm:space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-sm text-white/60">Progresso</span>
                        <span className="font-semibold text-lg sm:text-base text-white">
                          {Math.round(courseProgress)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-sm text-white/60">Aulas</span>
                        <span className="font-semibold text-lg sm:text-base text-white">
                          {completedLessons}/{totalLessons}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Chat do Curso */}
          <Card className="mt-8 sm:mt-10 bg-[#0a0a0a] border border-white/5">
            <CardHeader className="p-5 sm:p-6">
              <CardTitle className="text-lg sm:text-xl text-white">Chat do Curso</CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-0">
              <CourseGroupChat courseId={course.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

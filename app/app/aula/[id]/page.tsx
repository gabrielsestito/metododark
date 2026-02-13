import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, ChevronLeft, ChevronRight, ArrowLeft, Play, Download, File } from "lucide-react"
import { MarkCompleteButton } from "@/components/mark-complete-button"
import { LessonChatButton } from "@/components/chat/lesson-chat-button"
import { VideoPlayer } from "@/components/video-player"

export default async function AulaPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      module: {
        include: {
          course: true,
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  if (!lesson) {
    notFound()
  }

  // Verificar assinatura ativa
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  const hasActiveSubscription = !!(subscription?.status === "active" && 
    subscription.currentPeriodEnd && 
    new Date(subscription.currentPeriodEnd) > new Date())

  // Verificar se o usuário está inscrito no curso (se não tiver assinatura)
  let enrollment = null
  if (!hasActiveSubscription) {
    enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.module.course.id,
        },
      },
    })

    if (!enrollment && !lesson.isFreePreview) {
      redirect(`/curso/${lesson.module.course.slug}`)
    }

    // Verificar se o acesso expirou
    if (enrollment && enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
      redirect(`/curso/${lesson.module.course.slug}`)
    }
  }

  // Buscar progresso da aula atual
  const progress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId: lesson.id,
      },
    },
  })

  // Buscar todas as aulas do curso para navegação
  const allLessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: lesson.module.course.id,
      },
    },
    include: {
      module: true,
    },
    orderBy: [
      { module: { order: "asc" } },
      { order: "asc" },
    ],
  })

  // Buscar progresso de todas as aulas
  const allLessonProgress = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lessonId: {
        in: allLessons.map((l) => l.id),
      },
    },
  })

  const progressMap = new Map(
    allLessonProgress.map((lp) => [lp.lessonId, lp])
  )

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-6 sm:py-8 lg:py-10 px-3 sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-none">
        <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-7 lg:p-10">
          {/* Breadcrumb */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href={`/app/curso/${lesson.module.course.slug}`}>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white/60 hover:text-white text-xs sm:text-sm w-full sm:w-auto justify-start sm:justify-center h-10 sm:h-11"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                <span className="hidden sm:inline">Voltar para o curso</span>
                <span className="sm:hidden">Voltar</span>
              </Button>
            </Link>
            <span className="hidden sm:inline text-white/20">/</span>
            <span className="text-xs sm:text-sm text-white/60 truncate">
              {lesson.module.course.title}
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-9">
            <div className="lg:col-span-2 order-2 lg:order-1 space-y-5 sm:space-y-7">
              {/* Video Player */}
              <Card className="bg-[#0a0a0a] border border-white/5 overflow-hidden">
                <CardContent className="p-0">
                  {lesson.videoUrl ? (
                    <div className="aspect-video bg-black relative">
                      <VideoPlayer
                        videoUrl={lesson.videoUrl}
                        className="w-full h-full"
                      />
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
                        {progress?.completed && (
                          <div className="px-2 py-1 sm:px-3 sm:py-1 rounded-full bg-green-500/80 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="hidden sm:inline">Concluída</span>
                            <span className="sm:hidden">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-[#0a0a0a] flex items-center justify-center border-b border-white/5">
                      <div className="text-center">
                        <Play className="h-12 w-12 sm:h-16 sm:w-16 text-[#8b5cf6] mx-auto mb-3 sm:mb-4 opacity-50" />
                        <p className="text-xs sm:text-sm text-white/60">Vídeo em breve</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lesson Content */}
              <Card className="bg-[#0a0a0a] border border-white/5">
                <CardContent className="p-5 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-7">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                      {lesson.title}
                    </h1>
                    {progress?.completed && (
                      <div className="flex items-center gap-2 text-green-400 flex-shrink-0">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-xs sm:text-sm font-semibold">Concluída</span>
                      </div>
                    )}
                  </div>

                {lesson.content && (
                  <div className="prose prose-invert max-w-none mt-4">
                    <p className="whitespace-pre-line text-white/80 leading-relaxed text-sm sm:text-base">
                      {lesson.content}
                    </p>
                  </div>
                )}

                {lesson.attachmentUrl && (
                  <div className="mt-5 sm:mt-6 p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <File className="h-4 w-4 sm:h-5 sm:w-5 text-[#8b5cf6] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-white/60 mb-1">Material de Apoio</p>
                        <a
                          href={lesson.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#8b5cf6] hover:text-[#7c3aed] flex items-center gap-2 transition-colors text-xs sm:text-sm"
                        >
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">Baixar Arquivo</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-7 sm:mt-9 pt-5 sm:pt-7 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <MarkCompleteButton
                      lessonId={lesson.id}
                      completed={progress?.completed || false}
                    />
                  </div>
                  <div className="flex-1 sm:flex-none min-w-0">
                    <LessonChatButton
                      lessonId={lesson.id}
                      lessonTitle={lesson.title}
                      courseId={lesson.module.course.id}
                      courseTitle={lesson.module.course.title}
                    />
                  </div>
                </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                {prevLesson ? (
                  <Link href={`/app/aula/${prevLesson.id}`} className="flex-1">
                    <Button 
                      variant="outline"
                      className="w-full border-white/10 text-white/80 hover:bg-white/5 hover:text-white text-xs sm:text-sm h-11 sm:h-12"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">Aula Anterior</span>
                      <span className="sm:hidden">Anterior</span>
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1 hidden sm:block" />
                )}
                {nextLesson ? (
                  <Link href={`/app/aula/${nextLesson.id}`} className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 text-xs sm:text-sm h-11 sm:h-12">
                      <span className="hidden sm:inline">Próxima Aula</span>
                      <span className="sm:hidden">Próxima</span>
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1 hidden sm:block" />
                )}
              </div>
            </div>

            {/* Sidebar Navigation */}
            <div className="order-1 lg:order-2">
              <Card className="lg:sticky lg:top-5 bg-[#0a0a0a] border border-white/5">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="font-bold mb-4 sm:mb-5 text-lg sm:text-lg text-white">Navegação</h3>
                  <div className="space-y-2 sm:space-y-2 max-h-[420px] sm:max-h-[520px] lg:max-h-[640px] overflow-y-auto scrollbar-hide">
                    {allLessons.map((l) => {
                      const isCurrent = l.id === lesson.id
                      const lessonProgress = progressMap.get(l.id)
                      const isCompleted = lessonProgress?.completed || false
                      
                      return (
                        <Link
                          key={l.id}
                          href={`/app/aula/${l.id}`}
                          className={`block p-4 sm:p-3.5 rounded-lg text-sm sm:text-sm transition-all border touch-manipulation ${
                            isCurrent
                              ? "bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border-[#8b5cf6]/50 text-white font-semibold"
                              : "hover:bg-white/5 text-white/60 border-transparent hover:border-white/10 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 sm:gap-2">
                            {isCompleted && !isCurrent ? (
                              <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                            ) : (
                              <Play className="h-5 w-5 sm:h-4 sm:w-4 text-white/40 flex-shrink-0" />
                            )}
                            <span className="line-clamp-2 break-words text-sm sm:text-sm leading-relaxed">{l.title}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

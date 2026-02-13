import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { CheckCircle, Clock, Play, ShieldCheck, Users, TrendingUp, ArrowRight } from "lucide-react"
import { VideoPlayer } from "@/components/video-player"

export default async function CursoPage({
  params,
}: {
  params: { slug: string }
}) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug, isPublished: true },
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

  const totalLessons = course.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <div className="pt-8 sm:pt-12 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 mb-5">
                <span className="text-xs font-medium text-white/60 uppercase">{course.category}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
                {course.title}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6">{course.subtitle}</p>
              
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
                <span className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs sm:text-sm font-medium">
                  {course.level}
                </span>
                <span className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  {totalLessons} aulas
                </span>
                <span className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Lifetime
                </span>
              </div>

              <div className="mb-8">
                <div className="text-3xl sm:text-4xl font-black mb-4">
                  {course.promoPrice ? (
                    <>
                      <span className="line-through text-white/40 text-xl sm:text-2xl mr-3">
                        R$ {course.price.toFixed(2)}
                      </span>
                      <span className="text-gradient">
                        R$ {course.promoPrice.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-gradient">
                      R$ {course.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <AddToCartButton 
                  course={course} 
                  className="w-full sm:w-auto bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 px-8 text-base font-semibold"
                />
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                    <span>Garantia de 7 dias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#8b5cf6]" />
                    <span>Foco em resultado real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-yellow-400" />
                    <span>Comunidade e suporte</span>
                  </div>
                </div>
              </div>
            </div>
            
            {course.trailerUrl ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <VideoPlayer videoUrl={course.trailerUrl} className="absolute inset-0" />
              </div>
            ) : (
              course.thumbnailUrl && (
                <div className="relative h-64 sm:h-72 md:h-[420px] lg:h-[480px] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Resultados que você busca</h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {[
                    "Projetos prontos para vender",
                    "Portfólio forte para fechar clientes",
                    "Aplicação prática desde a primeira aula",
                    "Caminho claro para monetizar",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-white/80 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <AddToCartButton 
                    course={course} 
                    className="w-full sm:w-auto bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 px-6 text-base font-semibold"
                  />
                </div>
              </div>
              {/* About Section */}
              <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Sobre o Curso</h2>
                <div className="prose prose-invert max-w-none">
                  {course.description ? (
                    <p className="whitespace-pre-line text-white/70 leading-relaxed text-sm sm:text-base">
                      {course.description}
                    </p>
                  ) : (
                    <p className="text-white/40">Descrição do curso em breve...</p>
                  )}
                </div>
              </div>

              {/* Course Content */}
              <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6">Conteúdo do Curso</h2>
                <div className="space-y-5">
                  {course.modules.map((module, moduleIndex) => (
                    <div 
                      key={module.id} 
                      className="border border-white/5 rounded-xl p-5 bg-[#0a0a0a] hover:border-white/10 transition-all"
                    >
                      <h3 className="font-bold text-base sm:text-lg mb-4 text-white">
                        Módulo {moduleIndex + 1}: {module.title}
                      </h3>
                      <ul className="space-y-3">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <li key={lesson.id} className="flex items-center gap-3 text-white/70">
                            <CheckCircle className="h-5 w-5 text-[#8b5cf6] flex-shrink-0" />
                            <span className="flex-1 text-sm sm:text-base">
                              Aula {lessonIndex + 1}: {lesson.title}
                              {lesson.isFreePreview && (
                                <span className="ml-3 text-[11px] bg-[#8b5cf6]/20 text-[#8b5cf6] px-2 py-0.5 rounded border border-[#8b5cf6]/30">
                                  Grátis
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <AddToCartButton 
                    course={course} 
                    className="w-full sm:w-auto bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 px-6 text-base font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="lg:sticky lg:top-6 bg-[#0f0f0f] border border-white/5 rounded-xl p-6 sm:p-7">
                <h3 className="text-lg font-bold mb-6">Informações</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-white/40 mb-2">Preço</p>
                    <p className="text-3xl font-black text-gradient">
                      {course.promoPrice ? (
                        <>
                          <span className="line-through text-white/40 text-xl mr-2">
                            R$ {course.price.toFixed(2)}
                          </span>
                          R$ {course.promoPrice.toFixed(2)}
                        </>
                      ) : (
                        `R$ ${course.price.toFixed(2)}`
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/40 mb-2">Nível</p>
                    <p className="font-semibold text-white">{course.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/40 mb-2">Categoria</p>
                    <p className="font-semibold text-white">{course.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/40 mb-2">Total de Aulas</p>
                    <p className="font-semibold text-white">{totalLessons} aulas</p>
                  </div>
                  <AddToCartButton 
                    course={course} 
                    className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0 h-12 font-semibold"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
                    {[
                      { icon: <ShieldCheck className="h-4 w-4 text-green-400" />, title: "Garantia 7 dias", desc: "Teste sem risco" },
                      { icon: <TrendingUp className="h-4 w-4 text-[#8b5cf6]" />, title: "Foco em renda", desc: "Aplicação prática" },
                    ].map((i) => (
                      <div key={i.title} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-white/10">
                        <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                          {i.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{i.title}</p>
                          <p className="text-xs text-white/60">{i.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

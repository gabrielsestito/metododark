import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Search, Play, Crown, CheckCircle, Sparkles, TrendingUp, Users, Award, Zap, X, ShieldCheck, Timer, Target } from "lucide-react"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { FloatingTechIcons } from "@/components/floating-tech-icons"

export default async function Home() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    take: 12,
    orderBy: { createdAt: "desc" },
  })

  // Buscar plano de assinatura de menor valor (ativo)
  let cheapestPlan = null
  try {
    if (prisma.subscriptionPlan) {
      cheapestPlan = await prisma.subscriptionPlan.findFirst({
        where: { isActive: true },
        orderBy: { price: "asc" },
      })
    }
  } catch (error) {
    console.warn("SubscriptionPlan model not available")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-16 sm:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30">
                <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
                <span className="text-xs font-semibold text-white/80">Método focado em conversão real</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                Aprenda e{" "}
                <span className="bg-gradient-to-r from-[#8b5cf6] via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  comece a faturar
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed">
                Você aprende na prática com projetos prontos para vender, portfólio que gera clientes e um caminho claro para monetizar desde a primeira aula.
              </p>

              <div className="flex flex-wrap gap-2 sm:gap-3 max-w-2xl">
                {[
                  "Aulas práticas desde o início",
                  "Projetos prontos para vender",
                  "Estratégia de monetização real",
                  "Suporte com especialistas",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs sm:text-sm text-white/80 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/cursos">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 sm:h-14 px-8 text-base font-semibold shadow-lg shadow-[#8b5cf6]/30 transform hover:scale-105 transition-all duration-300"
                  >
                    QUERO COMEÇAR AGORA
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/subscription">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 h-12 sm:h-14 px-8 text-base font-semibold"
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    VER ASSINATURA
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-400" />
                  <span>Garantia de 7 dias</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Acesso imediato</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-yellow-400" />
                  <span>+1000 alunos ativos</span>
                </div>
              </div>
            </div>
            
            <div className="relative w-full">
              <div className="relative aspect-video sm:aspect-video rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-2xl w-full">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/hero-video.mp4" type="video/mp4" />
                  <source src="/hero-video.webm" type="video/webm" />
                  Seu navegador não suporta vídeos.
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Tech Icons */}
      <FloatingTechIcons />

      {/* Value Proposition Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                title: "Aprenda e monetize",
                description: "Aulas práticas com foco em resultado real, não só teoria.",
              },
              {
                title: "Projetos que viram portfólio",
                description: "Você sai com trabalhos prontos para vender ou apresentar.",
              },
              {
                title: "Conteúdo direto ao ponto",
                description: "Sem enrolação: o que funciona hoje no mercado.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-[#8b5cf6]" />
                  </div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                </div>
                <p className="text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 sm:mt-10 grid md:grid-cols-3 gap-4">
            {[
              { label: "Projetos prontos", value: "20+ por curso" },
              { label: "Aulas aplicáveis", value: "100% práticas" },
              { label: "Tempo para começar", value: "Primeira aula" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 text-center">
                <div className="text-2xl font-black text-white">{item.value}</div>
                <p className="text-xs text-white/50 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-8 text-center">
              <div className="inline-block p-4 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-purple-600 mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-5xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-2">+1000</div>
              <p className="text-white/60">Alunos Ativos</p>
            </div>
            <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-8 text-center">
              <div className="inline-block p-4 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-5xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">4.9</div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-white/60">Avaliação Média</p>
            </div>
            <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-8 text-center">
              <div className="inline-block p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="text-2xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-2">Suporte Exclusivo</div>
              <p className="text-white/60">Instrutores Especialistas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Highlight Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="relative bg-gradient-to-br from-[#8b5cf6]/20 via-[#7c3aed]/20 to-[#8b5cf6]/20 border-2 border-[#8b5cf6]/30 rounded-2xl p-8 lg:p-12 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #8b5cf6 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }} />
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 mb-6">
                    <Crown className="h-4 w-4 text-[#8b5cf6]" />
                    <span className="text-xs font-semibold text-[#8b5cf6]">ASSINATURA MENSAL</span>
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-white leading-tight">
                    Acesso Ilimitado a{" "}
                    <span className="bg-gradient-to-r from-[#8b5cf6] to-purple-600 bg-clip-text text-transparent">
                      Todos os Cursos
                    </span>
                  </h2>
                  
                  <p className="text-base sm:text-lg md:text-xl text-white/70 mb-6 sm:mb-8 max-w-2xl">
                    Assine mensalmente e tenha acesso completo a toda a biblioteca de cursos. 
                    Novos cursos adicionados automaticamente, sem custos extras.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {[
                      "Acesso a todos os cursos",
                      "Novos cursos automaticamente",
                      "Cancelamento a qualquer momento",
                      "Suporte prioritário"
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <span className="text-white/90 text-sm md:text-base">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/subscription">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 sm:h-14 px-8 text-base font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg shadow-[#8b5cf6]/30"
                    >
                      <Crown className="mr-2 h-5 w-5" />
                      ASSINAR AGORA
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                <div className="w-full lg:w-auto">
                  <div className="bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border-2 border-[#8b5cf6]/50 rounded-xl p-8 text-center shadow-2xl">
                    {cheapestPlan ? (
                      <>
                        <div className="mb-4">
                          <p className="text-sm text-white/60 mb-2">A partir de</p>
                          <div className="flex items-baseline justify-center gap-2">
                            <span className="text-5xl font-black text-white">
                              R$ {cheapestPlan.price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-xl text-white/60">/mês</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-white/10">
                          <p className="text-xs text-white/60 mb-1">Economia de até</p>
                          <p className="text-2xl font-bold text-green-400">
                            {courses.length > 0 ? Math.round((courses.reduce((acc, c) => acc + (c.promoPrice || c.price), 0) - cheapestPlan.price) / courses.reduce((acc, c) => acc + (c.promoPrice || c.price), 0) * 100) : 0}%
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-4">
                          <p className="text-sm text-white/60 mb-2">Valores sugeridos</p>
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                              <p className="text-xs text-white/60 mb-1">Plano Básico</p>
                              <p className="text-2xl font-black text-white">R$ 29,90<span className="text-sm text-white/60">/mês</span></p>
                            </div>
                            <div className="p-3 rounded-lg bg-[#8b5cf6]/20 border-2 border-[#8b5cf6]/50">
                              <p className="text-xs text-[#8b5cf6] mb-1 font-semibold">⭐ RECOMENDADO</p>
                              <p className="text-2xl font-black text-white">R$ 49,90<span className="text-sm text-white/60">/mês</span></p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                              <p className="text-xs text-white/60 mb-1">Plano Premium</p>
                              <p className="text-2xl font-black text-white">R$ 79,90<span className="text-sm text-white/60">/mês</span></p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 mt-4">
                          Configure o preço em /admin/assinatura
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-2xl p-8 lg:p-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Cursos comuns vs. Método Dark
            </h2>
            <div className="grid lg:grid-cols-[1.1fr_1.3fr] gap-6">
              <div className="border border-white/10 rounded-xl p-6 bg-[#0a0a0a]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white/70">Cursos comuns</h3>
                </div>
                <ul className="space-y-3 text-white/60 text-sm">
                  {[
                    "Conteúdo genérico e superficial",
                    "Teoria sem aplicação real",
                    "Pouco foco em resultado financeiro",
                    "Sem caminho claro para monetizar",
                    "Portfólio fraco e sem direção",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-2 border-[#8b5cf6]/40 rounded-xl p-6 bg-gradient-to-br from-[#8b5cf6]/10 to-[#0a0a0a]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center">
                    <Target className="h-5 w-5 text-[#8b5cf6]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#8b5cf6]">Método Dark</h3>
                </div>
                <ul className="space-y-3 text-white/80 text-sm">
                  {[
                    "Aulas práticas desde a primeira aula",
                    "Projetos reais com foco em monetização",
                    "Caminho claro para gerar renda",
                    "Conteúdo direto ao ponto, sem enrolação",
                    "Portfólio pronto para vender ou apresentar",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {[
                { icon: <ShieldCheck className="h-5 w-5 text-green-400" />, title: "Garantia total", desc: "Teste por 7 dias sem risco." },
                { icon: <TrendingUp className="h-5 w-5 text-[#8b5cf6]" />, title: "Foco em resultado", desc: "Aulas que geram renda real." },
                { icon: <Users className="h-5 w-5 text-yellow-400" />, title: "Comunidade ativa", desc: "Suporte e networking diário." },
              ].map((item) => (
                <div key={item.title} className="border border-white/10 rounded-xl p-4 bg-[#0a0a0a] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/cursos">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 px-6 text-base font-semibold"
                >
                  Quero aprender na prática
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-2xl p-7 sm:p-8 lg:p-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Resultados dos Alunos
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Eduardo", role: "Modelagem 3D", result: "Primeiros contratos em 3D fechados", quote: "Com os projetos práticos, montei portfólio e comecei a vender mais rápido." },
                { name: "Bruno Souza", role: "Editor de Vídeos", result: "Clientes recorrentes de edição", quote: "Aprendi um fluxo real de trabalho que me trouxe pedidos toda semana." },
                { name: "Júlia Meirles", role: "Programadora", result: "Freelas e site próprio no ar", quote: "Saí da teoria e já construí projetos que viraram renda." },
              ].map((t) => (
                <div
                  key={t.name}
                  className="group rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 hover:border-[#8b5cf6]/40 transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-11 h-11 rounded-full bg-white/10 ring-2 ring-[#8b5cf6]/40 flex items-center justify-center text-white font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">{t.name}</p>
                        <span className="text-[11px] bg-[#8b5cf6]/20 text-[#8b5cf6] px-2 py-0.5 rounded border border-[#8b5cf6]/30">
                          {t.role}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-green-400">
                        {t.result}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-sm text-white/80 italic">{`"${t.quote}"`}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/cursos">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 px-6 text-base font-semibold"
                >
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-8 items-start bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-2xl p-7 sm:p-8 lg:p-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 mb-4">
                <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
                <span className="text-xs font-semibold text-[#8b5cf6]">FAQ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Dúvidas rápidas, respostas diretas
              </h2>
              <p className="text-white/60 text-sm sm:text-base">
                Tudo o que você precisa para decidir agora e começar a monetizar de verdade.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "Acesso imediato após a compra",
                  "Garantia de 7 dias",
                  "Suporte com especialistas",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/cursos">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 px-6 text-base font-semibold"
                  >
                    Começar agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: "Preciso ser avançado para começar?",
                  a: "Não. Os cursos começam do zero e já te colocam na prática rapidamente.",
                },
                {
                  q: "Em quanto tempo vejo resultado?",
                  a: "Você aplica desde a primeira aula, então os resultados começam cedo.",
                },
                {
                  q: "Vou aprender só teoria?",
                  a: "Não. Aqui o foco é prática, projetos reais e monetização.",
                },
                {
                  q: "Posso cancelar a assinatura?",
                  a: "Sim, a qualquer momento e sem burocracia.",
                },
                {
                  q: "Os cursos têm certificado?",
                  a: "Sim. Ao concluir você recebe certificado para seu portfólio.",
                },
                {
                  q: "Funciona para quem tem pouco tempo?",
                  a: "Sim. As aulas são objetivas e você aprende no seu ritmo.",
                },
              ].map((item, index) => (
                <div key={item.q} className="border border-white/10 rounded-xl p-4 sm:p-5 bg-[#0a0a0a] hover:border-[#8b5cf6]/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-xs font-bold text-[#8b5cf6]">
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-1">{item.q}</h3>
                      <p className="text-white/60 text-xs sm:text-sm">{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Catálogo de Cursos
                </h2>
                <p className="text-white/60 text-sm sm:text-base">Navegue por todo o conteúdo da Método Dark</p>
              </div>
              
              <form action="/cursos" method="get" className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    name="search"
                    placeholder="Busque por assuntos, aulas e pessoas"
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6]/50 h-11 sm:h-12"
                  />
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course) => (
                <Link key={course.id} href={`/curso/${course.slug}`}>
                  <div className="group bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden hover:border-[#8b5cf6]/50 transition-all cursor-pointer transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#8b5cf6]/10">
                    {course.thumbnailUrl && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image
                          src={course.thumbnailUrl}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
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
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-white/40 uppercase tracking-wider">{course.category}</span>
                        <span className="text-xs text-white/40">•</span>
                        <span className="text-xs text-white/40">{course.level}</span>
                      </div>
                      <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-[#8b5cf6] transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-white/60 mb-4 line-clamp-2">{course.subtitle}</p>
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
                </Link>
              ))}
            </div>

            {courses.length === 0 && (
              <div className="text-center py-20">
                <p className="text-white/60">Nenhum curso disponível no momento</p>
              </div>
            )}

            {courses.length > 0 && (
              <div className="text-center mt-8">
                <Link href="/cursos">
                  <Button 
                    variant="outline" 
                    className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white h-12 px-8"
                  >
                    Ver Todos os Cursos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

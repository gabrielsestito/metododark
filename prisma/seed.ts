import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...")
  console.log("")

  // ============================================
  // USUÁRIOS
  // ============================================
  console.log("👥 Criando usuários...")

  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@metododark.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@metododark.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  })
  console.log("  ✅ Admin:", admin.email, "(senha: admin123)")

  const ceoPassword = await bcrypt.hash("ceo123", 10)
  const ceo = await prisma.user.upsert({
    where: { email: "ceo@metododark.com" },
    update: {},
    create: {
      name: "CEO",
      email: "ceo@metododark.com",
      passwordHash: ceoPassword,
      role: "CEO",
    },
  })
  console.log("  ✅ CEO:", ceo.email, "(senha: ceo123)")

  const financialPassword = await bcrypt.hash("financial123", 10)
  const financial = await prisma.user.upsert({
    where: { email: "financeiro@metododark.com" },
    update: {},
    create: {
      name: "Financeiro",
      email: "financeiro@metododark.com",
      passwordHash: financialPassword,
      role: "FINANCIAL",
    },
  })
  console.log("  ✅ Financeiro:", financial.email, "(senha: financial123)")

  const assistantPassword = await bcrypt.hash("assistant123", 10)
  const assistant = await prisma.user.upsert({
    where: { email: "assistente@metododark.com" },
    update: {},
    create: {
      name: "Assistente",
      email: "assistente@metododark.com",
      passwordHash: assistantPassword,
      role: "ASSISTANT",
    },
  })
  console.log("  ✅ Assistente:", assistant.email, "(senha: assistant123)")

  const studentPassword = await bcrypt.hash("student123", 10)
  const student = await prisma.user.upsert({
    where: { email: "student@metododark.com" },
    update: {},
    create: {
      name: "Estudante Teste",
      email: "student@metododark.com",
      passwordHash: studentPassword,
      role: "STUDENT",
    },
  })
  console.log("  ✅ Estudante:", student.email, "(senha: student123)")

  // Criar mais alguns estudantes
  for (let i = 1; i <= 3; i++) {
    const studentPassword = await bcrypt.hash(`student${i}123`, 10)
    await prisma.user.upsert({
      where: { email: `student${i}@metododark.com` },
      update: {},
      create: {
        name: `Estudante ${i}`,
        email: `student${i}@metododark.com`,
        passwordHash: studentPassword,
        role: "STUDENT",
      },
    })
  }
  console.log("  ✅ 3 estudantes adicionais criados")
  console.log("")

  // ============================================
  // CURSOS
  // ============================================
  console.log("📚 Criando cursos...")

  // Curso 1: Next.js Completo
  const course1 = await prisma.course.upsert({
    where: { slug: "nextjs-completo" },
    update: {},
    create: {
      title: "Next.js Completo - Do Zero ao Avançado",
      slug: "nextjs-completo",
      subtitle: "Aprenda Next.js 14 com App Router, Server Components e muito mais",
      description: `Este curso completo de Next.js vai te ensinar tudo que você precisa saber para criar aplicações modernas e performáticas.

Você vai aprender:
- Next.js 14 com App Router
- Server Components e Client Components
- Roteamento e Navegação
- Data Fetching e Caching
- API Routes
- Autenticação
- Deploy em produção

Ao final do curso, você estará pronto para criar aplicações profissionais com Next.js.`,
      thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
      trailerUrl: "https://www.youtube.com/watch?v=demo",
      price: 299.99,
      promoPrice: 199.99,
      level: "INTERMEDIARIO",
      category: "PROGRAMACAO",
      isPublished: true,
    },
  })

  // Módulos e aulas do curso 1
  const module1_1 = await prisma.module.upsert({
    where: { id: `${course1.id}-mod1` },
    update: {},
    create: {
      id: `${course1.id}-mod1`,
      courseId: course1.id,
      title: "Introdução ao Next.js",
      order: 1,
    },
  })

  await prisma.lesson.upsert({
    where: { id: `${module1_1.id}-lesson1` },
    update: {},
    create: {
      id: `${module1_1.id}-lesson1`,
      moduleId: module1_1.id,
      title: "O que é Next.js?",
      order: 1,
      videoUrl: "https://www.youtube.com/watch?v=demo1",
      duration: 600,
      isFreePreview: true,
      content: "Nesta aula você vai entender o que é Next.js e por que ele é uma das melhores opções para React.",
    },
  })

  await prisma.lesson.upsert({
    where: { id: `${module1_1.id}-lesson2` },
    update: {},
    create: {
      id: `${module1_1.id}-lesson2`,
      moduleId: module1_1.id,
      title: "Configurando o Ambiente",
      order: 2,
      videoUrl: "https://www.youtube.com/watch?v=demo2",
      duration: 900,
      isFreePreview: false,
      content: "Vamos configurar o ambiente de desenvolvimento e criar nosso primeiro projeto Next.js.",
    },
  })

  const module1_2 = await prisma.module.upsert({
    where: { id: `${course1.id}-mod2` },
    update: {},
    create: {
      id: `${course1.id}-mod2`,
      courseId: course1.id,
      title: "App Router e Server Components",
      order: 2,
    },
  })

  await prisma.lesson.upsert({
    where: { id: `${module1_2.id}-lesson1` },
    update: {},
    create: {
      id: `${module1_2.id}-lesson1`,
      moduleId: module1_2.id,
      title: "Entendendo o App Router",
      order: 1,
      videoUrl: "https://www.youtube.com/watch?v=demo3",
      duration: 1200,
      isFreePreview: false,
      content: "Aprenda como funciona o novo App Router do Next.js 14.",
    },
  })

  console.log("  ✅ Curso 1:", course1.title)

  // Curso 2: Design UI/UX
  const course2 = await prisma.course.upsert({
    where: { slug: "design-ui-ux" },
    update: {},
    create: {
      title: "Design UI/UX Moderno",
      slug: "design-ui-ux",
      subtitle: "Crie interfaces incríveis e experiências de usuário memoráveis",
      description: `Aprenda os fundamentos e técnicas avançadas de Design UI/UX para criar interfaces que encantam os usuários.

Conteúdo do curso:
- Princípios de Design
- Tipografia e Hierarquia Visual
- Cores e Paletas
- Prototipagem com Figma
- Design Systems
- UX Research
- Animações e Microinterações

Ideal para designers iniciantes e profissionais que querem se atualizar.`,
      thumbnailUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
      trailerUrl: "https://www.youtube.com/watch?v=demo",
      price: 249.99,
      promoPrice: 179.99,
      level: "INICIANTE",
      category: "DESIGN",
      isPublished: true,
    },
  })

  const module2_1 = await prisma.module.upsert({
    where: { id: `${course2.id}-mod1` },
    update: {},
    create: {
      id: `${course2.id}-mod1`,
      courseId: course2.id,
      title: "Fundamentos de Design",
      order: 1,
    },
  })

  await prisma.lesson.upsert({
    where: { id: `${module2_1.id}-lesson1` },
    update: {},
    create: {
      id: `${module2_1.id}-lesson1`,
      moduleId: module2_1.id,
      title: "Princípios Básicos",
      order: 1,
      videoUrl: "https://www.youtube.com/watch?v=demo4",
      duration: 720,
      isFreePreview: true,
      content: "Conheça os princípios fundamentais do design que todo profissional precisa dominar.",
    },
  })

  console.log("  ✅ Curso 2:", course2.title)

  // Curso 3: Marketing Digital
  const course3 = await prisma.course.upsert({
    where: { slug: "marketing-digital" },
    update: {},
    create: {
      title: "Marketing Digital Avançado",
      slug: "marketing-digital",
      subtitle: "Estratégias comprovadas para gerar resultados reais",
      description: `Domine as estratégias mais eficazes de Marketing Digital e transforme seu negócio.

Você vai aprender:
- SEO e SEM
- Google Ads e Facebook Ads
- Email Marketing
- Content Marketing
- Social Media Marketing
- Analytics e Métricas
- Automação de Marketing

Com cases reais e estratégias que funcionam na prática.`,
      thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
      trailerUrl: "https://www.youtube.com/watch?v=demo",
      price: 349.99,
      promoPrice: 249.99,
      level: "AVANCADO",
      category: "MARKETING",
      isPublished: true,
    },
  })

  const module3_1 = await prisma.module.upsert({
    where: { id: `${course3.id}-mod1` },
    update: {},
    create: {
      id: `${course3.id}-mod1`,
      courseId: course3.id,
      title: "Fundamentos de Marketing Digital",
      order: 1,
    },
  })

  await prisma.lesson.upsert({
    where: { id: `${module3_1.id}-lesson1` },
    update: {},
    create: {
      id: `${module3_1.id}-lesson1`,
      moduleId: module3_1.id,
      title: "Introdução ao Marketing Digital",
      order: 1,
      videoUrl: "https://www.youtube.com/watch?v=demo5",
      duration: 840,
      isFreePreview: true,
      content: "Entenda o panorama atual do Marketing Digital e as oportunidades disponíveis.",
    },
  })

  console.log("  ✅ Curso 3:", course3.title)

  // Curso 4: TypeScript
  const course4 = await prisma.course.upsert({
    where: { slug: "typescript-completo" },
    update: {},
    create: {
      title: "TypeScript Completo",
      slug: "typescript-completo",
      subtitle: "Domine TypeScript e desenvolva com mais segurança",
      description: `Aprenda TypeScript do zero e eleve seu código JavaScript para o próximo nível.

Conteúdo:
- Tipos e Interfaces
- Generics
- Decorators
- Modules e Namespaces
- Integração com React
- Testes com TypeScript
- Boas práticas

Perfeito para desenvolvedores JavaScript que querem adicionar tipagem ao código.`,
      thumbnailUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800",
      price: 199.99,
      promoPrice: 149.99,
      level: "INTERMEDIARIO",
      category: "PROGRAMACAO",
      isPublished: true,
    },
  })

  const module4_1 = await prisma.module.upsert({
    where: { id: `${course4.id}-mod1` },
    update: {},
    create: {
      id: `${course4.id}-mod1`,
      courseId: course4.id,
      title: "Fundamentos do TypeScript",
      order: 1,
    },
  })

  await prisma.lesson.upsert({
    where: { id: `${module4_1.id}-lesson1` },
    update: {},
    create: {
      id: `${module4_1.id}-lesson1`,
      moduleId: module4_1.id,
      title: "Por que TypeScript?",
      order: 1,
      videoUrl: "https://www.youtube.com/watch?v=demo6",
      duration: 600,
      isFreePreview: true,
      content: "Entenda os benefícios do TypeScript e quando usar.",
    },
  })

  console.log("  ✅ Curso 4:", course4.title)

  // Curso 5: React Avançado
  const course5 = await prisma.course.upsert({
    where: { slug: "react-avancado" },
    update: {},
    create: {
      title: "React Avançado",
      slug: "react-avancado",
      subtitle: "Técnicas avançadas e padrões profissionais",
      description: `Aprofunde seus conhecimentos em React com técnicas avançadas e padrões profissionais.

Você vai aprender:
- Hooks customizados
- Performance e otimização
- Context API avançado
- State Management
- Testes com Jest e React Testing Library
- Padrões de arquitetura
- Micro-frontends

Para desenvolvedores que já conhecem o básico de React.`,
      thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
      price: 279.99,
      promoPrice: 199.99,
      level: "AVANCADO",
      category: "PROGRAMACAO",
      isPublished: true,
    },
  })

  const module5_1 = await prisma.module.upsert({
    where: { id: `${course5.id}-mod1` },
    update: {},
    create: {
      id: `${course5.id}-mod1`,
      courseId: course5.id,
      title: "Hooks Avançados",
      order: 1,
    },
  })

  await prisma.lesson.upsert({
    where: { id: `${module5_1.id}-lesson1` },
    update: {},
    create: {
      id: `${module5_1.id}-lesson1`,
      moduleId: module5_1.id,
      title: "Criando Hooks Customizados",
      order: 1,
      videoUrl: "https://www.youtube.com/watch?v=demo7",
      duration: 900,
      isFreePreview: true,
      content: "Aprenda a criar hooks customizados reutilizáveis.",
    },
  })

  console.log("  ✅ Curso 5:", course5.title)
  console.log("")

  // ============================================
  // PLANOS DE ASSINATURA
  // ============================================
  console.log("💎 Criando planos de assinatura...")

  const plan1 = await prisma.subscriptionPlan.upsert({
    where: { id: "plan-basico" },
    update: {},
    create: {
      id: "plan-basico",
      name: "Plano Básico",
      price: 29.90,
      isActive: true,
    },
  })

  // Adicionar cursos ao plano básico
  await prisma.subscriptionPlanCourse.upsert({
    where: {
      subscriptionPlanId_courseId: {
        subscriptionPlanId: plan1.id,
        courseId: course2.id, // Design UI/UX
      },
    },
    update: {},
    create: {
      subscriptionPlanId: plan1.id,
      courseId: course2.id,
    },
  })

  await prisma.subscriptionPlanCourse.upsert({
    where: {
      subscriptionPlanId_courseId: {
        subscriptionPlanId: plan1.id,
        courseId: course4.id, // TypeScript
      },
    },
    update: {},
    create: {
      subscriptionPlanId: plan1.id,
      courseId: course4.id,
    },
  })

  console.log("  ✅ Plano Básico: R$ 29,90/mês (2 cursos)")

  const plan2 = await prisma.subscriptionPlan.upsert({
    where: { id: "plan-premium" },
    update: {},
    create: {
      id: "plan-premium",
      name: "Plano Premium",
      price: 49.90,
      isActive: true,
    },
  })

  // Adicionar todos os cursos ao plano premium
  const allCourses = [course1, course2, course3, course4, course5]
  for (const course of allCourses) {
    await prisma.subscriptionPlanCourse.upsert({
      where: {
        subscriptionPlanId_courseId: {
          subscriptionPlanId: plan2.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        subscriptionPlanId: plan2.id,
        courseId: course.id,
      },
    })
  }

  console.log("  ✅ Plano Premium: R$ 49,90/mês (5 cursos)")
  console.log("")

  // ============================================
  // MATRÍCULAS DE TESTE
  // ============================================
  console.log("🎓 Criando matrículas de teste...")

  // Matricular estudante no curso 1
  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course1.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      courseId: course1.id,
    },
  })

  console.log("  ✅ Estudante matriculado no curso:", course1.title)
  console.log("")

  // ============================================
  // NOTIFICAÇÕES DE TESTE
  // ============================================
  console.log("🔔 Criando notificações de teste...")

  await prisma.notification.create({
    data: {
      userId: student.id,
      title: "Bem-vindo à plataforma! 🎉",
      message: "Sua conta foi criada com sucesso. Explore nossos cursos e comece a aprender hoje mesmo!",
      type: "success",
      read: false,
    },
  })

  await prisma.notification.create({
    data: {
      userId: null, // Notificação global
      title: "Novo curso disponível!",
      message: "Confira nosso novo curso de React Avançado com técnicas profissionais.",
      type: "info",
      read: false,
    },
  })

  console.log("  ✅ 2 notificações criadas")
  console.log("")

  // ============================================
  // RESUMO
  // ============================================
  console.log("=" .repeat(50))
  console.log("🎉 Seed concluído com sucesso!")
  console.log("=" .repeat(50))
  console.log("")
  console.log("📊 Resumo:")
  console.log(`  👥 Usuários: 8 criados`)
  console.log(`  📚 Cursos: 5 criados`)
  console.log(`  💎 Planos: 2 criados`)
  console.log(`  🎓 Matrículas: 1 criada`)
  console.log(`  🔔 Notificações: 2 criadas`)
  console.log("")
  console.log("🔑 Credenciais de acesso:")
  console.log("  Admin: admin@metododark.com / admin123")
  console.log("  CEO: ceo@metododark.com / ceo123")
  console.log("  Financeiro: financeiro@metododark.com / financial123")
  console.log("  Assistente: assistente@metododark.com / assistant123")
  console.log("  Estudante: student@metododark.com / student123")
  console.log("")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("❌ Erro no seed:", e)
    await prisma.$disconnect()
    process.exit(1)
  })

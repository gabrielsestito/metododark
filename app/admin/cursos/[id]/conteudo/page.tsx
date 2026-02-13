import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentManager } from "@/components/admin/content-manager"
import { ArrowLeft, Sparkles } from "lucide-react"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export default async function AdminConteudoPage({
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-[#0f0f0f] border border-white/5 rounded-lg p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin/cursos">
              <Button 
                variant="ghost" 
                className="mb-4 text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 mb-4">
              <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
              <span className="text-xs font-medium text-white/60">Gerenciamento de Conteúdo</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 text-white">
              Conteúdo do Curso
            </h1>
            <p className="text-white/60 text-base sm:text-lg">{course.title}</p>
          </div>

          <ContentManager course={course} />
        </div>
      </div>
    </div>
  )
}

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Sparkles } from "lucide-react"
import { isAdminRole, getPermissions } from "@/lib/permissions"
import { GroupChatModerationClient } from "@/components/admin/group-chat-moderation-client"

export default async function AdminGroupChatsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/")
  }

  const permissions = getPermissions(session.user.role)
  if (!permissions.canManageCourses) {
    redirect("/admin")
  }

  // Buscar todos os cursos com seus chats de grupo
  const coursesData = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          enrollments: true,
        },
      },
      groupChat: {
        include: {
          _count: {
            select: {
              messages: true,
              bans: true,
            },
          },
          messages: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // Converter os dados para o formato esperado pelo componente
  const courses = coursesData.map((course) => ({
    ...course,
    groupChat: course.groupChat
      ? {
          ...course.groupChat,
          messages: course.groupChat.messages.map((msg) => ({
            ...msg,
            createdAt: msg.createdAt.toISOString(),
          })),
        }
      : null,
  }))

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-[#0f0f0f] border border-white/5 rounded-lg p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin">
              <Button 
                variant="ghost" 
                className="mb-4 text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 mb-4">
              <MessageSquare className="h-4 w-4 text-[#8b5cf6]" />
              <span className="text-xs font-medium text-white/60">Moderação</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Moderação de Chats de Grupo
            </h1>
            <p className="text-white/60 text-lg">Gerencie todos os chats de grupo dos cursos</p>
          </div>

          <GroupChatModerationClient initialCourses={courses} />
        </div>
      </div>
    </div>
  )
}

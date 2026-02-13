import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageCircle, Search, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AdminChatsClient } from "@/components/admin/admin-chats-client"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export default async function AdminChatsPage({
  searchParams,
}: {
  searchParams: { chatId?: string; userId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/")
  }

  const permissions = getPermissions(session.user.role)
  if (!permissions.canManageChats) {
    redirect("/admin")
  }

  const chats = await prisma.chat.findMany({
    orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
  })

  // Adicionar contagem de mensagens não lidas
  const chatsWithUnread = await Promise.all(
    chats.map(async (chat) => {
      const unreadCount = await prisma.chatMessage.count({
        where: {
          chatId: chat.id,
          read: false,
          senderId: {
            not: null,
          },
        },
      })

      return {
        ...chat,
        unreadCount,
      }
    })
  )

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
              <MessageCircle className="h-4 w-4 text-[#8b5cf6]" />
              <span className="text-xs font-medium text-white/60">Chats</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 text-gradient">
              Chats de Suporte
            </h1>
            <p className="text-white/60 text-lg">Gerencie todas as conversas de suporte</p>
          </div>

          <AdminChatsClient 
            initialChats={chatsWithUnread} 
            initialChatId={searchParams.chatId}
            initialUserId={searchParams.userId}
            userRole={session.user.role}
          />
        </div>
      </div>
    </div>
  )
}


import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, Sparkles, Users, GraduationCap, Crown, Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AdminUsuariosClient } from "@/components/admin/admin-usuarios-client"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export default async function AdminUsuariosPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/")
  }

  const permissions = getPermissions(session.user.role)
  if (!permissions.canManageUsers) {
    redirect("/admin")
  }

  const [users, stats] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
        subscription: true,
      },
    }),
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: { in: ["ADMIN", "CEO", "ASSISTANT", "FINANCIAL"] } } }),
      prisma.enrollment.count(),
      prisma.subscription.count({ where: { status: "active" } }),
    ]).then(([total, students, admins, enrollments, activeSubscriptions]) => ({
      total,
      students,
      admins,
      enrollments,
      activeSubscriptions,
    }))
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] text-white py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <Link href="/admin">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/5 text-xs sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 mb-2 sm:mb-3">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                <span className="text-[10px] sm:text-xs font-medium text-white/80">Usuários</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-1 sm:mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Gerenciar Usuários
              </h1>
              <p className="text-white/60 text-xs sm:text-sm lg:text-base">Gerencie todos os usuários da plataforma</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-white/60 mb-1">Total</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-white/60 mb-1">Alunos</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-green-400">{stats.students}</p>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-white/60 mb-1">Admins</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-400">{stats.admins}</p>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-white/60 mb-1">Matrículas</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-yellow-400">{stats.enrollments}</p>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 hover:border-white/10 transition-all col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-white/60 mb-1">Assinaturas</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#8b5cf6]">{stats.activeSubscriptions}</p>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8">
          <AdminUsuariosClient initialUsers={users} />
        </div>
      </div>
    </div>
  )
}

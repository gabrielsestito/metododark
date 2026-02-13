import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const permissions = getPermissions(session.user.role)
    if (!permissions.canManageUsers) {
      return NextResponse.json(
        { error: "Sem permissão para visualizar progresso" },
        { status: 403 }
      )
    }

    // Buscar total de aulas
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    const totalLessons = course.modules.reduce(
      (acc, module) => acc + module.lessons.length,
      0
    )

    // Buscar aulas concluídas
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId: params.id,
        completed: true,
        lesson: {
          module: {
            courseId: params.courseId,
          },
        },
      },
    })

    // Buscar última aula assistida
    const lastProgress = await prisma.lessonProgress.findFirst({
      where: {
        userId: params.id,
        lesson: {
          module: {
            courseId: params.courseId,
          },
        },
      },
      include: {
        lesson: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    })

    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

    return NextResponse.json({
      totalLessons,
      completedLessons,
      progress,
      lastLesson: lastProgress?.lesson.title || null,
    })
  } catch (error: any) {
    console.error("Error fetching progress:", error)
    return NextResponse.json(
      { error: "Erro ao buscar progresso" },
      { status: 500 }
    )
  }
}


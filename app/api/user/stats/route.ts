import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Buscar estatísticas do usuário
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    })

    // Calcular estatísticas
    const totalCourses = enrollments.length
    
    let totalLessons = 0
    let completedLessons = 0
    let totalProgress = 0

    for (const enrollment of enrollments) {
      const courseLessons = enrollment.course.modules.reduce(
        (acc, module) => acc + module.lessons.length,
        0
      )
      totalLessons += courseLessons

      const completed = await prisma.lessonProgress.count({
        where: {
          userId: session.user.id,
          completed: true,
          lesson: {
            module: {
              courseId: enrollment.course.id,
            },
          },
        },
      })

      completedLessons += completed
      if (courseLessons > 0) {
        totalProgress += (completed / courseLessons) * 100
      }
    }

    const averageProgress = totalCourses > 0 ? totalProgress / totalCourses : 0

    // Buscar cursos recentes
    const recentCourses = enrollments
      .sort((a, b) => {
        const dateA = a.createdAt.getTime()
        const dateB = b.createdAt.getTime()
        return dateB - dateA
      })
      .slice(0, 3)
      .map((enrollment) => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        imageUrl: enrollment.course.thumbnailUrl,
      }))

    // Calcular tempo total de estudo (aproximado)
    const totalWatchTime = await prisma.lessonProgress.aggregate({
      where: {
        userId: session.user.id,
        completed: true,
      },
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      totalCourses,
      totalLessons,
      completedLessons,
      averageProgress: Math.round(averageProgress),
      recentCourses,
      totalWatchTime: totalWatchTime._count.id,
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    )
  }
}

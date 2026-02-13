import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
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
    if (!permissions.canManageCourses) {
      return NextResponse.json(
        { error: "Sem permissão para gerenciar cursos" },
        { status: 403 }
      )
    }

    const { title } = await req.json()

    // Buscar último order
    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId: params.id },
      orderBy: { order: "desc" },
    })

    const order = lastLesson ? lastLesson.order + 1 : 1

    const courseModule = await prisma.module.findUnique({
      where: { id: params.id },
      include: {
        course: true,
      },
    })

    if (!courseModule) {
      return NextResponse.json(
        { error: "Módulo não encontrado" },
        { status: 404 }
      )
    }

    const lesson = await prisma.lesson.create({
      data: {
        moduleId: params.id,
        title,
        order,
      },
    })

    // Criar notificação para alunos inscritos no curso
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: courseModule.course.id },
        select: { userId: true },
      })

      console.log(`[NOTIFICATION] New lesson added to course: ${courseModule.course.id}, Enrollments: ${enrollments.length}`)

      if (enrollments.length > 0) {
        await prisma.notification.createMany({
          data: enrollments.map((enrollment) => ({
            userId: enrollment.userId,
            courseId: courseModule.course.id,
            title: "Nova Aula Disponível",
            message: `Uma nova aula foi adicionada ao curso "${courseModule.course.title}": ${title}`,
            type: "course_update",
          })),
        })
        console.log(`[NOTIFICATION] Created ${enrollments.length} notifications for new lesson`)
      }
    } catch (notifError: any) {
      console.error("[NOTIFICATION] Error creating new lesson notifications:", notifError)
      // Não falhar a criação da aula se a notificação falhar
    }

    return NextResponse.json(lesson)
  } catch (error: any) {
    console.error("Error creating lesson:", error)
    return NextResponse.json(
      { error: "Erro ao criar aula" },
      { status: 500 }
    )
  }
}


import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

export async function GET(
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

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
    })

    if (!lesson) {
      return NextResponse.json(
        { error: "Aula não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(lesson)
  } catch (error: any) {
    console.error("Error fetching lesson:", error)
    return NextResponse.json(
      { error: "Erro ao buscar aula" },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const data = await req.json()

    const lesson = await prisma.lesson.update({
      where: { id: params.id },
      data: {
        title: data.title,
        videoUrl: data.videoUrl || null,
        attachmentUrl: data.attachmentUrl || null,
        duration: data.duration || null,
        isFreePreview: data.isFreePreview || false,
        content: data.content || null,
      },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    })

    // Criar notificação para alunos inscritos no curso
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: lesson.module.course.id },
        select: { userId: true },
      })

      if (enrollments.length > 0) {
        await prisma.notification.createMany({
          data: enrollments.map((enrollment) => ({
            userId: enrollment.userId,
            courseId: lesson.module.course.id,
            title: "Aula Atualizada",
            message: `Uma aula foi atualizada no curso "${lesson.module.course.title}": ${lesson.title}`,
            type: "course_update",
          })),
        })
        console.log(`[NOTIFICATION] Created ${enrollments.length} notifications for lesson update`)
      }
    } catch (notifError: any) {
      console.error("[NOTIFICATION] Error creating lesson update notifications:", notifError)
      // Não falhar a atualização da aula se a notificação falhar
    }

    return NextResponse.json(lesson)
  } catch (error: any) {
    console.error("Error updating lesson:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar aula" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await prisma.lesson.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting lesson:", error)
    return NextResponse.json(
      { error: "Erro ao deletar aula" },
      { status: 500 }
    )
  }
}

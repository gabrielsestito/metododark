import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json(
        { error: "Aula não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se está inscrito (ou se é preview grátis)
    if (!lesson.isFreePreview) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: lesson.module.course.id,
          },
        },
      })

      if (!enrollment) {
        return NextResponse.json(
          { error: "Você não está inscrito neste curso" },
          { status: 403 }
        )
      }
    }

    // Buscar ou criar enrollment para preview grátis
    let enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.module.course.id,
        },
      },
    })

    if (!enrollment && lesson.isFreePreview) {
      // Para preview grátis, não criamos enrollment, mas permitimos progresso
      enrollment = null
    }

    // Criar ou atualizar progresso
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lesson.id,
        },
      },
      create: {
        userId: session.user.id,
        lessonId: lesson.id,
        enrollmentId: enrollment?.id,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking lesson complete:", error)
    return NextResponse.json(
      { error: "Erro ao marcar aula como concluída" },
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    await prisma.lessonProgress.updateMany({
      where: {
        userId: session.user.id,
        lessonId: params.id,
      },
      data: {
        completed: false,
        completedAt: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unmarking lesson:", error)
    return NextResponse.json(
      { error: "Erro ao desmarcar aula" },
      { status: 500 }
    )
  }
}


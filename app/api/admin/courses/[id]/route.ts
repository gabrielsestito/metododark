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
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error: any) {
    console.error("Error fetching course:", error)
    return NextResponse.json(
      { error: "Erro ao buscar curso" },
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

    // Validar dados obrigatórios
    if (!data.title || !data.price || !data.level || !data.category) {
      return NextResponse.json(
        { error: "Campos obrigatórios: título, preço, nível e categoria" },
        { status: 400 }
      )
    }

    // Validar se o curso existe
    const existingCourse = await prisma.course.findUnique({
      where: { id: params.id },
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    // Validar valores numéricos
    if (isNaN(parseFloat(data.price))) {
      return NextResponse.json(
        { error: "Preço inválido" },
        { status: 400 }
      )
    }

    if (data.promoPrice && isNaN(parseFloat(data.promoPrice))) {
      return NextResponse.json(
        { error: "Preço promocional inválido" },
        { status: 400 }
      )
    }

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || null,
        description: data.description?.trim() || null,
        thumbnailUrl: data.thumbnailUrl?.trim() || null,
        trailerUrl: data.trailerUrl?.trim() || null,
        price: parseFloat(data.price),
        promoPrice: data.promoPrice ? parseFloat(data.promoPrice) : null,
        level: data.level,
        category: data.category,
        isPublished: data.isPublished === true || data.isPublished === "true",
      },
    })

    // Criar notificação para alunos inscritos quando o curso é atualizado
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: params.id },
        select: { userId: true },
      })

      console.log(`[NOTIFICATION] Course updated: ${params.id}, Enrollments found: ${enrollments.length}`)

      if (enrollments.length > 0) {
        await prisma.notification.createMany({
          data: enrollments.map((enrollment) => ({
            userId: enrollment.userId,
            courseId: params.id,
            title: "Curso Atualizado",
            message: `O curso "${course.title}" foi atualizado. Confira as novidades!`,
            type: "course_update",
          })),
        })
        console.log(`[NOTIFICATION] Created ${enrollments.length} notifications for course update`)
      }
    } catch (notifError: any) {
      console.error("[NOTIFICATION] Error creating course update notifications:", notifError)
      // Não falhar a atualização do curso se a notificação falhar
    }

    return NextResponse.json(course)
  } catch (error: any) {
    console.error("Error updating course:", error)
    
    // Mensagens de erro mais específicas
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um curso com este título" },
        { status: 400 }
      )
    }
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        error: "Erro ao atualizar curso",
        details: error.message || "Erro desconhecido"
      },
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

    // Apenas CEO pode excluir cursos
    if (session.user.role !== "CEO") {
      return NextResponse.json(
        { error: "Apenas o CEO pode excluir cursos" },
        { status: 403 }
      )
    }

    if (process.env.ALLOW_COURSE_DELETE !== "true") {
      return NextResponse.json(
        { error: "Exclusão de curso desativada por segurança" },
        { status: 403 }
      )
    }

    await prisma.course.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting course:", error)
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao deletar curso" },
      { status: 500 }
    )
  }
}


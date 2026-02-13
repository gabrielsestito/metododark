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
    if (!permissions.canManageUsers) {
      return NextResponse.json(
        { error: "Sem permissão para gerenciar usuários" },
        { status: 403 }
      )
    }

    const { courseId, expiresAt } = await req.json()

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId é obrigatório" },
        { status: 400 }
      )
    }

    // Validar se o curso existe
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      )
    }

    // Validar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Converter expiresAt para Date ou null
    let expiresAtDate: Date | null = null
    if (expiresAt) {
      if (typeof expiresAt === "string") {
        expiresAtDate = new Date(expiresAt)
      } else if (expiresAt instanceof Date) {
        expiresAtDate = expiresAt
      } else {
        // Se for um número (timestamp), converter
        expiresAtDate = new Date(expiresAt)
      }

      // Validar se a data é válida
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json(
          { error: "Data de expiração inválida" },
          { status: 400 }
        )
      }
    }

    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: params.id,
          courseId,
        },
      },
      create: {
        userId: params.id,
        courseId,
        expiresAt: expiresAtDate,
      },
      update: {
        expiresAt: expiresAtDate,
      },
    })

    // Criar notificação
    try {
      await prisma.notification.create({
        data: {
          userId: params.id,
          courseId,
          title: "Novo Curso Disponível",
          message: `Você recebeu acesso ao curso "${course.title}". ${expiresAtDate ? `Acesso válido até ${expiresAtDate.toLocaleDateString("pt-BR")}` : "Acesso vitalício"}`,
          type: "new_course",
        },
      })
    } catch (notifError) {
      // Não falhar se a notificação não puder ser criada
      console.error("Error creating notification:", notifError)
    }

    return NextResponse.json(enrollment)
  } catch (error: any) {
    console.error("Error creating enrollment:", error)
    
    // Retornar mensagem de erro mais específica
    let errorMessage = "Erro ao criar enrollment"
    if (error.code === "P2002") {
      errorMessage = "Usuário já está inscrito neste curso"
    } else if (error.code === "P2003") {
      errorMessage = "Curso ou usuário não encontrado"
    } else if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage, details: error.code || error.message },
      { status: 500 }
    )
  }
}


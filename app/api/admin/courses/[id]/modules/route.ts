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
    const lastModule = await prisma.module.findFirst({
      where: { courseId: params.id },
      orderBy: { order: "desc" },
    })

    const order = lastModule ? lastModule.order + 1 : 1

    const newModule = await prisma.module.create({
      data: {
        courseId: params.id,
        title,
        order,
      },
    })

    return NextResponse.json(newModule)
  } catch (error: any) {
    console.error("Error creating module:", error)
    return NextResponse.json(
      { error: "Erro ao criar módulo" },
      { status: 500 }
    )
  }
}


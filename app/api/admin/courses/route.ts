import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await requirePermission("canManageChats")
    if (!session) return unauthorizedResponse()
    const courses = await prisma.course.findMany({
      select: { id: true, title: true, slug: true, isPublished: true },
      orderBy: { title: "asc" },
    })
    return NextResponse.json(courses)
  } catch (error: any) {
    console.error("Error listing courses:", error)
    return NextResponse.json({ error: "Erro ao listar cursos" }, { status: 500 })
  }
}

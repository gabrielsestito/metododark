import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category")
    const level = searchParams.get("level")

    const where: any = {
      isPublished: true,
    }

    if (category && category !== "all") {
      where.category = category
    }

    if (level && level !== "all") {
      where.level = level
    }

    if (search) {
      // MySQL não suporta mode: "insensitive", então usamos contains normal
      // A busca será case-sensitive, mas funciona para a maioria dos casos
      where.OR = [
        { title: { contains: search } },
        { subtitle: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        subtitle: true,
        description: true,
        thumbnailUrl: true,
        price: true,
        promoPrice: true,
        level: true,
        category: true,
        createdAt: true,
      },
    })

    return NextResponse.json(courses)
  } catch (error: any) {
    console.error("[API /api/courses] Erro ao buscar cursos:", error)
    console.error("[API /api/courses] Stack:", error?.stack)
    return NextResponse.json(
      { 
        error: "Erro ao buscar cursos",
        message: error?.message || "Erro desconhecido",
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}


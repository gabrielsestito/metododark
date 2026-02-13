import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await requirePermission("canManageNotifications")
    if (!session) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "10")

    const where: any = {}

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
          },
        },
        {
          email: {
            contains: search,
          },
        },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
    })

    return NextResponse.json(users || [])
  } catch (error: any) {
    console.error("Error searching users:", error)
    // Retornar array vazio em caso de erro para não quebrar o frontend
    return NextResponse.json([])
  }
}

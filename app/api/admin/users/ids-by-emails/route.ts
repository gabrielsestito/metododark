import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await requirePermission("canManageChats")
    if (!session) return unauthorizedResponse()

    const { emails } = await req.json()
    if (!Array.isArray(emails)) {
      return NextResponse.json({ error: "emails deve ser uma lista" }, { status: 400 })
    }
    const users = await prisma.user.findMany({
      where: { email: { in: emails.map((e: string) => e.trim()).filter(Boolean) } },
      select: { id: true, email: true, name: true },
    })
    return NextResponse.json(users)
  } catch (error: any) {
    console.error("ids-by-emails error:", error)
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
  }
}

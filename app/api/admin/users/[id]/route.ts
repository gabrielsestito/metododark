import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission("canManageUsers")
    if (!session) {
      return unauthorizedResponse()
    }

    const { name, email, password, role } = await req.json()

    const updateData: any = {
      name,
      email,
    }

    // Apenas ADMIN e CEO podem alterar roles
    if (role && (session.user.role === "ADMIN" || session.user.role === "CEO")) {
      updateData.role = role
    }

    if (password && password.length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(user)
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    )
  }
}


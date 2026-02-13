import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashResetToken } from "@/lib/password-reset"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e nova senha são obrigatórios" },
        { status: 400 }
      )
    }

    const tokenHash = hashResetToken(token)
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gte: new Date() },
      },
      include: { user: true },
    })

    if (!resetToken?.user) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })

    await prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    )
  }
}

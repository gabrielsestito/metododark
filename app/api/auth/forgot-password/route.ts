import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateResetToken } from "@/lib/password-reset"
import { sendEmail } from "@/lib/email"
import { passwordResetEmail } from "@/lib/email-templates"

const appBaseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Email não cadastrado" },
        { status: 404 }
      )
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    const { token, tokenHash, expiresAt } = generateResetToken()
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    const resetUrl = `${appBaseUrl}/reset-senha?token=${token}`
    const html = passwordResetEmail({
      name: user.name || "Aluno",
      resetUrl,
    })

    await sendEmail({
      to: user.email,
      subject: "Redefinir senha - Método Dark",
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao solicitar redefinição de senha" },
      { status: 500 }
    )
  }
}

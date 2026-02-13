import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/permissions"

// Armazenar status de digitação em memória (em produção, usar Redis)
const typingStatus = new Map<string, { typing: boolean; userId: string; userName: string; timestamp: number }>()

// Enviar indicador de digitação
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { typing } = await req.json()
    const isStaff = isAdminRole(session.user.role)
    const key = `${params.id}:${isStaff ? "staff" : session.user.id}`

    typingStatus.set(key, {
      typing,
      userId: isStaff ? "staff" : session.user.id!,
      userName: session.user.name || "Usuário",
      timestamp: Date.now(),
    })

    // Limpar status antigo após 5 segundos
    setTimeout(() => {
      typingStatus.delete(key)
    }, 5000)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error setting typing status:", error)
    return NextResponse.json(
      { error: "Erro ao definir status de digitação" },
      { status: 500 }
    )
  }
}

// Verificar status de digitação
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Limpar status antigos (mais de 5 segundos)
    const now = Date.now()
    const entries = Array.from(typingStatus.entries())
    for (const [key, value] of entries) {
      if (now - value.timestamp > 5000) {
        typingStatus.delete(key)
      }
    }

    // Buscar status de digitação do outro usuário
    const isStaff = isAdminRole(session.user.role)
    const currentUserId = isStaff ? "staff" : session.user.id!
    const allEntries = Array.from(typingStatus.entries())
    for (const [key, value] of allEntries) {
      if (key.startsWith(`${params.id}:`) && value.userId !== currentUserId && value.typing) {
        return NextResponse.json({
          typing: true,
          userId: value.userId,
          userName: value.userName,
        })
      }
    }

    return NextResponse.json({ typing: false })
  } catch (error: any) {
    console.error("Error getting typing status:", error)
    return NextResponse.json(
      { error: "Erro ao buscar status de digitação" },
      { status: 500 }
    )
  }
}


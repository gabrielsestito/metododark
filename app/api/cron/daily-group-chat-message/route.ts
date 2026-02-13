import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// Esta rota deve ser chamada diariamente às 00:00 por um cron job
// Pode ser configurada no Vercel Cron ou similar
export async function GET(req: Request) {
  try {
    // Verificar se é uma chamada autorizada (pode adicionar um token de segurança)
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar todos os chats de grupo ativos
    const groupChats = await prisma.courseGroupChat.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
            isPublished: true,
          },
        },
      },
    })

    const message = "💬 Olá! Lembrem-se: este grupo é para todos se ajudarem. Sejam respeitosos e mantenham um ambiente positivo. Em caso de falta de respeito, os administradores podem tomar medidas. Obrigado pela compreensão! 🙏"

    let successCount = 0
    let errorCount = 0

    // Enviar mensagem para cada chat
    for (const chat of groupChats) {
      // Só enviar para cursos publicados
      if (!chat.course.isPublished) continue

      try {
        // Verificar se já foi enviada uma mensagem hoje (evitar duplicatas)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const todayMessage = await prisma.courseGroupChatMessage.findFirst({
          where: {
            chatId: chat.id,
            content: message,
            createdAt: {
              gte: today,
            },
          },
        })

        if (todayMessage) {
          continue // Já foi enviada hoje
        }

        // Criar mensagem do sistema (senderId null = mensagem do sistema)
        await prisma.courseGroupChatMessage.create({
          data: {
            chatId: chat.id,
            senderId: null, // Mensagem do sistema
            content: message,
            isDeleted: false,
          },
        })

        successCount++
      } catch (error) {
        console.error(`Error sending daily message to chat ${chat.id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Mensagens enviadas: ${successCount} sucesso, ${errorCount} erros`,
      successCount,
      errorCount,
    })
  } catch (error: any) {
    console.error("Error in daily group chat message cron:", error)
    return NextResponse.json(
      { error: "Erro ao processar mensagens diárias", details: error.message },
      { status: 500 }
    )
  }
}

// Também permitir POST para compatibilidade
export async function POST(req: Request) {
  return GET(req)
}

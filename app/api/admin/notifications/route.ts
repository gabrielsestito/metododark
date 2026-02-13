import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"

export async function POST(req: Request) {
  try {
    const session = await requirePermission("canManageNotifications")
    if (!session) {
      return unauthorizedResponse()
    }

    const { title, message, courseId, userId } = await req.json()
    const notificationType = "admin_notice"

    // Validação
    if (!title || !message) {
      return NextResponse.json(
        { error: "Título e mensagem são obrigatórios" },
        { status: 400 }
      )
    }

    console.log("[NOTIFICATION] Creating notification with data:", {
      title,
      message,
      type: notificationType,
      courseId,
      userId,
    })

    let createdCount = 0

    if (userId) {
      // Notificação para usuário específico
      const notification = await prisma.notification.create({
        data: {
          userId,
          courseId: courseId || null,
          title,
          message,
          type: notificationType,
        },
      })
      createdCount = 1
      console.log("[NOTIFICATION] Created notification for user:", notification.id)
    } else if (courseId) {
      // Notificação para todos os alunos de um curso específico
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        select: { userId: true },
      })

      console.log(`[NOTIFICATION] Found ${enrollments.length} enrollments for course ${courseId}`)

      if (enrollments.length > 0) {
        try {
          const result = await prisma.notification.createMany({
            data: enrollments.map((enrollment) => ({
              userId: enrollment.userId,
              courseId,
              title,
              message,
              type: notificationType,
            })),
          })
          createdCount = result.count
          console.log(`[NOTIFICATION] Created ${result.count} notifications for course`)
        } catch (createError: any) {
          console.error("[NOTIFICATION] Error in createMany:", createError)
          // Tentar criar uma por uma se createMany falhar
          console.log("[NOTIFICATION] Trying to create notifications one by one...")
          for (const enrollment of enrollments) {
            try {
              await prisma.notification.create({
                data: {
                  userId: enrollment.userId,
                  courseId,
                  title,
                  message,
                  type: notificationType,
                },
              })
              createdCount++
            } catch (singleError: any) {
              console.error(`[NOTIFICATION] Failed to create notification for user ${enrollment.userId}:`, singleError.message)
            }
          }
          console.log(`[NOTIFICATION] Created ${createdCount} notifications individually`)
        }
      } else {
        console.log("[NOTIFICATION] No enrollments found for course, no notifications created")
        return NextResponse.json(
          { 
            success: false,
            error: "Nenhum aluno inscrito neste curso",
            count: 0
          },
          { status: 400 }
        )
      }
    } else {
      // Notificação global para todos os usuários
      const allUsers = await prisma.user.findMany({
        select: { id: true },
      })

      console.log(`[NOTIFICATION] Found ${allUsers.length} users for global notification`)

      if (allUsers.length > 0) {
        try {
          const result = await prisma.notification.createMany({
            data: allUsers.map((user) => ({
              userId: user.id,
              courseId: null,
              title,
              message,
              type: notificationType,
            })),
          })
          createdCount = result.count
          console.log(`[NOTIFICATION] Created ${result.count} global notifications`)
        } catch (createError: any) {
          console.error("[NOTIFICATION] Error in createMany:", createError)
          // Tentar criar uma por uma se createMany falhar
          console.log("[NOTIFICATION] Trying to create notifications one by one...")
          for (const user of allUsers) {
            try {
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  courseId: null,
                  title,
                  message,
                  type: notificationType,
                },
              })
              createdCount++
            } catch (singleError: any) {
              console.error(`[NOTIFICATION] Failed to create notification for user ${user.id}:`, singleError.message)
            }
          }
          console.log(`[NOTIFICATION] Created ${createdCount} notifications individually`)
        }
      } else {
        console.log("[NOTIFICATION] No users found, no notifications created")
        return NextResponse.json(
          { 
            success: false,
            error: "Nenhum usuário encontrado no sistema",
            count: 0
          },
          { status: 400 }
        )
      }
    }

    console.log(`[NOTIFICATION] Success! Created ${createdCount} notification(s)`)

    return NextResponse.json({ 
      success: true, 
      count: createdCount,
      message: `Notificação criada com sucesso! ${createdCount} notificação(ões) enviada(s).`
    })
  } catch (error: any) {
    console.error("[NOTIFICATION] Error creating notification:", error)
    console.error("[NOTIFICATION] Error details:", {
      code: error.code,
      message: error.message,
      meta: error.meta,
    })
    return NextResponse.json(
      { 
        error: "Erro ao criar notificação", 
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    )
  }
}

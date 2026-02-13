import { NextResponse } from "next/server"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"
import { exec } from "child_process"
import { promisify } from "util"
import { writeFile, readFile } from "fs/promises"
import { join } from "path"
import { format } from "date-fns"

const execAsync = promisify(exec)

export async function POST() {
  try {
    const session = await requirePermission("canBackupDatabase")
    if (!session) {
      return unauthorizedResponse()
    }

    // Obter URL do banco de dados
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL não configurada" },
        { status: 500 }
      )
    }

    // Parse da URL do MySQL
    // mysql://user:password@host:port/database
    const url = new URL(databaseUrl.replace("mysql://", "http://"))
    const dbName = url.pathname.slice(1)
    const dbUser = url.username
    const dbPassword = url.password
    const dbHost = url.hostname
    const dbPort = url.port || "3306"

    // Nome do arquivo de backup
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss")
    const backupFileName = `backup_${timestamp}.sql`
    const backupPath = join(process.cwd(), "backups", backupFileName)

    // Criar diretório de backups se não existir
    const { mkdir } = require("fs/promises")
    await mkdir(join(process.cwd(), "backups"), { recursive: true })

    // Comando mysqldump
    const dumpCommand = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} > "${backupPath}"`

    try {
      await execAsync(dumpCommand)
      
      // Verificar se o arquivo foi criado
      try {
        const fileContent = await readFile(backupPath)
        return new NextResponse(fileContent, {
          headers: {
            "Content-Type": "application/sql",
            "Content-Disposition": `attachment; filename="${backupFileName}"`,
          },
        })
      } catch (readError) {
        // Se não conseguir ler, criar backup via Prisma
        throw new Error("Arquivo SQL não foi criado corretamente")
      }
    } catch (error: any) {
      // Se mysqldump não estiver disponível, criar backup via Prisma
      console.log("mysqldump não disponível, criando backup via Prisma...")
      
      // Exportar dados via Prisma e converter para SQL
      const { prisma } = await import("@/lib/prisma")
      
      // Função auxiliar para escapar strings SQL
      const escapeSQL = (value: any): string => {
        if (value === null || value === undefined) return 'NULL'
        if (typeof value === 'boolean') return value ? '1' : '0'
        if (typeof value === 'number') return String(value)
        if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`
        return `'${String(value).replace(/'/g, "''")}'`
      }

      // Mapeamento de campos do modelo para colunas do banco
      const fieldMapping: Record<string, Record<string, string>> = {
        users: {
          passwordHash: 'password_hash',
          createdAt: 'created_at',
        },
        courses: {
          thumbnailUrl: 'thumbnail_url',
          trailerUrl: 'trailer_url',
          promoPrice: 'promo_price',
          isPublished: 'is_published',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        },
        modules: {
          courseId: 'course_id',
        },
        lessons: {
          moduleId: 'module_id',
          videoUrl: 'video_url',
          attachmentUrl: 'attachment_url',
          isFreePreview: 'is_free_preview',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        },
        orders: {
          userId: 'user_id',
          totalAmount: 'total_amount',
          paymentMethod: 'payment_method',
          paymentStatus: 'payment_status',
          createdAt: 'created_at',
        },
        order_items: {
          orderId: 'order_id',
          courseId: 'course_id',
          price: 'price',
        },
        enrollments: {
          userId: 'user_id',
          courseId: 'course_id',
          enrolledAt: 'enrolled_at',
        },
        lesson_progress: {
          enrollmentId: 'enrollment_id',
          lessonId: 'lesson_id',
          completedAt: 'completed_at',
          updatedAt: 'updated_at',
        },
        subscriptions: {
          userId: 'user_id',
          planId: 'plan_id',
          startDate: 'start_date',
          endDate: 'end_date',
        },
        subscription_plans: {
          isActive: 'is_active',
        },
        subscription_plan_courses: {
          planId: 'plan_id',
          courseId: 'course_id',
        },
        notifications: {
          userId: 'user_id',
          courseId: 'course_id',
          createdAt: 'created_at',
        },
        chats: {
          userId: 'user_id',
          assignedTo: 'assigned_to',
          courseId: 'course_id',
          lessonId: 'lesson_id',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        },
        chat_messages: {
          chatId: 'chat_id',
          senderId: 'sender_id',
          attachmentUrl: 'attachment_url',
          attachmentName: 'attachment_name',
          isSystem: 'is_system',
          readAt: 'read_at',
          createdAt: 'created_at',
        },
      }

      // Função para gerar INSERT statements
      const generateInserts = (tableName: string, data: any[]): string => {
        if (data.length === 0) return `-- ${tableName}: sem dados\n\n`
        
        const mapping = fieldMapping[tableName] || {}
        const firstRow = data[0]
        const modelColumns = Object.keys(firstRow)
        const dbColumns = modelColumns.map(col => mapping[col] || col)
        
        const inserts = data.map(row => {
          const values = modelColumns.map(col => escapeSQL(row[col])).join(', ')
          return `INSERT INTO \`${tableName}\` (\`${dbColumns.join('`, `')}\`) VALUES (${values});`
        }).join('\n')
        
        return `-- ${tableName}\n${inserts}\n\n`
      }

      // Buscar todos os dados
      const [courses, users, orders, enrollments, subscriptions, chats, chatMessages, notifications, modules, lessons, lessonProgress, orderItems, subscriptionPlanCourses, subscriptionPlans] = await Promise.all([
        prisma.course.findMany(),
        prisma.user.findMany(),
        prisma.order.findMany(),
        prisma.enrollment.findMany(),
        prisma.subscription.findMany(),
        prisma.chat.findMany(),
        prisma.chatMessage.findMany(),
        prisma.notification.findMany(),
        prisma.module.findMany(),
        prisma.lesson.findMany(),
        prisma.lessonProgress.findMany(),
        prisma.orderItem.findMany(),
        prisma.subscriptionPlanCourse.findMany(),
        prisma.subscriptionPlan.findMany(),
      ])

      // Gerar SQL
      let sqlContent = `-- Backup do Banco de Dados\n`
      sqlContent += `-- Gerado em: ${new Date().toISOString()}\n`
      sqlContent += `-- Banco: ${dbName}\n\n`
      sqlContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`
      
      // Gerar INSERTs para cada tabela (em ordem de dependência)
      sqlContent += generateInserts('subscription_plans', subscriptionPlans)
      sqlContent += generateInserts('courses', courses)
      sqlContent += generateInserts('modules', modules)
      sqlContent += generateInserts('lessons', lessons)
      sqlContent += generateInserts('users', users)
      sqlContent += generateInserts('orders', orders)
      sqlContent += generateInserts('order_items', orderItems)
      sqlContent += generateInserts('enrollments', enrollments)
      sqlContent += generateInserts('lesson_progress', lessonProgress)
      sqlContent += generateInserts('subscriptions', subscriptions)
      sqlContent += generateInserts('subscription_plan_courses', subscriptionPlanCourses)
      sqlContent += generateInserts('chats', chats)
      sqlContent += generateInserts('chat_messages', chatMessages)
      sqlContent += generateInserts('notifications', notifications)
      
      sqlContent += `SET FOREIGN_KEY_CHECKS=1;\n`

      // Salvar como arquivo SQL
      await writeFile(backupPath, sqlContent, 'utf8')
      
      // Retornar o arquivo SQL para download
      const fileContent = await readFile(backupPath)
      return new NextResponse(fileContent, {
        headers: {
          "Content-Type": "application/sql",
          "Content-Disposition": `attachment; filename="${backupFileName}"`,
        },
      })
    }
  } catch (error: any) {
    console.error("Error creating backup:", error)
    return NextResponse.json(
      { error: "Erro ao criar backup: " + error.message },
      { status: 500 }
    )
  }
}


import { writeFile, readFile, mkdir, readdir, stat, unlink } from "fs/promises"
import { join } from "path"
import { format } from "date-fns"
import { prisma } from "../lib/prisma"

const escapeSQL = (value: any): string => {
  if (value === null || value === undefined) return "NULL"
  if (typeof value === "boolean") return value ? "1" : "0"
  if (typeof value === "number") return String(value)
  if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`
  return `'${String(value).replace(/'/g, "''")}'`
}

const fieldMapping: Record<string, Record<string, string>> = {
  users: {
    passwordHash: "password_hash",
    createdAt: "created_at",
  },
  courses: {
    thumbnailUrl: "thumbnail_url",
    trailerUrl: "trailer_url",
    promoPrice: "promo_price",
    isPublished: "is_published",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  modules: {
    courseId: "course_id",
  },
  lessons: {
    moduleId: "module_id",
    videoUrl: "video_url",
    attachmentUrl: "attachment_url",
    isFreePreview: "is_free_preview",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  orders: {
    userId: "user_id",
    totalAmount: "total_amount",
    paymentMethod: "payment_method",
    paymentStatus: "payment_status",
    createdAt: "created_at",
  },
  order_items: {
    orderId: "order_id",
    courseId: "course_id",
    price: "price",
  },
  enrollments: {
    userId: "user_id",
    courseId: "course_id",
    enrolledAt: "enrolled_at",
  },
  lesson_progress: {
    enrollmentId: "enrollment_id",
    lessonId: "lesson_id",
    completedAt: "completed_at",
    updatedAt: "updated_at",
  },
  subscriptions: {
    userId: "user_id",
    planId: "plan_id",
    startDate: "start_date",
    endDate: "end_date",
  },
  subscription_plans: {
    isActive: "is_active",
  },
  subscription_plan_courses: {
    planId: "plan_id",
    courseId: "course_id",
  },
  notifications: {
    userId: "user_id",
    courseId: "course_id",
    createdAt: "created_at",
  },
  chats: {
    userId: "user_id",
    assignedTo: "assigned_to",
    courseId: "course_id",
    lessonId: "lesson_id",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  chat_messages: {
    chatId: "chat_id",
    senderId: "sender_id",
    attachmentUrl: "attachment_url",
    attachmentName: "attachment_name",
    isSystem: "is_system",
    readAt: "read_at",
    createdAt: "created_at",
  },
}

const generateInserts = (tableName: string, data: any[]): string => {
  if (data.length === 0) return `-- ${tableName}: sem dados\n\n`
  const mapping = fieldMapping[tableName] || {}
  const firstRow = data[0]
  const modelColumns = Object.keys(firstRow)
  const dbColumns = modelColumns.map((col) => mapping[col] || col)
  const inserts = data
    .map((row) => {
      const values = modelColumns.map((col) => escapeSQL(row[col])).join(", ")
      return `INSERT INTO \`${tableName}\` (\`${dbColumns.join("`, `")}\`) VALUES (${values});`
    })
    .join("\n")
  return `-- ${tableName}\n${inserts}\n\n`
}

async function runBackup() {
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss")
  const backupFileName = `backup_${timestamp}.sql`
  const backupsDir = join(process.cwd(), "backups")
  const backupPath = join(backupsDir, backupFileName)
  await mkdir(backupsDir, { recursive: true })

  const [
    courses,
    users,
    orders,
    enrollments,
    subscriptions,
    chats,
    chatMessages,
    notifications,
    modules,
    lessons,
    lessonProgress,
    orderItems,
    subscriptionPlanCourses,
    subscriptionPlans,
  ] = await Promise.all([
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

  let sqlContent = `-- Backup do Banco de Dados\n`
  sqlContent += `-- Gerado em: ${new Date().toISOString()}\n\n`
  sqlContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`
  sqlContent += generateInserts("subscription_plans", subscriptionPlans)
  sqlContent += generateInserts("courses", courses)
  sqlContent += generateInserts("modules", modules)
  sqlContent += generateInserts("lessons", lessons)
  sqlContent += generateInserts("users", users)
  sqlContent += generateInserts("orders", orders)
  sqlContent += generateInserts("order_items", orderItems)
  sqlContent += generateInserts("enrollments", enrollments)
  sqlContent += generateInserts("lesson_progress", lessonProgress)
  sqlContent += generateInserts("subscriptions", subscriptions)
  sqlContent += generateInserts("subscription_plan_courses", subscriptionPlanCourses)
  sqlContent += generateInserts("chats", chats)
  sqlContent += generateInserts("chat_messages", chatMessages)
  sqlContent += generateInserts("notifications", notifications)
  sqlContent += `SET FOREIGN_KEY_CHECKS=1;\n`

  await writeFile(backupPath, sqlContent, "utf8")
  const fileContent = await readFile(backupPath)
  console.log(`Backup criado: ${backupFileName} (${fileContent.byteLength} bytes)`)

  const files = await readdir(backupsDir)
  const sqlFiles = files.filter((f) => f.endsWith(".sql"))
  const stats = await Promise.all(sqlFiles.map(async (f) => ({ name: f, s: await stat(join(backupsDir, f)) })))
  stats.sort((a, b) => b.s.mtimeMs - a.s.mtimeMs)
  const keep = 30
  const toDelete = stats.slice(keep)
  for (const f of toDelete) {
    await unlink(join(backupsDir, f.name))
    console.log(`Backup removido: ${f.name}`)
  }
}

runBackup().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  process.exit(1)
})

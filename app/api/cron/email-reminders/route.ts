import { NextResponse } from "next/server"
import { runEmailReminders } from "@/lib/email-reminders"

export const dynamic = "force-dynamic"

function isAuthorized(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { remarketingSent, expirySent } = await runEmailReminders()

  return NextResponse.json({
    success: true,
    remarketingSent,
    expirySent,
  })
}

export async function POST(req: Request) {
  return GET(req)
}

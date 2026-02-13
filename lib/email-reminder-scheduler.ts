import { runEmailReminders } from "@/lib/email-reminders"

const SCHEDULER_TIMEZONE = "America/Sao_Paulo"
const TARGET_HOUR = 11
const TARGET_MINUTE = 50

function getDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHEDULER_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: Number(map.hour),
    minute: Number(map.minute),
    dateKey: `${map.year}-${map.month}-${map.day}`,
  }
}

function shouldRunNow(lastRunDateKey: string | null) {
  const parts = getDateParts(new Date())
  if (parts.hour !== TARGET_HOUR || parts.minute !== TARGET_MINUTE) return null
  if (lastRunDateKey === parts.dateKey) return null
  return parts.dateKey
}

export function startEmailReminderScheduler() {
  const globalForScheduler = globalThis as unknown as {
    emailReminderInterval?: NodeJS.Timeout
    lastEmailReminderRun?: string | null
  }

  if (globalForScheduler.emailReminderInterval) return

  globalForScheduler.lastEmailReminderRun = globalForScheduler.lastEmailReminderRun || null

  const tick = async () => {
    const runKey = shouldRunNow(globalForScheduler.lastEmailReminderRun || null)
    if (!runKey) return
    globalForScheduler.lastEmailReminderRun = runKey
    await runEmailReminders()
  }

  globalForScheduler.emailReminderInterval = setInterval(tick, 60 * 1000)
}

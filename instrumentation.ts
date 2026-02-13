import { startEmailReminderScheduler } from "@/lib/email-reminder-scheduler"

export async function register() {
  const noop = () => {}
  console.log = noop
  console.info = noop
  console.warn = noop
  console.error = noop
  console.debug = noop

  startEmailReminderScheduler()
}

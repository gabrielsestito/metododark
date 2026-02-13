export const ALLOWED_NOTIFICATION_TYPES = [
  "course_update",
  "new_course",
  "subscription_active",
  "admin_notice",
] as const

export type AllowedNotificationType = (typeof ALLOWED_NOTIFICATION_TYPES)[number]

export function isAllowedNotificationType(type?: string | null): type is AllowedNotificationType {
  return !!type && ALLOWED_NOTIFICATION_TYPES.includes(type as AllowedNotificationType)
}

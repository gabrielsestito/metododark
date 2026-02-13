import { AllowedNotificationType } from "@/lib/notification-types"

/**
 * Helper function to show toast notification (temporary, doesn't save to database)
 */
function showToast(title: string, message: string, variant: "success" | "error" | "warning" | "info" = "info") {
  if (typeof window === "undefined") {
    console.log(`[${variant.toUpperCase()}] ${title}: ${message}`)
    return
  }
  
  // Import toast dynamically to avoid SSR issues
  import("@/lib/toast").then(({ toast }) => {
    toast[variant](title, message)
  }).catch(() => {
    // Fallback to console if toast is not available
    console.log(`[${variant.toUpperCase()}] ${title}: ${message}`)
  })
}

/**
 * Helper function to create notifications for the current user (saves to database)
 * Use this for important notifications that should persist (e.g., payment confirmed, new course available)
 */
export async function createNotification({
  title,
  message,
  type = "admin_notice",
  courseId = null,
}: {
  title: string
  message: string
  type?: AllowedNotificationType
  courseId?: string | null
}) {
  try {
    const response = await fetch("/api/notifications/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        message,
        type,
        courseId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Error creating notification:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error creating notification:", error)
    return false
  }
}

/**
 * Helper function to show success toast (temporary notification)
 * Use for system actions like "Adicionado ao carrinho", "Curso adicionado", "Usuário atualizado"
 */
export function notifySuccess(title: string, message: string, courseId?: string | null) {
  showToast(title, message, "success")
  return Promise.resolve(true)
}

/**
 * Helper function to show error toast (temporary notification)
 * Use for system errors like validation errors, API errors, etc.
 */
export function notifyError(title: string, message: string, courseId?: string | null) {
  showToast(title, message, "error")
  return Promise.resolve(true)
}

/**
 * Helper function to show info toast (temporary notification)
 */
export function notifyInfo(title: string, message: string, courseId?: string | null) {
  showToast(title, message, "info")
  return Promise.resolve(true)
}

/**
 * Helper function to show warning toast (temporary notification)
 */
export function notifyWarning(title: string, message: string, courseId?: string | null) {
  showToast(title, message, "warning")
  return Promise.resolve(true)
}

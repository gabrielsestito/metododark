"use client"

// Global toast instance that will be set by the Toaster component
let toastInstance: typeof import("@/components/ui/use-toast").toast | null = null

export function setToastInstance(instance: typeof import("@/components/ui/use-toast").toast) {
  toastInstance = instance
}

/**
 * Global toast functions that can be used anywhere in the app
 * These show temporary notifications that disappear automatically
 */
export const toast = {
  success: (title: string, description?: string) => {
    if (toastInstance) {
      toastInstance({
        title,
        description,
        variant: "success",
        duration: 8000, // 8 segundos
      })
    } else if (typeof window !== "undefined") {
      console.log(`[SUCCESS] ${title}: ${description || ""}`)
    }
  },
  error: (title: string, description?: string) => {
    if (toastInstance) {
      toastInstance({
        title,
        description,
        variant: "error",
        duration: 8000, // 8 segundos
      })
    } else if (typeof window !== "undefined") {
      console.log(`[ERROR] ${title}: ${description || ""}`)
    }
  },
  warning: (title: string, description?: string) => {
    if (toastInstance) {
      toastInstance({
        title,
        description,
        variant: "warning",
        duration: 8000, // 8 segundos
      })
    } else if (typeof window !== "undefined") {
      console.log(`[WARNING] ${title}: ${description || ""}`)
    }
  },
  info: (title: string, description?: string) => {
    if (toastInstance) {
      toastInstance({
        title,
        description,
        variant: "info",
        duration: 8000, // 8 segundos
      })
    } else if (typeof window !== "undefined") {
      console.log(`[INFO] ${title}: ${description || ""}`)
    }
  },
}

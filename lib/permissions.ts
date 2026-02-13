// Sistema de permissões baseado em roles

export type UserRole = "STUDENT" | "ASSISTANT" | "ADMIN" | "FINANCIAL" | "CEO"

export interface Permissions {
  canManageCourses: boolean
  canManageUsers: boolean
  canManageChats: boolean
  canViewFinancial: boolean
  canManageFinancial: boolean
  canManageSubscriptions: boolean
  canManageNotifications: boolean
  canViewOrders: boolean
  canManageOrders: boolean
  canBackupDatabase: boolean
}

export function getPermissions(role: string): Permissions {
  const permissions: Record<UserRole, Permissions> = {
    STUDENT: {
      canManageCourses: false,
      canManageUsers: false,
      canManageChats: false,
      canViewFinancial: false,
      canManageFinancial: false,
      canManageSubscriptions: false,
      canManageNotifications: false,
      canViewOrders: false,
      canManageOrders: false,
      canBackupDatabase: false,
    },
    ASSISTANT: {
      canManageCourses: false,
      canManageUsers: false,
      canManageChats: true, // Pode responder chats
      canViewFinancial: false,
      canManageFinancial: false,
      canManageSubscriptions: false,
      canManageNotifications: false,
      canViewOrders: false,
      canManageOrders: false,
      canBackupDatabase: false,
    },
    ADMIN: {
      canManageCourses: true,
      canManageUsers: true,
      canManageChats: true,
      canViewFinancial: false, // Não pode ver financeiro
      canManageFinancial: false,
      canManageSubscriptions: true,
      canManageNotifications: true,
      canViewOrders: true,
      canManageOrders: true,
      canBackupDatabase: false,
    },
    FINANCIAL: {
      canManageCourses: false,
      canManageUsers: false,
      canManageChats: true, // Pode responder chats
      canViewFinancial: true,
      canManageFinancial: true,
      canManageSubscriptions: true,
      canManageNotifications: false,
      canViewOrders: true,
      canManageOrders: true,
      canBackupDatabase: false,
    },
    CEO: {
      canManageCourses: true,
      canManageUsers: true,
      canManageChats: true,
      canViewFinancial: true,
      canManageFinancial: true,
      canManageSubscriptions: true,
      canManageNotifications: true,
      canViewOrders: true,
      canManageOrders: true,
      canBackupDatabase: true, // Apenas CEO pode fazer backup
    },
  }

  return permissions[role as UserRole] || permissions.STUDENT
}

export function hasPermission(role: string, permission: keyof Permissions): boolean {
  return getPermissions(role)[permission]
}

export function isAdminRole(role: string): boolean {
  return ["ASSISTANT", "ADMIN", "FINANCIAL", "CEO"].includes(role)
}


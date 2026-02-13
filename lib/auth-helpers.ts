import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPermissions, hasPermission, isAdminRole } from "./permissions"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return null
  }
  return session
}

export async function requireAdminRole() {
  const session = await requireAuth()
  if (!session || !isAdminRole(session.user.role)) {
    return null
  }
  return session
}

export async function requirePermission(permission: keyof ReturnType<typeof getPermissions>) {
  const session = await requireAuth()
  if (!session || !hasPermission(session.user.role, permission)) {
    return null
  }
  return session
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Não autorizado" },
    { status: 403 }
  )
}


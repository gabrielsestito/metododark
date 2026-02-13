"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"
import { ConfirmProvider } from "@/components/confirm-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
      <ConfirmProvider />
    </SessionProvider>
  )
}


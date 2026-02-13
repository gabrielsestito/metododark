"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface MarkAllReadButtonProps {
  onUpdate?: () => void
}

export function MarkAllReadButton({ onUpdate }: MarkAllReadButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
      })
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleMarkAllRead}
      disabled={loading}
      variant="outline"
      className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
    >
      <CheckCircle className="h-4 w-4 mr-2" />
      Marcar todas como lidas
    </Button>
  )
}


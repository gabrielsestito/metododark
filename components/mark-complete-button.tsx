"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface MarkCompleteButtonProps {
  lessonId: string
  completed: boolean
}

export function MarkCompleteButton({
  lessonId,
  completed,
}: MarkCompleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(completed)

  const handleToggle = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: isCompleted ? "DELETE" : "POST",
      })

      if (response.ok) {
        setIsCompleted(!isCompleted)
        router.refresh()
      }
    } catch (error) {
      console.error("Error updating progress:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      variant={isCompleted ? "outline" : "default"}
      className={`w-full h-12 sm:h-11 text-base sm:text-sm ${
        isCompleted
          ? "border border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300"
          : "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0"
      }`}
    >
      {isCompleted ? (
        <>
          <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          <span className="hidden sm:inline">Marcar como Não Concluída</span>
          <span className="sm:hidden">Não Concluída</span>
        </>
      ) : (
        <>
          <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          <span className="hidden sm:inline">Marcar como Concluída</span>
          <span className="sm:hidden">Concluída</span>
        </>
      )}
    </Button>
  )
}


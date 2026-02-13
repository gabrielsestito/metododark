"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { notifyError, notifySuccess } from "@/lib/notifications"

interface DeleteCourseButtonProps {
  courseId: string
  courseTitle: string
}

export function DeleteCourseButton({ courseId, courseTitle }: DeleteCourseButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        await notifySuccess("Curso excluído", `O curso "${courseTitle}" foi excluído com sucesso!`)
        router.refresh()
      } else {
        await notifyError("Erro", data.error || "Erro ao excluir curso")
        setShowConfirm(false)
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      await notifyError("Erro", "Erro ao excluir curso")
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <Button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white border-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Excluindo...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Confirmar
            </>
          )}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          variant="outline"
          className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
        >
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleDelete}
      variant="outline"
      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Excluir
    </Button>
  )
}

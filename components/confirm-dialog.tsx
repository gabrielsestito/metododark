"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Trash2, XCircle, Info } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning"
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <Trash2 className="h-5 w-5 text-red-400" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      default:
        return <Info className="h-5 w-5 text-blue-400" />
    }
  }

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-500 hover:bg-red-600 text-white border-0"
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600 text-white border-0"
      default:
        return "bg-gradient-to-r from-[#8b5cf6] to-purple-600 hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0"
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${
              variant === "destructive" 
                ? "bg-red-500/20 border border-red-500/30" 
                : variant === "warning"
                ? "bg-yellow-500/20 border border-yellow-500/30"
                : "bg-blue-500/20 border border-blue-500/30"
            }`}>
              {getIcon()}
            </div>
            <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-white/80">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={getConfirmButtonClass()}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

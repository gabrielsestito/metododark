"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { useConfirmStore } from "@/lib/confirm"

export function ConfirmProvider() {
  const { open, title, description, onConfirm, confirmText, cancelText, variant, hide } = useConfirmStore()

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    hide()
  }

  const handleCancel = () => {
    hide()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel()
        }
      }}
      title={title}
      description={description}
      onConfirm={handleConfirm}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
    />
  )
}

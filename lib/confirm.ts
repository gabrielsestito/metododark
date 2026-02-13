"use client"

import { create } from "zustand"

interface ConfirmState {
  open: boolean
  title: string
  description: string
  onConfirm: (() => void) | null
  confirmText: string
  cancelText: string
  variant: "default" | "destructive" | "warning"
}

interface ConfirmStore extends ConfirmState {
  show: (options: {
    title: string
    description: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive" | "warning"
  }) => void
  hide: () => void
}

const initialState: ConfirmState = {
  open: false,
  title: "",
  description: "",
  onConfirm: null,
  confirmText: "Confirmar",
  cancelText: "Cancelar",
  variant: "default",
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  ...initialState,
  show: (options) => {
    set({
      open: true,
      title: options.title,
      description: options.description,
      onConfirm: options.onConfirm,
      confirmText: options.confirmText || "Confirmar",
      cancelText: options.cancelText || "Cancelar",
      variant: options.variant || "default",
    })
  },
  hide: () => {
    set(initialState)
  },
}))

/**
 * Show a confirmation dialog
 * Returns a promise that resolves to true if confirmed, false if cancelled
 */
export function confirm(options: {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning"
}): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false
    
    const handleConfirm = () => {
      if (!resolved) {
        resolved = true
        resolve(true)
      }
    }
    
    const handleCancel = () => {
      if (!resolved) {
        resolved = true
        resolve(false)
      }
    }
    
    useConfirmStore.getState().show({
      ...options,
      onConfirm: handleConfirm,
    })
    
    // Track when dialog closes to handle cancel
    const unsubscribe = useConfirmStore.subscribe((state) => {
      if (!state.open && !resolved) {
        // Dialog was closed without confirming
        handleCancel()
        unsubscribe()
      }
    })
  })
}

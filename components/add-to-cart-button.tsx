"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart-store"
import { ShoppingCart, Check } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/notifications"

interface Course {
  id: string
  title: string
  slug: string
  thumbnailUrl?: string | null
  price: number
  promoPrice?: number | null
}

interface AddToCartButtonProps {
  course: Course
  className?: string
}

export function AddToCartButton({ course, className }: AddToCartButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addItem, items } = useCartStore()
  const [loading, setLoading] = useState(false)

  const isInCart = items.some((item) => item.id === course.id)

  const handleAddToCart = async () => {
    if (!session) {
      await notifyError("Login necessário", "Faça login para adicionar cursos ao carrinho")
      router.push("/login")
      return
    }

    setLoading(true)

    // Verificar se já tem o curso comprado
    try {
      const response = await fetch(`/api/courses/${course.id}/check-enrollment`)
      const data = await response.json()

      if (data.enrolled) {
        await notifySuccess("Curso já adquirido", "Você já possui acesso a este curso")
        router.push(`/app/curso/${course.slug}`)
        setLoading(false)
        return
      }
    } catch (error) {
      console.error("Error checking enrollment:", error)
    }

    addItem({
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnailUrl: course.thumbnailUrl || undefined,
      price: course.price,
      promoPrice: course.promoPrice || undefined,
    })

    await notifySuccess("Adicionado ao carrinho", `${course.title} foi adicionado ao carrinho`)
    setLoading(false)
    router.push("/carrinho")
  }

  if (isInCart) {
    return (
      <Button
        onClick={() => router.push("/carrinho")}
        className={className || "border-2 border-[#8b5cf6]/50 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 hover:border-[#8b5cf6]"}
        variant="outline"
      >
        <Check className="h-4 w-4 mr-2" />
        No Carrinho
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleAddToCart} 
      className={className || "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 shadow-lg shadow-[#8b5cf6]/20"}
      disabled={loading}
    >
      {loading ? (
        "Adicionando..."
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Adicionar ao Carrinho
        </>
      )}
    </Button>
  )
}

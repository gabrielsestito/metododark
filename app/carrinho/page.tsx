"use client"

import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { Trash2, ShoppingBag, Sparkles, ArrowLeft, X, Plus, Minus, ShoppingCart, ArrowRight, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { notifySuccess, notifyError } from "@/lib/notifications"
import { confirm } from "@/lib/confirm"

export default function CarrinhoPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { items, removeItem, getTotal, clearCart } = useCartStore()
  const [removing, setRemoving] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  
  const total = getTotal()
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const discount = subtotal - total
  const itemCount = items.length

  const handleCheckout = () => {
    if (!session) {
      router.push("/login")
      return
    }
    if (items.length === 0) {
      notifyError("Carrinho vazio", "Adicione cursos ao carrinho antes de finalizar a compra")
      return
    }
    router.push("/checkout")
  }

  const handleRemoveItem = async (id: string) => {
    setRemoving(id)
    setTimeout(() => {
      removeItem(id)
      setRemoving(null)
      notifySuccess("Item removido", "Curso removido do carrinho")
    }, 200)
  }

  const handleClearCart = async () => {
    const confirmed = await confirm({
      title: "Limpar Carrinho",
      description: "Tem certeza que deseja limpar todo o carrinho? Todos os itens serão removidos.",
      confirmText: "Limpar",
      cancelText: "Cancelar",
      variant: "destructive",
    })
    
    if (!confirmed) {
      return
    }
    
    setClearing(true)
    setTimeout(() => {
      clearCart()
      setClearing(false)
      notifySuccess("Carrinho limpo", "Todos os itens foram removidos")
    }, 200)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-20">
            <div className="inline-block p-6 rounded-full bg-gradient-to-br from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-6">
              <ShoppingBag className="h-24 w-24 text-[#8b5cf6]" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Seu carrinho está vazio
            </h1>
            <p className="text-white/60 mb-8 text-lg max-w-md mx-auto">
              Adicione cursos ao carrinho para continuar sua jornada de aprendizado
            </p>
            <Link href="/cursos">
              <Button className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 px-8 shadow-lg shadow-[#8b5cf6]/20 transform hover:scale-105 transition-all duration-300">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Explorar Cursos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link href="/cursos">
              <Button 
                variant="ghost" 
                className="mb-4 text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continuar Comprando
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-purple-600/20 border border-[#8b5cf6]/30 mb-4">
              <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
              <span className="text-xs font-medium text-white/80">Carrinho</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Carrinho de Compras
            </h1>
            <p className="text-white/60 text-base sm:text-lg">
              {itemCount} {itemCount === 1 ? "curso" : "cursos"} no carrinho
            </p>
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearCart}
              disabled={clearing}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Carrinho
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`group bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all transform hover:scale-[1.01] ${
                  removing === item.id ? "opacity-50" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Thumbnail */}
                  {item.thumbnailUrl ? (
                    <Link href={`/curso/${item.slug}`} className="flex-shrink-0">
                      <div className="relative h-32 sm:h-40 w-full sm:w-48 rounded-lg overflow-hidden border border-white/10 group-hover:border-[#8b5cf6]/50 transition-colors">
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    </Link>
                  ) : (
                    <div className="relative h-32 sm:h-40 w-full sm:w-48 rounded-lg overflow-hidden border border-white/10 bg-gradient-to-br from-[#8b5cf6]/20 to-purple-600/20 flex items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-[#8b5cf6]/50" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/curso/${item.slug}`}>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 text-white group-hover:text-[#8b5cf6] transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                      </Link>
                      
                      {/* Price */}
                      <div className="mb-4">
                        {item.promoPrice ? (
                          <div className="flex items-baseline gap-3">
                            <div>
                              <span className="text-sm text-white/60 line-through mr-2">
                                R$ {item.price.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#8b5cf6] to-purple-600 bg-clip-text text-transparent">
                                R$ {item.promoPrice.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <span className="px-2 py-1 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-semibold flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Economia
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl sm:text-3xl font-black text-white">
                            R$ {item.price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={removing === item.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {removing === item.id ? "Removendo..." : "Remover"}
                      </Button>
                      <Link href={`/curso/${item.slug}`} className="ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
                        >
                          Ver Detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Card */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#8b5cf6]" />
                  Resumo do Pedido
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-white/60 text-sm">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? "curso" : "cursos"})</span>
                    <span className="text-white font-medium">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400 text-sm">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Desconto
                      </span>
                      <span className="font-semibold">- R$ {discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-white">Total</span>
                      <span className="text-3xl font-black bg-gradient-to-r from-[#8b5cf6] to-purple-600 bg-clip-text text-transparent">
                        R$ {total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white border-0 h-12 text-base font-semibold shadow-lg shadow-[#8b5cf6]/20 transform hover:scale-105 transition-all duration-300"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Finalizar Compra
                </Button>
                
                <Link href="/cursos">
                  <Button 
                    variant="outline" 
                    className="w-full border-white/10 text-white/80 hover:bg-white/5 hover:text-white h-11"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continuar Comprando
                  </Button>
                </Link>
              </div>

              {/* Security Badge */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Compra 100% segura e protegida</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

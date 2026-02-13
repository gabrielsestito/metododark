import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  id: string
  title: string
  slug: string
  thumbnailUrl?: string
  price: number
  promoPrice?: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items
        if (items.find((i) => i.id === item.id)) {
          return // Já está no carrinho
        }
        set({ items: [...items, item] })
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },
      clearCart: () => {
        set({ items: [] })
      },
      getTotal: () => {
        return get().items.reduce((total, item) => {
          return total + (item.promoPrice || item.price)
        }, 0)
      },
      getItemCount: () => {
        return get().items.length
      },
    }),
    {
      name: "metodo-dark-cart",
    }
  )
)


"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, User, LogOut, Menu, X, ChevronDown } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ChatNotificationBell } from "@/components/chat/chat-notification-bell"
import Image from "next/image"
import { useState, useEffect } from "react"
import { isAdminRole } from "@/lib/permissions"

export function Navbar() {
  const { data: session } = useSession()
  const itemCount = useCartStore((state) => state.getItemCount())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-white flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Método Dark"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <span className="hidden sm:inline font-black tracking-tight">MÉTODO DARK</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/cursos">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5 h-9 px-4">
                Cursos
              </Button>
            </Link>

            {session && (
              <>
                <Link href="/app">
                  <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5 h-9 px-4">
                    Meus Cursos
                  </Button>
                </Link>
                <Link href="/subscription">
                  <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5 h-9 px-4">
                    Assinatura
                  </Button>
                </Link>
                <Link href="/app/perfil">
                  <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5 h-9 px-4">
                    Perfil
                  </Button>
                </Link>
              </>
            )}

            <Link href="/carrinho" className="relative">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/5 h-9 w-9">
                <ShoppingCart className="h-5 w-5" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#8b5cf6] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {session && <NotificationBell />}
            {session && <ChatNotificationBell />}

            {session ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
                {isAdminRole(session.user.role) && (
                  <Link href="/admin">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-white/10 text-white/80 hover:bg-white/5 h-9"
                    >
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-white/80 hover:text-white hover:bg-white/5 h-9"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
                <Link href="/login">
                  <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5 h-9">
                    ENTRAR
                  </Button>
                </Link>
                <Link href="/registro">
                  <Button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0 h-9 px-6 font-semibold">
                    CADASTRAR
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white/80 hover:text-white hover:bg-white/5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 py-5">
            <div className="space-y-3 rounded-xl border border-white/10 bg-[#0b0b0b] p-4">
              <p className="text-xs uppercase tracking-widest text-white/40 px-1">Navegação</p>
              <div className="space-y-2">
            <Link href="/cursos" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-white/90 hover:text-white hover:bg-white/5 h-11">
                  Cursos
                </Button>
            </Link>
            {session && (
              <>
                <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-white/90 hover:text-white hover:bg-white/5 h-11">
                      Meus Cursos
                    </Button>
                </Link>
                <Link href="/subscription" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-white/90 hover:text-white hover:bg-white/5 h-11">
                      Assinatura
                    </Button>
                </Link>
                <Link href="/app/perfil" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-white/90 hover:text-white hover:bg-white/5 h-11">
                      Perfil
                    </Button>
                </Link>
              </>
            )}
            <Link href="/carrinho" onClick={() => setMobileMenuOpen(false)} className="relative block">
                <Button variant="ghost" className="w-full justify-start text-white/90 hover:text-white hover:bg-white/5 h-11">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Carrinho
                  {mounted && itemCount > 0 && (
                    <span className="ml-2 bg-[#8b5cf6] text-white text-xs rounded-full px-2 py-0.5 font-bold">
                      {itemCount}
                    </span>
                  )}
                </Button>
            </Link>
              </div>
            {session && (
              <div className="px-1">
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/90">
                  <NotificationBell />
                  <span className="text-sm font-medium">Notificação</span>
                </div>
              </div>
            )}
            {session ? (
              <div className="space-y-2 border-t border-white/10 pt-4">
                {isAdminRole(session.user.role) && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-white/10 text-white/90 hover:bg-white/5 h-11">
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  className="w-full text-white/90 hover:text-white hover:bg-white/5 h-11"
                  onClick={() => {
                    signOut({ callbackUrl: "/" })
                    setMobileMenuOpen(false)
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <div className="space-y-2 border-t border-white/10 pt-4">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full text-white/90 hover:text-white hover:bg-white/5 h-11">
                    ENTRAR
                  </Button>
                </Link>
                <Link href="/registro" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0 h-11">
                    CADASTRAR
                  </Button>
                </Link>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

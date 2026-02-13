"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao criar conta")
        setLoading(false)
      } else {
        // Fazer login automático após registro
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError("Conta criada, mas erro ao fazer login. Por favor, faça login manualmente.")
          setLoading(false)
        } else {
          // Redirecionar para a homepage
          router.push("/")
          router.refresh()
        }
      }
    } catch (err) {
      setError("Erro ao criar conta")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(124,58,237,0.1),transparent_50%)]" />
      </div>

      <Card className="w-full max-w-md bg-[#0f0f0f] border border-white/5 backdrop-blur-sm shadow-2xl relative z-10 animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 mx-auto animate-pulse-once">
            <div className="relative w-full h-full">
              <Image
                src="/logo.png"
                alt="Método Dark"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-gradient">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-white/60">
            Cadastre-se para começar a aprender
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg animate-fade-in">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/80">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0 transform hover:scale-105 transition-all duration-300" 
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
            <p className="text-sm text-center text-white/60">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-[#8b5cf6] hover:text-[#7c3aed] font-semibold hover:underline transition-colors">
                Faça login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

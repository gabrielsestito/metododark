import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ChatButton } from "@/components/chat/chat-button"
import { ConsoleSilencer } from "@/components/console-silencer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Método Dark - Plataforma de Cursos",
  description: "Aprenda programação, modelagem 3D, edição de vídeo e muito mais com os melhores cursos online",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <ConsoleSilencer />
          <Navbar />
          {children}
          <Footer />
          <ChatButton />
        </Providers>
      </body>
    </html>
  )
}

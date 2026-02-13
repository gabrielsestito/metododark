import Link from "next/link"
import { Instagram, Youtube, Music } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-[#0f0f0f] border-t border-white/5 mt-20">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Método Dark"
                  fill
                  className="object-contain group-hover:opacity-80 transition-opacity"
                  priority
                  unoptimized
                />
              </div>
              <h3 className="text-xl font-bold text-gradient">MÉTODO DARK</h3>
            </Link>
            <p className="text-white/60 text-sm">
              Transforme sua paixão por programação, modelagem 3D e edição de vídeo em carreira de sucesso. 
              Aprenda com os melhores e conquiste seu lugar no mercado.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/cursos" className="text-white/60 hover:text-white transition-colors text-sm">
                  Cursos
                </Link>
              </li>
              <li>
                <Link href="/app" className="text-white/60 hover:text-white transition-colors text-sm">
                  Meus Cursos
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-white/60 hover:text-white transition-colors text-sm">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Redes Sociais</h4>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/_metododark/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://www.youtube.com/@eudrax"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://www.tiktok.com/@medo_em_minutos.ofc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 text-center">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Método Dark. Todos os direitos reservados. - Desenvolvido por Gabriel Sestito
          </p>
        </div>
      </div>
    </footer>
  )
}


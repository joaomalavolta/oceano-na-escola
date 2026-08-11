'use client'

import Link from 'next/link'
import { Waves, LogIn, LayoutDashboard } from 'lucide-react'
import { useSessao } from '@/lib/sessao'

// Só rotas que existem e que abrem para quem está olhando. Expedições é
// área autenticada: para o visitante o link terminava na tela de
// entrada — promessa não cumprida. Logado, ele volta, junto do painel.
const publicos = [
  { href: '/', label: 'Mapa' },
  { href: '/escolas', label: 'Escolas' },
] as const

const autenticados = [
  { href: '/', label: 'Mapa' },
  { href: '/escolas', label: 'Escolas' },
  { href: '/expedicoes', label: 'Expedições' },
  { href: '/painel', label: 'Painel' },
] as const

export function BarraSuperior() {
  const { session } = useSessao()
  const autenticado = session !== null
  const navLinks = autenticado ? autenticados : publicos

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-glass-bg backdrop-blur-xl border-b border-glass-border">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Waves className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold">Oceano na Escola</span>
        </Link>

        {/* Nav — desktop only */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Entrar / Painel */}
        {autenticado ? (
          <Link
            href="/painel"
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Minha escola</span>
          </Link>
        ) : (
          <Link
            href="/entrar"
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition"
          >
            <LogIn className="h-4 w-4" />
            <span>Entrar</span>
          </Link>
        )}
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { Waves, LogIn } from 'lucide-react'

const navLinks = [
  { href: '/mapa', label: 'Mapa' },
  { href: '/escolas', label: 'Escolas' },
  { href: '/expedicoes', label: 'Expedições' },
  { href: '/sobre', label: 'Sobre' },
] as const

export function BarraSuperior() {
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

        {/* Entrar */}
        <Link
          href="/entrar"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition"
        >
          <LogIn className="h-4 w-4" />
          <span>Entrar</span>
        </Link>
      </div>
    </header>
  )
}

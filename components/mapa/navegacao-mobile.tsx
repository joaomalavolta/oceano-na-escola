"use client";

import { Map, GraduationCap, Ship, LogIn } from "lucide-react";
import Link from "next/link";

/**
 * Barra de navegação inferior fixa — visível apenas em mobile.
 * Desktop usa a barra superior.
 *
 * Espelha a barra superior: só rotas que existem. '/sobre' saiu junto,
 * até a página institucional ser escrita.
 */
export function NavegacaoMobile() {
  const itens = [
    { href: "/", icon: Map, label: "Mapa" },
    { href: "/escolas", icon: GraduationCap, label: "Escolas" },
    { href: "/expedicoes", icon: Ship, label: "Expedições" },
    { href: "/entrar", icon: LogIn, label: "Entrar" },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-glass-bg backdrop-blur-xl border-t border-glass-border">
      <div className="flex items-center justify-around h-14">
        {itens.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon size={20} />
            <span className="text-[10px] tracking-wide">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

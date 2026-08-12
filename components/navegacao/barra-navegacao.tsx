"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessao } from "@/lib/sessao";
import { 
  Map, 
  School, 
  Compass, 
  BarChart3, 
  LogIn, 
  LogOut, 
  PlusCircle, 
  Menu,
  X,
  Database,
  BookText,
  Image as ImageIcon
} from "lucide-react";
import { Marca } from "./marca";
import type { LucideIcon } from "lucide-react";

/** Só o link em destaque carrega `destaque`; sem o tipo, a lista do
 *  visitante e a do autenticado inferem shapes diferentes. */
type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  destaque?: boolean;
};

export function BarraNavegacao() {
  const pathname = usePathname();
  const { session, sair } = useSessao();

  // O menu guarda em qual página foi aberto. Ao navegar, o caminho muda
  // e ele fecha sozinho — sem effect, que só criaria um render a mais.
  const [menu, setMenu] = useState<{ aberto: boolean; em: string }>({
    aberto: false,
    em: pathname,
  });
  const menuAberto = menu.aberto && menu.em === pathname;
  const setMenuAberto = (aberto: boolean) => setMenu({ aberto, em: pathname });

  const autenticado = session !== null;

  const handleLogout = async () => {
    await sair();
    window.location.href = "/";
  };

  // O visitante só vê o que abre sem login: mapa e rede de escolas.
  // Expedições e painel apareciam para ele e terminavam na tela de
  // entrada — link que promete e não cumpre é pior que link ausente.
  const navLinksVisitante: NavLink[] = [
    { href: "/", label: "Mapa", icon: Map },
    { href: "/escolas", label: "Escolas", icon: School },
    { href: "/dados", label: "Dados", icon: Database },
  ];

  const navLinksAutenticado: NavLink[] = [
    { href: "/", label: "Mapa", icon: Map },
    { href: "/painel", label: "Painel", icon: BarChart3 },
    { href: "/expedicoes", label: "Expedições", icon: Compass },
    { href: "/historias", label: "Histórias", icon: BookText },
    { href: "/galeria", label: "Galeria", icon: ImageIcon },
    { href: "/escolas", label: "Escolas", icon: School },
    { href: "/campo", label: "Registrar em campo", icon: PlusCircle, destaque: true },
  ];

  const links = autenticado ? navLinksAutenticado : navLinksVisitante;

  /** Ativo por prefixo: /expedicoes/5/revisar acende "Expedições".
   *  A raiz só por igualdade, senão acenderia sempre. O destaque nunca
   *  acende — é ação, não lugar. */
  const estaAtivo = (item: NavLink) => {
    if (item.destaque) return false;
    if (item.href === "/") return pathname === "/";
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-card/90 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Marca />

        {/* Links Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((item) => {
            const Icon = item.icon;
            const ativo = estaAtivo(item);
            if (item.destaque) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent-foreground bg-accent hover:opacity-90 rounded-sm transition-opacity ml-2"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                  ativo
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Login / Logout Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {autenticado ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-sm hover:bg-secondary/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          ) : (
            <Link
              href="/entrar"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 rounded-sm transition-opacity"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </Link>
          )}
        </div>

        {/* Botão Mobile */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          aria-label="Abrir menu"
        >
          {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu Mobile Dropdown */}
      {menuAberto && (
        <div className="md:hidden bg-card border-b border-border px-4 py-3 space-y-2">
          {links.map((item) => {
            const Icon = item.icon;
            const ativo = estaAtivo(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuAberto(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm ${
                  item.destaque
                    ? "bg-accent text-accent-foreground font-semibold"
                    : ativo
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-border">
            {autenticado ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da conta</span>
              </button>
            ) : (
              <Link
                href="/entrar"
                onClick={() => setMenuAberto(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar no sistema</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

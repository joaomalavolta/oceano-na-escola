"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Map, 
  School, 
  Compass, 
  FileEdit, 
  CheckSquare, 
  BarChart3, 
  LogIn, 
  LogOut, 
  PlusCircle, 
  User, 
  Menu, 
  X,
  Waves
} from "lucide-react";
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
  const [autenticado, setAutenticado] = useState<boolean>(false);
  const [menuAberto, setMenuAberto] = useState<boolean>(false);

  useEffect(() => {
    // Checa simulador de sessão no localStorage
    const authSession = localStorage.getItem("oceano_auth");
    setAutenticado(!!authSession);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("oceano_auth");
    setAutenticado(false);
    window.location.href = "/";
  };

  const navLinksVisitante: NavLink[] = [
    { href: "/", label: "Mapa", icon: Map },
    { href: "/escola/em-mapa-verde", label: "Escolas", icon: School },
    { href: "/expedicoes", label: "Expedições", icon: Compass },
    { href: "/painel", label: "Painel", icon: BarChart3 },
  ];

  const navLinksAutenticado: NavLink[] = [
    { href: "/painel", label: "Painel", icon: BarChart3 },
    { href: "/expedicoes", label: "Expedições", icon: Compass },
    { href: "/expedicoes/nova", label: "+ Transcrever", icon: PlusCircle, destaque: true },
    { href: "/escola/em-mapa-verde", label: "Minha Escola", icon: School },
  ];

  const links = autenticado ? navLinksAutenticado : navLinksVisitante;

  return (
    <header className="sticky top-0 z-40 w-full bg-card/90 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo / Marca */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-sm tracking-wide text-foreground">
          <div className="w-7 h-7 rounded-sm bg-primary text-primary-foreground flex items-center justify-center">
            <Waves className="w-4 h-4" />
          </div>
          <span className="font-bold">Oceano na Escola</span>
        </Link>

        {/* Links Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((item) => {
            const Icon = item.icon;
            const ativo = pathname === item.href;
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
            const ativo = pathname === item.href;
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

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
    /* A faixa é a assinatura da Ecosurf: azul institucional cheio, com
       o azul vivo da marca como fio embaixo. Antes era uma superfície
       do tema — quase branca — e a barra não dizia de quem é a
       plataforma. De quebra, a logo vem em branco vazado sobre ela, que
       é como a arte foi desenhada. */
    <header className="sticky top-0 z-40 w-full bg-marca border-b-2 border-marca-forte shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Marca sobreEscuro />

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
                  /* O coral do acento continua sendo a cor de ação, e
                     sobre o azul ele fica mais claro do que era sobre o
                     branco — que é o que se quer de um destaque. */
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
                /* Branco translúcido em vez do azul vivo: sobre o azul
                   institucional, texto branco sobre #139DD7 não chega
                   aos 4,5:1 que letra pequena exige. O azul vivo fica
                   no fio da borda, onde não carrega texto. */
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                  ativo
                    ? "bg-white/20 text-white font-semibold"
                    : "text-white/75 hover:text-white hover:bg-white/10"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white border border-white/30 rounded-sm hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          ) : (
            <Link
              href="/entrar"
              /* Invertido: branco cheio com o texto no azul da marca.
                 Sobre a faixa azul é o que mais salta, e sem inventar
                 uma quarta cor. */
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-marca hover:bg-white/90 rounded-sm transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </Link>
          )}
        </div>

        {/* Botão Mobile */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="md:hidden p-2 text-white/80 hover:text-white"
          aria-label="Abrir menu"
        >
          {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu Mobile Dropdown */}
      {menuAberto && (
        /* O menu desce como continuação da faixa, e não como um cartão
           claro colado nela: cortar a cor no meio do gesto de abrir
           faria parecer que são dois elementos diferentes. */
        <div className="md:hidden bg-marca border-b-2 border-marca-forte px-4 py-3 space-y-2">
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
                    ? "bg-white/20 text-white font-semibold"
                    : "text-white/75 hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-white/20">
            {autenticado ? (
              <button
                onClick={handleLogout}
                /* Sobre o azul, o vermelho de "destrutivo" fica escuro
                   demais para ler. O branco translúcido serve, e sair
                   da conta não é uma ação que precise de alarme. */
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da conta</span>
              </button>
            ) : (
              <Link
                href="/entrar"
                onClick={() => setMenuAberto(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold bg-white text-marca rounded-sm"
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

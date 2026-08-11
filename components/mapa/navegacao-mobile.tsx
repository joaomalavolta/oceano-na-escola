"use client";

import { Map, GraduationCap, Ship, LogIn, BarChart3, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useSessao } from "@/lib/sessao";

/**
 * Barra de navegação inferior fixa — visível apenas em mobile.
 * Desktop usa a barra superior.
 *
 * Ciente da sessão: para o visitante o último item é Entrar; para o
 * professor vira o Painel, e o + Registrar do meio leva à nova
 * expedição — o desenho de app de campo do documento de concepção
 * (Mapa | Expedição | + | Escola | Perfil).
 */
export function NavegacaoMobile() {
  const { session } = useSessao();
  const autenticado = session !== null;

  const itens = [
    { href: "/", icon: Map, label: "Mapa" },
    { href: "/escolas", icon: GraduationCap, label: "Escolas" },
    ...(autenticado
      ? ([
          { href: "/expedicoes/nova", icon: PlusCircle, label: "Registrar", destaque: true },
          { href: "/expedicoes", icon: Ship, label: "Expedições" },
          { href: "/painel", icon: BarChart3, label: "Painel" },
        ] as const)
      : ([{ href: "/entrar", icon: LogIn, label: "Entrar" }] as const)),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-glass-bg backdrop-blur-xl border-t border-glass-border">
      <div className="flex items-center justify-around h-14">
        {itens.map((item) => {
          const Icon = item.icon;
          const destaque = "destaque" in item && item.destaque;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                destaque
                  ? "flex flex-col items-center gap-0.5 px-3 py-1 -mt-4"
                  : "flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-primary transition-colors"
              }
            >
              {destaque ? (
                <span className="flex items-center justify-center w-11 h-11 rounded-full bg-accent text-accent-foreground shadow-lg">
                  <Icon size={22} />
                </span>
              ) : (
                <Icon size={20} />
              )}
              <span
                className={`text-[10px] tracking-wide ${destaque ? "text-accent font-semibold" : ""}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

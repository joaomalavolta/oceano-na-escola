"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessao } from "@/lib/sessao";
import { LogIn, LogOut, PlusCircle, Menu, X } from "lucide-react";
import { Marca } from "./marca";
import { itensPara, estaAtivo } from "./itens";

interface Props {
  /**
   * Flutua sobre o conteúdo em vez de empurrá-lo.
   *
   * É o caso do mapa, que ocupa a tela inteira por baixo da barra. Ali
   * também não entra o menu sanfona do celular: aquela página tem barra
   * inferior própria, e dois menus para a mesma coisa na mesma tela é
   * uma escolha a mais sem nada em troca.
   */
  flutuante?: boolean;
}

/**
 * A barra de navegação, uma só para o site inteiro.
 *
 * Antes o mapa tinha a sua e as demais páginas tinham outra, com itens e
 * ordem diferentes: clicar num link remontava o menu. Agora as duas são
 * esta, e a lista vem de `itens.ts`.
 *
 * O bloco de navegação é ancorado à esquerda, colado na marca, e não
 * centralizado. Centralizado, cada item que aparecia quando a sessão
 * carregava empurrava os vizinhos para os lados — o menu se
 * reorganizava sozinho na frente de quem estava lendo. Ancorado, item
 * novo só ocupa o vazio à direita.
 */
export function BarraNavegacao({ flutuante = false }: Props) {
  const caminho = usePathname();
  const { session, sair } = useSessao();

  // O menu guarda em qual página foi aberto. Ao navegar, o caminho muda
  // e ele fecha sozinho — sem effect, que só criaria um render a mais.
  const [menu, setMenu] = useState<{ aberto: boolean; em: string }>({
    aberto: false,
    em: caminho,
  });
  const menuAberto = menu.aberto && menu.em === caminho;
  const setMenuAberto = (aberto: boolean) => setMenu({ aberto, em: caminho });

  const autenticado = session !== null;
  const itens = itensPara(autenticado);

  const handleLogout = async () => {
    await sair();
    window.location.href = "/";
  };

  return (
    <header
      className={`${
        flutuante ? "fixed" : "sticky"
      } top-0 inset-x-0 z-40 w-full bg-marca border-b-2 border-marca-forte shadow-sm`}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Marca sobreEscuro />

        <nav className="hidden md:flex items-center gap-1">
          {itens.map(({ href, label, icon: Icon }) => {
            const ativo = estaAtivo(href, caminho);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                  ativo
                    ? "bg-white/20 text-white font-semibold"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Ações, encostadas à direita. Ficam fora da navegação de
            propósito: "Registrar em campo" é ação, não lugar, e no meio
            dos links ela acendia como se fosse uma seção. */}
        <div className="ml-auto hidden md:flex items-center gap-2">
          {autenticado ? (
            <>
              <Link
                href="/campo"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent-foreground bg-accent hover:opacity-90 rounded-sm transition-opacity"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Registrar em campo</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white border border-white/30 rounded-sm hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </>
          ) : (
            <Link
              href="/entrar"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-marca hover:bg-white/90 rounded-sm transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </Link>
          )}
        </div>

        {!flutuante && (
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="ml-auto md:hidden p-2 text-white/80 hover:text-white"
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
          >
            {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </div>

      {menuAberto && !flutuante && (
        /* O menu desce como continuação da faixa, e não como um cartão
           claro colado nela: cortar a cor no meio do gesto de abrir
           faria parecer que são dois elementos diferentes. */
        <div className="md:hidden bg-marca border-b-2 border-marca-forte px-4 py-3 space-y-2">
          {itens.map(({ href, label, icon: Icon }) => {
            const ativo = estaAtivo(href, caminho);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuAberto(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm ${
                  ativo
                    ? "bg-white/20 text-white font-semibold"
                    : "text-white/75 hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-white/20 space-y-2">
            {autenticado ? (
              <>
                <Link
                  href="/campo"
                  onClick={() => setMenuAberto(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-accent text-accent-foreground rounded-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Registrar em campo</span>
                </Link>
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
              </>
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

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
      /* O degradê curto até --marca-viva tira o chapado de uma faixa
         larga sem trocar a cor da marca. */
      className={`${
        flutuante ? "fixed" : "sticky"
      } top-0 inset-x-0 z-40 w-full border-b-2 border-marca-forte shadow-sm
         bg-[linear-gradient(100deg,var(--marca)_0%,var(--marca)_45%,var(--marca-viva)_100%)]`}
    >
      {/* 1600 e não 1280: com o menu completo do professor — oito itens
          mais duas ações — a barra de 1280 não tinha onde caber, e
          comprimia até o nome da plataforma truncar e "Registrar em
          campo" quebrar em duas linhas. Numa tela de 1920 sobravam 640
          px sem uso ao lado. */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 flex items-center gap-3 lg:gap-5">
        <Marca sobreEscuro />

        {/* Só a partir de lg. Com os oito itens do professor, abaixo de
            1024 px não cabe nem sem ícone — e item escondido atrás de
            rolagem invisível é pior que item na sanfona, que ao menos
            se anuncia. A rolagem fica como válvula, para um item novo
            no futuro apertar em vez de quebrar. */}
        <nav className="hidden lg:flex items-center gap-0.5 2xl:gap-1 min-w-0 overflow-x-auto rolagem-invisivel">
          {itens.map(({ href, label, icon: Icon }) => {
            const ativo = estaAtivo(href, caminho);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                /* O item ativo ganha um traço no azul vivo da marca,
                   embaixo, onde ele não carrega texto: branco sobre
                   #139DD7 não chega aos 4,5:1 que letra pequena exige,
                   mas um traço não precisa de contraste de texto.

                   O inativo está em 88% e não em 80%: com o degradê, o
                   item mais à direita cai sobre a ponta clara da faixa,
                   e a 80% ele media 4,39 — abaixo do mínimo. Medido.

                   E o preenchimento do ativo é discreto pela mesma
                   razão: ele clareia o fundo embaixo do próprio texto,
                   e quem marca a seleção é o traço, não a mancha. */
                className={`relative flex items-center gap-1.5 px-2 2xl:px-3 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap shrink-0 transition-colors ${
                  ativo
                    ? "bg-white/10 text-white font-semibold"
                    : "text-white/[0.88] hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 hidden 2xl:block" />
                <span>{label}</span>
                {ativo && (
                  <span
                    className="absolute inset-x-2 -bottom-[7px] h-[3px] rounded-full bg-marca-forte"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Ações, encostadas à direita. Ficam fora da navegação de
            propósito: "Registrar em campo" é ação, não lugar, e no meio
            dos links ela acendia como se fosse uma seção. */}
        <div className="ml-auto hidden lg:flex items-center gap-2 shrink-0 pl-2 2xl:pl-4 2xl:border-l 2xl:border-white/20">
          {autenticado ? (
            <>
              <Link
                href="/campo"
                title="Registrar ocorrência em campo"
                /* "em campo" só entra quando há espaço: sem isso o
                   rótulo quebrava em duas linhas e deformava a barra.
                   Cresce em 2xl e não em xl: a 1280 exatamente, o
                   alargamento chegava antes do espaço para ele. */
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-accent-foreground bg-accent hover:brightness-110 rounded-sm transition-all shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Registrar<span className="hidden 2xl:inline"> em campo</span>
                </span>
              </Link>
              <button
                onClick={handleLogout}
                /* Branco cheio, e preenchimento leve em vez de contorno
                   fraco. O contorno a 30% dava 1,8:1 contra a faixa —
                   invisível — e o texto a 80% dava 4,39, abaixo do
                   mínimo. Contraintuitivo: engrossar o preenchimento
                   piora, porque ele clareia o fundo sob a própria letra;
                   a 18% já cai para 4,17. A 12% fica em 4,73. */
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white bg-white/12 hover:bg-white/20 border border-white/25 rounded-sm transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Sair</span>
              </button>
            </>
          ) : (
            <Link
              href="/entrar"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap bg-white text-marca hover:bg-white/90 rounded-sm transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </Link>
          )}
        </div>

        {!flutuante && (
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="ml-auto lg:hidden p-2 text-white/80 hover:text-white"
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
        <div className="lg:hidden bg-marca border-b-2 border-marca-forte px-4 py-3 space-y-2">
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

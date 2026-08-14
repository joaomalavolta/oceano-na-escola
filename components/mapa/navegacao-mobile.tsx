"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, PlusCircle } from "lucide-react";
import { useSessao } from "@/lib/sessao";
import { itensDoPolegar, estaAtivo } from "@/components/navegacao/itens";

/**
 * Barra inferior fixa do mapa — só no celular.
 *
 * O polegar alcança o rodapé, não o topo: é o desenho de app de campo
 * que o documento de concepção pede. Por isso a página do mapa não tem
 * menu sanfona no alto, e esta barra é a navegação dela.
 *
 * Cabem quatro, e quais são os quatro está em `itens.ts`. A ordem vem
 * sempre da mesma lista das outras barras, então item nenhum aparece
 * aqui em posição diferente da que ocupa no menu do desktop — era isso
 * que fazia o menu parecer outro a cada tela.
 */
export function NavegacaoMobile() {
  const caminho = usePathname();
  const { session } = useSessao();
  const autenticado = session !== null;

  const itens = itensDoPolegar(autenticado);

  return (
    /* Some só a partir de lg, e não de md, porque é em lg que a barra
       de cima passa a mostrar a navegação. Com o corte em md havia uma
       faixa — 768 a 1023, que é tablet — em que esta barra já tinha
       sumido e a de cima ainda não tinha aparecido: no mapa, que não
       tem sanfona, a navegação desaparecia por inteiro. */
    <nav className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-marca border-t-2 border-marca-forte">
      <div className="flex items-stretch justify-around h-14">
        {itens.map(({ href, label, icon: Icon }) => {
          const ativo = estaAtivo(href, caminho);
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors ${
                ativo ? "text-white" : "text-white/70"
              }`}
            >
              <Icon size={20} />
              <span className={`text-[10px] tracking-wide ${ativo ? "font-semibold" : ""}`}>
                {label}
              </span>
              {/* O ativo se marca por um traço no topo, do lado da barra
                  que encosta no conteúdo — o mesmo papel do fundo claro
                  no menu do desktop. */}
              <span
                className={`absolute top-0 h-0.5 w-10 rounded-full ${
                  ativo ? "bg-white" : "bg-transparent"
                }`}
                aria-hidden="true"
              />
            </Link>
          );
        })}

        {/* A ação fica na ponta, fora da fila dos lugares. Para quem não
            entrou, o mesmo espaço leva ao login: é o passo que destrava
            todo o resto. */}
        <Link
          href={autenticado ? "/campo" : "/entrar"}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 text-accent"
        >
          <span className="flex items-center justify-center w-9 h-9 -mt-3 rounded-full bg-accent text-accent-foreground shadow-lg">
            {autenticado ? <PlusCircle size={20} /> : <LogIn size={18} />}
          </span>
          <span className="text-[10px] tracking-wide font-semibold text-white">
            {autenticado ? "Registrar" : "Entrar"}
          </span>
        </Link>
      </div>
    </nav>
  );
}

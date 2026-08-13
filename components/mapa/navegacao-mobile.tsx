"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, PlusCircle } from "lucide-react";
import { useSessao } from "@/lib/sessao";
import { itensPara, estaAtivo } from "@/components/navegacao/itens";

/**
 * Barra inferior fixa do mapa — só no celular.
 *
 * O polegar alcança o rodapé, não o topo: é o desenho de app de campo
 * que o documento de concepção pede. Por isso a página do mapa não tem
 * menu sanfona no alto, e esta barra é a navegação dela.
 *
 * Cabem poucos itens, então ela mostra os primeiros da mesma lista das
 * outras barras — os quatro primeiros, na mesma ordem. Não é uma
 * seleção própria: item nenhum aparece aqui em posição diferente da que
 * ocupa no menu do desktop, que era o que fazia o menu parecer outro a
 * cada tela.
 */
const CABEM = 4;

export function NavegacaoMobile() {
  const caminho = usePathname();
  const { session } = useSessao();
  const autenticado = session !== null;

  const itens = itensPara(autenticado).slice(0, CABEM);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-marca border-t-2 border-marca-forte">
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

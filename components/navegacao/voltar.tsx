import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * O caminho de volta, no alto da página.
 *
 * Antes cada subpágina resolvia isso por conta: algumas tinham link no
 * rodapé, outras não tinham nada, e nenhuma tinha no alto — que é onde
 * se procura. Quem entrava no manual do aluno pelo painel só voltava
 * pelo botão do navegador, e no celular em modo aplicativo esse botão
 * não existe.
 *
 * O destino é fixo e nomeado, e não `history.back()`. Voltar pelo
 * histórico leva a lugares diferentes conforme de onde a pessoa veio, e
 * um botão que diz "Voltar ao painel" e às vezes vai para outro lugar é
 * pior que nenhum. Aqui ele sempre vai ao painel, e diz isso.
 *
 * Páginas que estão no menu de cima não recebem este botão: elas são
 * destino, e não subpágina. Voltar de "Expedições" para o painel é
 * trabalho do menu, que está sempre ali.
 */

export const DESTINOS = {
  painel: { href: "/painel", texto: "Voltar ao painel" },
  expedicoes: { href: "/expedicoes", texto: "Voltar para as expedições" },
  manuais: { href: "/manuais", texto: "Voltar para os manuais" },
  escolas: { href: "/escolas", texto: "Voltar para as escolas" },
  historias: { href: "/historias", texto: "Voltar para as histórias" },
  mapa: { href: "/", texto: "Voltar ao mapa" },
} as const;

export type Destino = keyof typeof DESTINOS;

interface Props {
  /** Um dos destinos conhecidos, para o rótulo sair igual em toda parte. */
  para?: Destino;
  /** Destino fora da lista — página de escola, que tem slug no caminho. */
  href?: string;
  texto?: string;
  className?: string;
}

function alvoDe(para?: Destino, href?: string, texto?: string) {
  const conhecido = para ? DESTINOS[para] : null;
  return {
    href: href ?? conhecido?.href ?? "/",
    texto: texto ?? conhecido?.texto ?? "Voltar",
  };
}

export function Voltar({ para, href, texto, className = "" }: Props) {
  const alvo = alvoDe(para, href, texto);

  return (
    <Link
      href={alvo.href}
      /* `print:hidden`: em folha impressa não há para onde voltar, e o
         link viraria uma linha de texto solta no alto da página. */
      className={`print:hidden inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
      {alvo.texto}
    </Link>
  );
}

/**
 * O mesmo caminho de volta, no fim da página.
 *
 * Existe porque as páginas desta plataforma são longas — o roteiro da
 * oficina, o manual do professor, a revisão de uma expedição com trinta
 * itens contados. Quem chega ao fim rolando está a várias telas do
 * botão do topo, e a saída natural é procurar embaixo do que acabou de
 * ler, não subir de volta.
 *
 * Tem contorno e área de toque maior que o do topo, e não é a mesma
 * peça repetida: no alto ele é um caminho que se ignora enquanto se lê;
 * no rodapé é o próximo passo de quem terminou.
 */
export function VoltarRodape({ para, href, texto, className = "" }: Props) {
  const alvo = alvoDe(para, href, texto);

  return (
    <div className={`print:hidden pt-5 mt-2 border-t border-border ${className}`}>
      <Link
        href={alvo.href}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary transition-colors"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        {alvo.texto}
      </Link>
    </div>
  );
}

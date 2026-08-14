"use client";

import { AlertTriangle, Info, Printer, ShieldAlert } from "lucide-react";
import { Voltar } from "@/components/navegacao/voltar";
import type { Bloco, Manual } from "@/lib/manuais";
import { VERSAO_MANUAIS } from "@/lib/manuais";

/**
 * A folha de um manual, na tela e no papel.
 *
 * O manual do aluno existe para ser impresso, dobrado e levado na
 * mochila — praia não tem sinal e ninguém lê manual no celular com a
 * mão cheia de areia. Por isso a folha é a mesma nos dois lugares, e o
 * que só serve na tela sai na impressão: barra de navegação, botão de
 * imprimir, link de voltar.
 */

const AVISO = {
  perigo: {
    Icone: ShieldAlert,
    caixa: "border-destructive/40 bg-destructive/10",
    titulo: "text-destructive",
  },
  atencao: {
    Icone: AlertTriangle,
    caixa: "border-amber-500/40 bg-amber-500/10",
    titulo: "text-amber-800 dark:text-amber-300",
  },
  nota: {
    Icone: Info,
    caixa: "border-primary/30 bg-primary/5",
    titulo: "text-primary",
  },
} as const;

function Conteudo({ bloco }: { bloco: Bloco }) {
  switch (bloco.tipo) {
    case "paragrafo":
      return <p className="text-sm leading-relaxed">{bloco.texto}</p>;

    case "lista":
      return (
        <ul className="space-y-1.5">
          {bloco.itens.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed flex gap-2.5">
              {/* Marcador desenhado, e não `list-disc`: o bullet do
                  navegador some em algumas impressoras e a lista chega
                  ao aluno como um bloco de texto corrido. */}
              <span
                className="mt-[0.45rem] w-1.5 h-1.5 rounded-full bg-primary shrink-0 print:bg-black"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "passos":
      return (
        <ol className="space-y-3">
          {bloco.itens.map((passo, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center print:border print:border-black print:bg-transparent print:text-black">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{passo.titulo}</p>
                <p className="text-sm leading-relaxed text-muted-foreground print:text-black">
                  {passo.texto}
                </p>
              </div>
            </li>
          ))}
        </ol>
      );

    case "aviso": {
      const { Icone, caixa, titulo } = AVISO[bloco.nivel];
      return (
        /* `break-inside-avoid`: um aviso de segurança partido entre duas
           páginas perde metade da frase justamente onde ela importa. */
        <div className={`p-3.5 rounded-sm border ${caixa} break-inside-avoid print:border-black`}>
          <p className={`text-sm font-bold flex items-center gap-2 ${titulo} print:text-black`}>
            <Icone className="w-4 h-4 shrink-0" />
            {bloco.titulo}
          </p>
          <p className="text-sm leading-relaxed mt-1">{bloco.texto}</p>
        </div>
      );
    }

    case "tabela":
      return (
        <div className="overflow-x-auto break-inside-avoid">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border text-left print:border-black">
                {bloco.cabecalho.map((c) => (
                  <th key={c} className="py-2 pr-3 font-semibold align-bottom">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloco.linhas.map((linha, i) => (
                <tr key={i} className="border-b border-border/60 print:border-black/30">
                  {linha.map((celula, j) => (
                    <td
                      key={j}
                      className={`py-2 pr-3 align-top leading-snug ${
                        j === 0 ? "font-medium whitespace-nowrap" : ""
                      }`}
                    >
                      {celula}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function FolhaManual({ manual }: { manual: Manual }) {
  return (
    <>
      <div className="print:hidden bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Voltar para="manuais" />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" />
            Imprimir · {manual.paginas}
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8 print:px-0 print:py-0 text-foreground print:text-black">
        <header className="border-b-2 border-primary pb-4 mb-6 print:border-black">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary print:text-black">
            Oceano na Escola · Instituto Ecosurf
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{manual.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-1 print:text-black">
            {manual.subtitulo}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 print:text-black">
            {manual.publico} · versão {VERSAO_MANUAIS}
          </p>
        </header>

        <div className="space-y-8">
          {manual.secoes.map((secao) => (
            <section key={secao.id} className="space-y-3 break-inside-avoid-page">
              <h2 className="text-base font-bold tracking-tight border-b border-border pb-1.5 print:border-black">
                {secao.titulo}
              </h2>
              {secao.blocos.map((bloco, i) => (
                <Conteudo key={i} bloco={bloco} />
              ))}
            </section>
          ))}
        </div>

        <footer className="mt-10 pt-4 border-t border-border text-[11px] text-muted-foreground print:border-black print:text-black">
          <p>
            Instituto Ecosurf · oceanonaescola@ecosurf.org.br · Este manual descreve a plataforma
            como ela está na versão {VERSAO_MANUAIS}. Em caso de divergência com a tela, vale a
            tela — e avise o Instituto.
          </p>
        </footer>
      </main>
    </>
  );
}

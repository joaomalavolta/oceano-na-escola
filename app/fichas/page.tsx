"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Loader2, Printer, QrCode } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import { FichaEquipe } from "@/components/fichas/ficha-equipe";
import { FichaConsolidacao } from "@/components/fichas/ficha-consolidacao";
import { listarProtocolos, type ProtocoloDisponivel } from "@/lib/cadastro-expedicao";
import { carregarDefinicaoProtocolo, type DefinicaoProtocolo } from "@/lib/transcricao";
import { Voltar } from "@/components/navegacao/voltar";
import {
  comporFicha,
  linhasDeOcorrencia,
  paginasDaFicha,
  serie,
  totalDePaginas,
  PAGINAS_DA_CONSOLIDACAO,
  INSTRUCAO_DO_CODIGO,
} from "@/lib/fichas";

/**
 * As fichas de campo, para imprimir antes da saída.
 *
 * Tudo sai num trabalho de impressão só, na ordem em que se usa: a
 * consolidação do professor primeiro, depois uma folha por equipe. O
 * professor imprime uma vez e leva o maço.
 *
 * A lista de itens vem do banco, e não de um PDF guardado: a ficha
 * impressa e a tela de transcrição precisam ter exatamente as mesmas
 * linhas, na mesma ordem. Ficha desatualizada é dado que não entra.
 */
function FichasConteudo() {
  const [protocolos, setProtocolos] = useState<ProtocoloDisponivel[] | null>(null);
  const [versaoId, setVersaoId] = useState<number | null>(null);
  const [definicao, setDefinicao] = useState<DefinicaoProtocolo | null>(null);
  const [equipes, setEquipes] = useState(4);
  const [ocorrencias, setOcorrencias] = useState(0);

  /* Derivado, e não um estado próprio ligado dentro do efeito: a
     definição carregada já diz qual protocolo ela é, e comparar com o
     escolhido responde "está trocando?" sem um segundo render. */
  const carregando = versaoId !== null && definicao?.versao_id !== versaoId;

  useEffect(() => {
    let ativo = true;
    listarProtocolos().then((ps) => {
      if (!ativo) return;
      setProtocolos(ps);
      if (ps.length > 0) setVersaoId(ps[0].versao_id);
    });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (versaoId === null) return;
    let ativo = true;
    carregarDefinicaoProtocolo(versaoId).then((d) => {
      if (ativo) setDefinicao(d);
    });
    return () => {
      ativo = false;
    };
  }, [versaoId]);

  if (protocolos === null) {
    return (
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  // A definição na mão pode ser a do protocolo anterior enquanto a nova
  // chega. Mostrar a ficha errada por um instante é pior que não mostrar:
  // quem estiver conferindo a prévia decide imprimir pelo que vê.
  const pronta = definicao !== null && !carregando ? definicao : null;
  const composicao = pronta ? comporFicha(pronta) : null;
  const linhas = composicao ? linhasDeOcorrencia(composicao, ocorrencias || undefined) : 0;
  // Contado, não estimado: medi gerando o PDF A4 de cada protocolo.
  const paginas = composicao ? totalDePaginas(composicao, equipes) : 0;
  const porEquipe = composicao ? paginasDaFicha(composicao) : 0;

  return (
    <>
      {/* ── Controles, só na tela ─────────────────────── */}
      <main className="print:hidden flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 space-y-5">
        <Voltar para="painel" />
        <header className="border-b border-border pb-4">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Fichas de campo
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Imprima antes da saída. Sai tudo de uma vez: a ficha de consolidação do professor e
            uma ficha por equipe, cada uma começando numa folha nova.
          </p>
        </header>

        <section className="bg-card border border-border rounded-md p-5 shadow-2xs space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Protocolo
              </label>
              <select
                value={versaoId ?? ""}
                onChange={(e) => setVersaoId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
              >
                {protocolos.map((p) => (
                  <option key={p.versao_id} value={p.versao_id}>
                    {p.codigo} — {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Quantas equipes
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={equipes}
                onChange={(e) =>
                  setEquipes(Math.min(20, Math.max(1, Number(e.target.value) || 1)))
                }
                className="w-full px-3 py-2 text-sm tabular-nums bg-background border border-input rounded-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Uma ficha por equipe, com o número já impresso.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Linhas de ocorrência
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={ocorrencias}
                onChange={(e) =>
                  setOcorrencias(Math.min(30, Math.max(0, Number(e.target.value) || 0)))
                }
                placeholder="automático"
                className="w-full px-3 py-2 text-sm tabular-nums bg-background border border-input rounded-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                0 usa o padrão do protocolo — hoje, {linhas} linhas.
              </p>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => window.print()}
                disabled={!pronta}
                className="w-full py-2 px-4 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {carregando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                Imprimir {paginas} páginas
              </button>
            </div>
          </div>

          {/* A explicação do código fica aqui, e não só na ficha: é a
              parte do fluxo que o professor precisa entender antes de
              distribuir o papel para a turma. */}
          <div className="p-3 rounded-sm border border-primary/30 bg-primary/5 text-xs leading-relaxed space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5 text-primary">
              <QrCode className="w-3.5 h-3.5" />
              Como a foto vira pino no mapa
            </p>
            <p>{INSTRUCAO_DO_CODIGO}</p>
            <p className="text-muted-foreground">
              O código já vem impresso em cada linha — <span className="font-mono">E2-03</span> é a
              terceira ocorrência da equipe 2. Nada liga a foto ao papel sozinho: o que faz a
              ligação existir é alguém escrever o mesmo código nos dois lugares.
            </p>
          </div>
        </section>

        {pronta && (
          <p className="text-[11px] text-muted-foreground">
            {/* O número vem medido, gerando o PDF A4 de cada protocolo.
                Ficha de campo frente e verso é o formato normal — o que
                não pode é a tela prometer menos papel do que a
                impressora vai usar. */}
            São {PAGINAS_DA_CONSOLIDACAO} páginas de consolidação e{" "}
            {porEquipe === 1 ? "1 página" : `${porEquipe} páginas`} por equipe. Imprimindo frente e
            verso, dá {Math.ceil(paginas / 2)} folhas. Prévia abaixo: o que aparece cinza na tela
            sai preto no papel, e os controles não são impressos.
          </p>
        )}

        <Link href="/manuais" className="block text-center text-xs text-primary hover:underline">
          Ver os manuais do professor e do aluno
        </Link>
      </main>

      {/* ── As folhas ─────────────────────────────────── */}
      {pronta && (
        <div className="max-w-4xl mx-auto w-full px-4 pb-10 print:p-0 print:max-w-none space-y-6 print:space-y-0">
          <div className="ficha-papel">
            <FichaConsolidacao definicao={pronta} equipes={equipes} />
          </div>
          {serie(equipes).map((n) => (
            <div key={n} className="ficha-papel">
              <FichaEquipe
                definicao={pronta}
                equipe={n}
                ocorrencias={ocorrencias || undefined}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function FichasPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col print:bg-white">
      <div className="print:hidden">
        <BarraNavegacao />
      </div>
      <RotaProtegida>
        <FichasConteudo />
      </RotaProtegida>
    </div>
  );
}

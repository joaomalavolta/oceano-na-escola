"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Clock, MapPinned, Printer, Satellite, Users } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { MapaExemplo } from "@/components/cartografia/mapa-exemplo";
import { PranchaEmBranco, FolhaDeSimbolos } from "@/components/cartografia/prancha";
import {
  PranchaTerritorio,
  type TerritorioCapturado,
} from "@/components/cartografia/prancha-territorio";
import { OFICINA, etapasAntesDoCampo, minutosTotais } from "@/lib/cartografia";

/* MapLibre toca em `window` na importação: sem `ssr: false` o build
   quebra na geração estática, como já acontecia no mapa da rede. */
const MapaDoTerritorio = dynamic(
  () => import("@/components/cartografia/mapa-do-territorio").then((m) => m.MapaDoTerritorio),
  { ssr: false, loading: () => <div className="h-[380px] rounded-md bg-muted animate-pulse" /> }
);

const QUEM = {
  professor: "Professor",
  facilitador: "Equipe Ecosurf",
  turma: "A turma, em grupos",
} as const;

/**
 * A oficina de cartografia social, antes da saída de campo.
 *
 * A página serve a três momentos diferentes e por isso tem essa ordem:
 * o professor primeiro quer ver como fica pronto (o exemplo), depois
 * quer saber como conduzir (o roteiro), e só então imprime o material.
 * Explicar o método antes de mostrar o resultado é a ordem que faz
 * todo mundo desistir na terceira linha.
 */
function CartografiaConteudo() {
  const antes = etapasAntesDoCampo();
  const [territorio, setTerritorio] = useState<TerritorioCapturado | null>(null);

  return (
    <>
      <main className="print:hidden flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8">
        <header className="border-b border-border pb-4">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <MapPinned className="w-5 h-5 text-primary" />
            Cartografia social do território
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            A turma desenha o pedaço de costa que vai visitar <strong>antes</strong> de visitá-lo,
            com o que já sabe. Depois a expedição confere. Duas aulas, em sala, conduzidas pelo
            professor com a equipe Ecosurf.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {minutosTotais(antes)} min antes da saída, mais{" "}
              {minutosTotais(OFICINA) - minutosTotais(antes)} min depois
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> grupos de 4 a 5
            </span>
          </div>
        </header>

        {/* ── Por que isso muda o dado ──────────────────── */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Por que fazer isso antes
          </h2>
          <div className="grid gap-3 md:grid-cols-3 text-xs leading-relaxed">
            {[
              [
                "Decide onde amostrar",
                "Um trecho escolhido no satélite é um trecho qualquer. Um trecho escolhido porque a turma sabe que ali sai a drenagem depois da chuva é uma hipótese.",
              ],
              [
                "A criança chega com pergunta",
                "Quem já desenhou o lugar sai a campo para conferir o que desenhou — e não para cumprir tarefa. É a diferença entre contar bituca por três horas e investigar.",
              ],
              [
                "Registra o que não vira número",
                "Memória, uso, medo e afeto não cabem em itens por m². E são metade do que a turma tem a dizer sobre o próprio bairro.",
              ],
            ].map(([titulo, texto]) => (
              <div key={titulo} className="bg-card border border-border rounded-md p-3.5">
                <p className="font-bold text-[13px] mb-1">{titulo}</p>
                <p className="text-muted-foreground">{texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── O exemplo, antes do método ────────────────── */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Como fica quando está pronto
          </h2>
          <MapaExemplo />
        </section>

        {/* ── O roteiro ─────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Roteiro da oficina
          </h2>
          <ol className="space-y-3">
            {OFICINA.map((e, i) => (
              <li key={e.id} className="bg-card border border-border rounded-md p-4 shadow-2xs">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-bold">{e.titulo}</h3>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {e.minutos} min · {QUEM[e.conduz]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{e.objetivo}</p>
                <ul className="space-y-1 mb-2">
                  {e.comoFazer.map((passo, j) => (
                    <li key={j} className="text-xs leading-relaxed flex gap-2">
                      <span className="mt-[0.4rem] w-1 h-1 rounded-full bg-primary shrink-0" />
                      <span>{passo}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] border-l-2 border-primary/40 pl-2.5 text-muted-foreground">
                  <strong className="text-foreground">No fim desta etapa existe:</strong>{" "}
                  {e.produz}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── O território real ─────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Satellite className="w-4 h-4" />
            A imagem do território
          </h2>
          <div className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Enquadre o trecho da saída e gere uma folha com a imagem de satélite dele, já com
              norte, barra de escala, coordenada do centro e o crédito da imagem — as quatro
              coisas que separam um mapa de um print de tela.
            </p>

            {/* O aviso de ordem fica junto do botão, e não só no
                roteiro: quem chega direto nesta seção é justamente quem
                não leu o roteiro. */}
            <p className="text-xs leading-relaxed p-3 rounded-sm border border-amber-500/40 bg-amber-500/10">
              <strong>Quando usar esta folha.</strong> No roteiro ela entra na etapa 3, depois de
              a turma desenhar de memória — e essa ordem é o método: com a imagem na parede antes,
              ninguém mais se lembra do que a imagem não mostra, e a oficina vira aula de leitura
              de foto aérea. Usar a imagem como base desde o começo também funciona e dá um mapa
              mais preciso; o que se perde é justamente o que a turma sabe e o satélite não vê.
            </p>

            <MapaDoTerritorio onCapturar={setTerritorio} capturado={territorio !== null} />

            {territorio && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Prancha do território pronta — ela entra na impressão, junto das outras duas.
              </p>
            )}
          </div>
        </section>

        {/* ── O material ────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Material para imprimir
          </h2>
          <div className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-3">
            <p className="text-xs leading-relaxed">
              {territorio ? "Três folhas" : "Duas folhas"}: a{" "}
              <strong>prancha em branco</strong>, uma por grupo, a{" "}
              <strong>folha de símbolos</strong>, também uma por grupo
              {territorio ? (
                <>
                  , e a <strong>prancha do território</strong>, com a imagem que você acabou de
                  enquadrar
                </>
              ) : null}
              . Em cartolina A3 fica melhor, mas A4 resolve.
            </p>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm inline-flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir as {territorio ? 3 : 2} folhas
            </button>
            <p className="text-[11px] text-muted-foreground">
              Prévia abaixo. Multiplique pelo número de grupos na caixa de impressão do navegador.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap gap-x-5 gap-y-1 justify-center text-xs">
          <Link href="/fichas" className="text-primary hover:underline">
            Fichas de campo da saída
          </Link>
          <Link href="/manuais" className="text-primary hover:underline">
            Manuais do professor e do aluno
          </Link>
          <Link href="/" className="text-primary hover:underline">
            Abrir o mapa da rede
          </Link>
        </div>
      </main>

      {/* ── As folhas ─────────────────────────────────── */}
      <div className="max-w-4xl mx-auto w-full px-4 pb-10 print:p-0 print:max-w-none space-y-6 print:space-y-0">
        <div className="ficha-papel">
          <PranchaEmBranco />
        </div>
        <div className="ficha-papel">
          <FolhaDeSimbolos />
        </div>
        {/* A prancha do território vem por último: ela só existe depois
            de o professor enquadrar o trecho, e na oficina ela entra
            depois das outras duas. */}
        {territorio && (
          <div className="ficha-papel">
            <PranchaTerritorio t={territorio} />
          </div>
        )}
      </div>
    </>
  );
}

export default function CartografiaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col print:bg-white">
      <div className="print:hidden">
        <BarraNavegacao />
      </div>
      <RotaProtegida>
        <CartografiaConteudo />
      </RotaProtegida>
    </div>
  );
}

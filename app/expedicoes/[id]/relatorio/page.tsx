"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Printer, Waves } from "lucide-react";

import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import { carregarRevisao, type Revisao } from "@/lib/revisao";

/**
 * Relatório da expedição, para impressão.
 *
 * Sai da mesma leitura da tela de revisão: um relatório que recalcula
 * por conta própria acabaria discordando dela, e aí nenhum dos dois
 * teria autoridade. Aqui só muda a forma — sem barra de navegação, sem
 * botão, em folha A4.
 */

function formatarData(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

function numero(v: number, casas = 0): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function RelatorioConteudo({ id }: { id: number }) {
  const [revisao, setRevisao] = useState<Revisao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    carregarRevisao(id).then(({ revisao: r, erro: e }) => {
      if (!ativo) return;
      setRevisao(r);
      setErro(e);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  if (carregando) {
    return (
      <main className="max-w-3xl mx-auto p-8">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  if (erro || !revisao) {
    return (
      <main className="max-w-3xl mx-auto p-8">
        <EstadoContainer
          estado="erro"
          mensagemErro={erro ?? "Expedição não encontrada, ou fora do alcance da sua escola."}
        />
      </main>
    );
  }

  const { cabecalho, blocos, ocorrencias, celulas, totalItens } = revisao;

  return (
    <>
      {/* Barra de ação — não vai para o papel */}
      <div className="print:hidden bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Link href={`/expedicoes/${cabecalho.id}/revisar`} className="text-xs text-primary hover:underline">
            Voltar para a revisão
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm hover:opacity-90"
          >
            <Printer className="w-4 h-4" />
            Imprimir ou salvar em PDF
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8 print:px-0 print:py-0 space-y-6 text-foreground">
        {/* Cabeçalho */}
        <header className="border-b-2 border-primary pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Waves className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wide">OCEANO NA ESCOLA</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">
            Relatório da Expedição #{cabecalho.numero}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {cabecalho.titulo ?? "Sem título"}
          </p>

          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-4 text-xs">
            <div>
              <dt className="text-muted-foreground">Escola</dt>
              <dd className="font-semibold">{cabecalho.escola.nome}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data de campo</dt>
              <dd className="font-semibold">{formatarData(cabecalho.data_campo)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Território</dt>
              <dd className="font-semibold">{cabecalho.territorio ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Situação</dt>
              <dd className="font-semibold capitalize">{cabecalho.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Turmas</dt>
              <dd className="font-semibold">
                {cabecalho.turmas.length > 0 ? cabecalho.turmas.join(", ") : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mapeadores</dt>
              <dd className="font-semibold tabular-nums">{cabecalho.n_mapeadores ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Extensão percorrida</dt>
              <dd className="font-semibold tabular-nums">
                {cabecalho.extensao_m === null ? "—" : `${numero(cabecalho.extensao_m)} m`}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Itens contados</dt>
              <dd className="font-semibold tabular-nums">{numero(totalItens)}</dd>
            </div>
          </dl>
        </header>

        {/* Um bloco por protocolo */}
        {blocos.map((bloco) => (
          <section key={bloco.codigo} className="break-inside-avoid space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-border pb-1">
              {bloco.codigo} · {bloco.nome}
            </h2>

            <p className="text-xs text-muted-foreground">
              {bloco.unidades.length} unidade(s) amostral(is) · {numero(bloco.areaM2, 2)} m²
              amostrados · {numero(bloco.totalItens)} itens ·{" "}
              {bloco.densidade === null
                ? "sem densidade (falta esforço amostral)"
                : `${numero(bloco.densidade, 3)} itens/m²`}
            </p>

            {bloco.linhas.length > 0 && (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-1.5 font-semibold">Item</th>
                    <th className="py-1.5 font-semibold">Grupo</th>
                    <th className="py-1.5 font-semibold text-right">Total</th>
                    <th className="py-1.5 font-semibold text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {bloco.linhas.map((l) => (
                    <tr key={l.rotulo} className="border-b border-border/40">
                      <td className="py-1">{l.rotulo}</td>
                      <td className="py-1 text-muted-foreground">{l.grupo}</td>
                      <td className="py-1 text-right tabular-nums font-semibold">
                        {numero(l.quantidade)}
                      </td>
                      <td className="py-1 text-right tabular-nums text-muted-foreground">
                        {bloco.totalItens > 0
                          ? `${((l.quantidade / bloco.totalItens) * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}

        {/* Ocorrências */}
        {ocorrencias.length > 0 && (
          <section className="break-inside-avoid space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-border pb-1">
              Ocorrências georreferenciadas
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-1.5 font-semibold">Protocolo</th>
                  <th className="py-1.5 font-semibold">Ocorrência</th>
                  <th className="py-1.5 font-semibold text-right">Magnitude</th>
                  <th className="py-1.5 font-semibold">Origem provável</th>
                </tr>
              </thead>
              <tbody>
                {ocorrencias.map((o) => (
                  <tr key={o.id} className="border-b border-border/40">
                    <td className="py-1 font-mono">{o.protocolo}</td>
                    <td className="py-1">{o.item ?? o.descricao}</td>
                    <td className="py-1 text-right tabular-nums">
                      {o.valor === null ? "—" : `${numero(o.valor)} ${o.unidade ?? ""}`.trim()}
                    </td>
                    <td className="py-1 text-muted-foreground">{o.origem ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Grade */}
        {celulas.length > 0 && (
          <section className="break-inside-avoid space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-border pb-1">
              Presença no mapa público
            </h2>
            <p className="text-xs text-muted-foreground">
              O mapa público agrega em células de 100 m e só publica a partir de três unidades
              amostrais, o que protege a identificação de quem foi a campo.
            </p>
            <ul className="text-xs space-y-1">
              {celulas.map((c, i) => (
                <li key={i}>
                  <span className="font-mono">{c.protocolo}</span> · {c.unidadesNaCelula} unidade(s)
                  na célula ·{" "}
                  {c.entraNoMapa ? "aparece no mapa" : `faltam ${3 - c.unidadesNaCelula} para aparecer`}
                </li>
              ))}
            </ul>
          </section>
        )}

        {cabecalho.observacoes && (
          <section className="break-inside-avoid space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-border pb-1">
              Observações de campo
            </h2>
            <p className="text-xs whitespace-pre-wrap">{cabecalho.observacoes}</p>
          </section>
        )}

        <footer className="pt-4 border-t border-border text-[10px] text-muted-foreground">
          <p>
            Instituto Ecosurf · Oceano na Escola · gerado em{" "}
            {new Date().toLocaleDateString("pt-BR")}
          </p>
          <p>
            Dado produzido por estudantes em ciência cidadã, revisado pelo professor. Metodologia
            e fichas em docs/02-protocolos.md.
          </p>
        </footer>
      </main>
    </>
  );
}

export default function RelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen bg-background">
      <RotaProtegida>
        <RelatorioConteudo id={Number(id)} />
      </RotaProtegida>
    </div>
  );
}

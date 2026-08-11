"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import {
  BarChart3,
  Download,
  PlusCircle,
  Compass,
  TrendingUp,
  PieChart,
} from "lucide-react";

import { carregarPainel, type PainelEscola } from "@/lib/dados-escola";

const STATUS_ROTULO: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  revisado: "Revisado",
  validado: "Validado",
  publicado: "Publicado",
};

function formatarData(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

function PainelConteudo() {
  const [dados, setDados] = useState<PainelEscola | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarPainel().then((d) => ativo && setDados(d));
    return () => {
      ativo = false;
    };
  }, []);

  const estado = !dados
    ? "carregando"
    : dados.erro
    ? "erro"
    : dados.escolas.length === 0
    ? "vazio"
    : "pronto";

  if (estado !== "pronto" || !dados) {
    return (
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer
          estado={estado}
          mensagemErro={dados?.erro ?? "Não foi possível carregar o painel."}
          mensagemVazia="A sua conta ainda não está vinculada a nenhuma escola. Cadastre a escola para começar."
          onTentarNovamente={() => window.location.reload()}
        />
      </main>
    );
  }

  const escola = dados.escolas[0];
  const { totalItens, areaAmostradaM2, densidades, composicao, topItens, expedicoes } = dados;

  const handleExportarCSV = () => {
    if (expedicoes.length === 0) return;

    const linhas = [
      "Expedicao_ID;Numero;Titulo;Data_Campo;Territorio;Turma;Status;Extensao_m;Total_Itens",
      ...expedicoes.map((e) =>
        [
          e.id,
          e.numero,
          `"${e.titulo ?? ""}"`,
          e.data_campo,
          `"${e.territorio ?? ""}"`,
          `"${e.turma ?? ""}"`,
          e.status,
          e.extensao_m ?? "",
          e.total_itens,
        ].join(";")
      ),
    ];

    const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `oceano-na-escola_${escola.slug}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Painel Analítico da Escola</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {escola.nome}
            {escola.municipio && ` · ${escola.municipio}`}
            {dados.escolas.length > 1 && ` · e mais ${dados.escolas.length - 1} escola(s)`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportarCSV}
            className="px-3 py-2 text-xs font-semibold text-foreground border border-border hover:bg-secondary rounded-sm transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>Exportar CSV</span>
          </button>

          <Link
            href="/expedicoes/nova"
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground hover:opacity-90 rounded-sm transition-opacity flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Transcrever Ficha</span>
          </Link>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-md shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Expedições Registradas
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {expedicoes.length}
          </span>
        </div>

        <div className="bg-card border border-border p-4 rounded-md shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Total de Itens Catalogados
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {totalItens.toLocaleString("pt-BR")}
          </span>
        </div>

        {/* Uma densidade por protocolo. Trecho de 100 m² e quadrat de
            0,25 m² não somam: a média entre eles não descreveria nem um
            nem outro. */}
        <div className="bg-card border border-border p-4 rounded-md shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Densidade por Protocolo
          </span>
          {densidades.length === 0 ? (
            <span className="text-2xl font-bold tabular-nums text-accent">—</span>
          ) : (
            <div className="space-y-0.5">
              {densidades.map((d) => (
                <div key={d.protocolo} className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground w-7">
                    {d.protocolo}
                  </span>
                  <span className="text-lg font-bold tabular-nums text-accent">
                    {d.densidade === null
                      ? "—"
                      : d.densidade.toFixed(3).replace(".", ",")}
                  </span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    itens/m²
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border p-4 rounded-md shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Área Amostrada Total
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {areaAmostradaM2.toLocaleString("pt-BR")}{" "}
            <span className="text-xs font-normal text-muted-foreground">m²</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Composição por material */}
        <div className="bg-card border border-border rounded-md p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span>Composição por Material</span>
            </h2>
          </div>

          {Object.keys(composicao).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhuma contagem por item de lista ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(composicao)
                .sort(([, a], [, b]) => b - a)
                .map(([material, qte]) => {
                  const percent = totalItens > 0 ? (qte / totalItens) * 100 : 0;
                  return (
                    <div key={material} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{material}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {qte.toLocaleString("pt-BR")} itens ({percent.toFixed(1).replace(".", ",")}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Top 5 */}
        <div className="bg-card border border-border rounded-md p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Top 5 Resíduos Mais Comuns</span>
            </h2>
          </div>

          {topItens.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum item contado ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {topItens.map((item, idx) => (
                <div
                  key={item.codigo}
                  className="flex items-center justify-between p-2.5 bg-secondary/50 border border-border rounded-sm text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-foreground">{item.nome}</span>
                  </div>
                  <span className="font-bold tabular-nums text-accent bg-accent/10 px-2 py-0.5 rounded-sm">
                    {item.quantidade.toLocaleString("pt-BR")} un.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimas expedições */}
      <div className="bg-card border border-border rounded-md p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span>Últimas Expedições Registradas</span>
          </h2>
          <Link href="/expedicoes" className="text-xs font-semibold text-primary hover:underline">
            Ver Todas
          </Link>
        </div>

        {expedicoes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma expedição registrada. Comece transcrevendo uma ficha de campo.
          </p>
        ) : (
          <div className="space-y-2">
            {expedicoes.slice(0, 4).map((exp) => (
              <div
                key={exp.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-background border border-border rounded-sm gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground font-bold">
                      #{exp.numero}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {exp.titulo ?? "Sem título"}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-secondary text-muted-foreground">
                      {STATUS_ROTULO[exp.status] ?? exp.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    {exp.territorio && (
                      <>
                        <span>{exp.territorio}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{formatarData(exp.data_campo)}</span>
                    {exp.turma && (
                      <>
                        <span>•</span>
                        <span>{exp.turma}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="tabular-nums">
                      {exp.total_itens.toLocaleString("pt-BR")} itens
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/expedicoes/${exp.id}/transcrever`}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-secondary hover:bg-secondary/80 border border-border rounded-sm"
                  >
                    Abrir Ficha
                  </Link>
                  <Link
                    href={`/expedicoes/${exp.id}/revisar`}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-primary text-primary-foreground rounded-sm"
                  >
                    Revisar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function PainelEscolaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <BarraNavegacao />
      <RotaProtegida>
        <PainelConteudo />
      </RotaProtegida>
    </div>
  );
}

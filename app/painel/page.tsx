"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { 
  BarChart3, 
  Download, 
  PlusCircle, 
  Compass, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  Users, 
  MapPin, 
  FileEdit, 
  ChevronRight,
  PieChart
} from "lucide-react";
import { 
  getLocalStorageData, 
  MOCK_ESCOLAS, 
  MOCK_EXPEDICOES, 
  PROTOCOLO_RES_ITENS, 
  ExpedicaoDetalhada, 
  EscolaDetalhada 
} from "@/lib/dados-mock";

export default function PainelEscolaPage() {
  const [escola, setEscola] = useState<EscolaDetalhada | null>(null);
  const [expedicoes, setExpedicoes] = useState<ExpedicaoDetalhada[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const escolas = getLocalStorageData<EscolaDetalhada[]>("escolas", MOCK_ESCOLAS);
    if (escolas.length > 0) {
      setEscola(escolas[0]);
    }

    const exps = getLocalStorageData<ExpedicaoDetalhada[]>("expedicoes", MOCK_EXPEDICOES);
    setExpedicoes(exps);
    setCarregando(false);
  }, []);

  // Cálculos estatísticos para o painel
  const calcularTotalItens = () => {
    return expedicoes.reduce((total, exp) => {
      let somaExp = 0;
      Object.values(exp.contagens || {}).forEach((eqCounts) => {
        Object.values(eqCounts || {}).forEach((qte) => {
          somaExp += qte;
        });
      });
      return total + somaExp;
    }, 0);
  };

  const calcularAreaTotal = () => {
    return expedicoes.reduce((total, exp) => {
      return total + exp.equipes.reduce((s, eq) => s + eq.area_m2, 0);
    }, 0);
  };

  const calcularDensidadeMedia = () => {
    const area = calcularAreaTotal();
    if (area === 0) return "0.000";
    return (calcularTotalItens() / area).toFixed(3);
  };

  // Agrupamento por Material para Gráfico / Composição
  const calcularComposicaoMateriais = () => {
    const composicao: Record<string, number> = {};

    expedicoes.forEach((exp) => {
      Object.values(exp.contagens || {}).forEach((eqCounts) => {
        Object.entries(eqCounts || {}).forEach(([itemId, qte]) => {
          const itemObj = PROTOCOLO_RES_ITENS.find((i) => i.id === Number(itemId));
          const grupo = itemObj?.grupo || "Outros";
          composicao[grupo] = (composicao[grupo] || 0) + qte;
        });
      });
    });

    return composicao;
  };

  // Ranking Top 5 Itens
  const calcularTopItens = () => {
    const contagemItens: Record<number, number> = {};

    expedicoes.forEach((exp) => {
      Object.values(exp.contagens || {}).forEach((eqCounts) => {
        Object.entries(eqCounts || {}).forEach(([itemId, qte]) => {
          const id = Number(itemId);
          contagemItens[id] = (contagemItens[id] || 0) + qte;
        });
      });
    });

    return Object.entries(contagemItens)
      .map(([id, qte]) => {
        const itemObj = PROTOCOLO_RES_ITENS.find((i) => i.id === Number(id));
        return {
          nome: itemObj?.nome || `Item #${id}`,
          codigo: itemObj?.codigo || "",
          qte,
        };
      })
      .sort((a, b) => b.qte - a.qte)
      .slice(0, 5);
  };

  const handleExportarCSV = () => {
    if (expedicoes.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Expedicao_ID;Numero;Titulo;Data_Campo;Praia;Status;Total_Itens\n";

    expedicoes.forEach((exp) => {
      let totalExp = 0;
      Object.values(exp.contagens || {}).forEach((eqCounts) => {
        Object.values(eqCounts || {}).forEach((qte) => (totalExp += qte));
      });
      csvContent += `${exp.id};${exp.numero};"${exp.titulo}";${exp.data_campo};"${exp.praia}";${exp.status};${totalExp}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `oceano_na_escola_dados_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <BarraNavegacao />
        <main className="flex-1 flex items-center justify-center">
          <EstadoContainer estado="carregando">{null}</EstadoContainer>
        </main>
      </div>
    );
  }

  const composicao = calcularComposicaoMateriais();
  const topItens = calcularTopItens();
  const totalItens = calcularTotalItens();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <BarraNavegacao />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* Cabeçalho do Painel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Painel Analítico da Escola</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {escola?.nome || "E.M. Mapa Verde"} · {escola?.municipio}
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

        {/* Cartões Indicadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-md shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Expedições Realizadas
            </span>
            <span className="text-2xl font-bold tabular-nums text-foreground">{expedicoes.length}</span>
          </div>

          <div className="bg-card border border-border p-4 rounded-md shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Total de Itens Catalogados
            </span>
            <span className="text-2xl font-bold tabular-nums text-foreground">{totalItens}</span>
          </div>

          <div className="bg-card border border-border p-4 rounded-md shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Densidade Média
            </span>
            <span className="text-2xl font-bold tabular-nums text-accent">{calcularDensidadeMedia()} <span className="text-xs font-normal text-muted-foreground">itens/m²</span></span>
          </div>

          <div className="bg-card border border-border p-4 rounded-md shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Área Amostrada Total
            </span>
            <span className="text-2xl font-bold tabular-nums text-foreground">{calcularAreaTotal()} <span className="text-xs font-normal text-muted-foreground">m²</span></span>
          </div>
        </div>

        {/* Gráficos e Distribuição */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Composição por Material */}
          <div className="bg-card border border-border rounded-md p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                <span>Composição por Material</span>
              </h2>
            </div>

            <div className="space-y-3">
              {Object.entries(composicao).map(([material, qte]) => {
                const percent = totalItens > 0 ? ((qte / totalItens) * 100).toFixed(1) : 0;
                return (
                  <div key={material} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{material}</span>
                      <span className="tabular-nums text-muted-foreground">{qte} itens ({percent}%)</span>
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
          </div>

          {/* Ranking Top 5 Itens Encontrados */}
          <div className="bg-card border border-border rounded-md p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Top 5 Resíduos Mais Comuns</span>
              </h2>
            </div>

            <div className="space-y-2.5">
              {topItens.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-secondary/50 border border-border rounded-sm text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-foreground">{item.nome}</span>
                  </div>
                  <span className="font-bold tabular-nums text-accent bg-accent/10 px-2 py-0.5 rounded-sm">
                    {item.qte} un.
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Últimas Expedições da Escola */}
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

          <div className="space-y-2">
            {expedicoes.slice(0, 4).map((exp) => (
              <div
                key={exp.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-background border border-border rounded-sm gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground font-bold">#{exp.numero}</span>
                    <span className="text-xs font-bold text-foreground">{exp.titulo}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{exp.praia}</span>
                    <span>•</span>
                    <span>{exp.data_campo}</span>
                    <span>•</span>
                    <span>{exp.turma_nome}</span>
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
        </div>
      </main>
    </div>
  );
}

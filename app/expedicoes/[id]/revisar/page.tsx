"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { 
  CheckCircle2, 
  RotateCcw, 
  AlertTriangle, 
  ChevronLeft, 
  FileText, 
  MapPin, 
  Calendar, 
  Users, 
  Scale, 
  Layers, 
  Image as ImageIcon,
  Check
} from "lucide-react";
import { 
  getLocalStorageData, 
  setLocalStorageData, 
  MOCK_EXPEDICOES, 
  PROTOCOLO_RES_ITENS, 
  ExpedicaoDetalhada 
} from "@/lib/dados-mock";

export default function RevisarPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const expedicaoId = Number(resolvedParams.id);

  const [expedicao, setExpedicao] = useState<ExpedicaoDetalhada | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    const expedicoes = getLocalStorageData<ExpedicaoDetalhada[]>("expedicoes", MOCK_EXPEDICOES);
    const encontrada = expedicoes.find((e) => e.id === expedicaoId);
    if (encontrada) {
      setExpedicao(encontrada);
    }
    setCarregando(false);
  }, [expedicaoId]);

  const calcularTotalEquipe = (equipeId: number) => {
    if (!expedicao?.contagens) return 0;
    const eqCounts = expedicao.contagens[equipeId] || {};
    return Object.values(eqCounts).reduce((a, b) => a + b, 0);
  };

  const calcularTotalGeral = () => {
    if (!expedicao) return 0;
    return expedicao.equipes.reduce((s, eq) => s + calcularTotalEquipe(eq.id), 0);
  };

  const calcularAreaTotalM2 = () => {
    if (!expedicao) return 0;
    return expedicao.equipes.reduce((s, eq) => s + eq.area_m2, 0);
  };

  const calcularDensidade = () => {
    const area = calcularAreaTotalM2();
    if (area === 0) return "0.000";
    return (calcularTotalGeral() / area).toFixed(3);
  };

  const calcularPesoTotalKg = () => {
    if (!expedicao) return 0;
    return expedicao.equipes.reduce((s, eq) => s + (eq.peso_kg || 0), 0).toFixed(1);
  };

  // Verificação de Alertas Automáticos (Outliers)
  const gerarAlertas = () => {
    if (!expedicao) return [];
    const alertas: string[] = [];

    expedicao.equipes.forEach((eq) => {
      const totalEq = calcularTotalEquipe(eq.id);
      if (totalEq === 0) {
        alertas.push(`A ${eq.nome} não possui nenhuma contagem registrada.`);
      }
      Object.entries(expedicao.contagens[eq.id] || {}).forEach(([itemId, qte]) => {
        if (qte > 50) {
          const itemObj = PROTOCOLO_RES_ITENS.find((i) => i.id === Number(itemId));
          alertas.push(
            `Valor elevado na ${eq.nome}: ${qte} unidades do item "${itemObj?.nome || itemId}".`
          );
        }
      });
    });

    if (!expedicao.foto_ficha_url) {
      alertas.push("Nenhuma foto da ficha física foi anexada para conferência.");
    }

    return alertas;
  };

  const handleValidarEPublicar = () => {
    if (!expedicao) return;
    setProcessando(true);

    setTimeout(() => {
      const expedicoes = getLocalStorageData<ExpedicaoDetalhada[]>("expedicoes", MOCK_EXPEDICOES);
      const atualizadas = expedicoes.map((e) => {
        if (e.id === expedicaoId) {
          return { ...e, status: "validado" as const };
        }
        return e;
      });

      setLocalStorageData("expedicoes", atualizadas);
      setProcessando(false);
      router.push(`/painel`);
    }, 600);
  };

  const handleDevolverParaCorrecao = () => {
    if (!expedicao) return;
    setProcessando(true);

    setTimeout(() => {
      const expedicoes = getLocalStorageData<ExpedicaoDetalhada[]>("expedicoes", MOCK_EXPEDICOES);
      const atualizadas = expedicoes.map((e) => {
        if (e.id === expedicaoId) {
          return { ...e, status: "devolvido" as const };
        }
        return e;
      });

      setLocalStorageData("expedicoes", atualizadas);
      setProcessando(false);
      router.push(`/expedicoes/${expedicaoId}/transcrever`);
    }, 600);
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

  if (!expedicao) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <BarraNavegacao />
        <main className="flex-1 p-6">
          <EstadoContainer estado="erro" mensagemErro="Expedição não encontrada." />
        </main>
      </div>
    );
  }

  const alertas = gerarAlertas();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <BarraNavegacao />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/expedicoes"
              className="p-1 text-muted-foreground hover:text-foreground rounded-sm hover:bg-secondary"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-muted-foreground">#{expedicao.numero}</span>
                <h1 className="text-lg font-bold">Revisão e Validação em Lote</h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Confira os totais acumulados e compare com a ficha física antes de publicar para a rede.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDevolverParaCorrecao}
              disabled={processando}
              className="px-3 py-2 text-xs font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 rounded-sm transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Devolver p/ Correção</span>
            </button>

            <button
              onClick={handleValidarEPublicar}
              disabled={processando || expedicao.status === "validado"}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground hover:opacity-90 rounded-sm transition-opacity flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{expedicao.status === "validado" ? "Já Validada" : "Validar e Publicar Dado"}</span>
            </button>
          </div>
        </div>

        {/* Resumo em Cartões Indicadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-3.5 rounded-md">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block mb-1">
              Total de Itens
            </span>
            <span className="text-xl font-bold tabular-nums text-foreground">{calcularTotalGeral()}</span>
          </div>

          <div className="bg-card border border-border p-3.5 rounded-md">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block mb-1">
              Densidade Costeira
            </span>
            <span className="text-xl font-bold tabular-nums text-accent">{calcularDensidade()} <span className="text-xs font-normal text-muted-foreground">itens/m²</span></span>
          </div>

          <div className="bg-card border border-border p-3.5 rounded-md">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block mb-1">
              Área Amostrada
            </span>
            <span className="text-xl font-bold tabular-nums text-foreground">{calcularAreaTotalM2()} <span className="text-xs font-normal text-muted-foreground">m²</span></span>
          </div>

          <div className="bg-card border border-border p-3.5 rounded-md">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block mb-1">
              Massa de Resíduos
            </span>
            <span className="text-xl font-bold tabular-nums text-foreground">{calcularPesoTotalKg()} <span className="text-xs font-normal text-muted-foreground">kg</span></span>
          </div>
        </div>

        {/* Alertas Automáticos */}
        {alertas.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Alertas Automáticos de Conferência ({alertas.length})</span>
            </div>
            <ul className="list-disc pl-5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              {alertas.map((alerta, idx) => (
                <li key={idx}>{alerta}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Comparação Lado a Lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lado Esquerdo: Ficha Digitalizada */}
          <div className="bg-card border border-border rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>Foto da Ficha Original</span>
              </span>
            </div>

            {expedicao.foto_ficha_url ? (
              <div className="border border-border rounded-sm overflow-hidden bg-black/5 min-h-[350px] flex items-center justify-center">
                {/* eslint-disable-next-html-element */}
                <img
                  src={expedicao.foto_ficha_url}
                  alt="Ficha física de papel"
                  className="w-full h-auto object-contain max-h-[500px]"
                />
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-sm p-12 text-center text-xs text-muted-foreground min-h-[300px] flex flex-col items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <span>Nenhuma foto da ficha física anexada nesta expedição.</span>
              </div>
            )}
          </div>

          {/* Lado Direito: Resumo de Contagem em Tabela */}
          <div className="bg-card border border-border rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <span>Contagens Transcritas no Banco</span>
              </span>
            </div>

            <div className="max-h-[500px] overflow-y-auto border border-border rounded-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary border-b border-border text-muted-foreground font-semibold">
                    <th className="py-2 px-3">Item</th>
                    {expedicao.equipes.map((eq) => (
                      <th key={eq.id} className="py-2 px-2 text-center border-l border-border">{eq.nome}</th>
                    ))}
                    <th className="py-2 px-3 text-center border-l border-border bg-secondary">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {PROTOCOLO_RES_ITENS.map((item) => {
                    const soma = expedicao.equipes.reduce(
                      (s, eq) => s + (expedicao.contagens[eq.id]?.[item.id] || 0),
                      0
                    );
                    if (soma === 0) return null; // Oculta itens zerados na conferência para dar clareza

                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-secondary/40">
                        <td className="py-1.5 px-3 font-medium text-foreground">
                          <span className="font-mono text-[10px] text-muted-foreground mr-1.5">{item.codigo}</span>
                          {item.nome}
                        </td>
                        {expedicao.equipes.map((eq) => (
                          <td key={eq.id} className="py-1.5 px-2 text-center border-l border-border tabular-nums">
                            {expedicao.contagens[eq.id]?.[item.id] || 0}
                          </td>
                        ))}
                        <td className="py-1.5 px-3 text-center border-l border-border font-bold tabular-nums text-foreground bg-secondary/20">
                          {soma}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {expedicao.observacoes_texto && (
              <div className="p-3 bg-secondary/50 border border-border rounded-sm text-xs">
                <span className="font-semibold text-muted-foreground uppercase text-[10px] block mb-1">
                  Observações Qualitativas da Equipe:
                </span>
                <p className="text-foreground">{expedicao.observacoes_texto}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

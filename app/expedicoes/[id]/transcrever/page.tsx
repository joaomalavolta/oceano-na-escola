"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { 
  FileEdit, 
  Save, 
  Send, 
  Image as ImageIcon, 
  ChevronLeft, 
  Check, 
  Info,
  Calendar,
  MapPin,
  Users
} from "lucide-react";
import { 
  getLocalStorageData, 
  setLocalStorageData, 
  MOCK_EXPEDICOES, 
  PROTOCOLO_RES_ITENS, 
  ExpedicaoDetalhada,
  ProtocoloItem
} from "@/lib/dados-mock";

export default function TranscreverPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const expedicaoId = Number(resolvedParams.id);

  const [expedicao, setExpedicao] = useState<ExpedicaoDetalhada | null>(null);
  const [contagens, setContagens] = useState<Record<string, Record<number, number>>>({});
  const [observacoes, setObservacoes] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [estadoUi, setEstadoUi] = useState<"carregando" | "pronto" | "salvando" | "erro" | "somente_leitura">("carregando");
  const [statusSalvamento, setStatusSalvamento] = useState<"salvo" | "salvando" | "erro">("salvo");

  const inputsRef = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    const expedicoes = getLocalStorageData<ExpedicaoDetalhada[]>("expedicoes", MOCK_EXPEDICOES);
    const encontrada = expedicoes.find((e) => e.id === expedicaoId);

    if (encontrada) {
      setExpedicao(encontrada);
      setContagens(encontrada.contagens || {});
      setObservacoes(encontrada.observacoes_texto || "");
      setFotoUrl(encontrada.foto_ficha_url || "");

      if (encontrada.status === "validado") {
        setEstadoUi("somente_leitura");
      } else {
        setEstadoUi("pronto");
      }
    } else {
      setEstadoUi("erro");
    }
  }, [expedicaoId]);

  const autosave = (novasContagens: typeof contagens, novasObs: string, novaFoto: string) => {
    if (!expedicao || estadoUi === "somente_leitura") return;

    setStatusSalvamento("salvando");
    const expedicoes = getLocalStorageData<ExpedicaoDetalhada[]>("expedicoes", MOCK_EXPEDICOES);
    const atualizadas = expedicoes.map((e) => {
      if (e.id === expedicaoId) {
        return {
          ...e,
          contagens: novasContagens,
          observacoes_texto: novasObs,
          foto_ficha_url: novaFoto,
        };
      }
      return e;
    });

    setTimeout(() => {
      setLocalStorageData("expedicoes", atualizadas);
      setStatusSalvamento("salvo");
    }, 300);
  };

  const handleInputChange = (equipeId: number, itemId: number, valorRaw: string) => {
    if (estadoUi === "somente_leitura") return;

    const val = valorRaw.replace(/\D/g, "");
    const num = val === "" ? 0 : parseInt(val, 10);

    const novasContagens = {
      ...contagens,
      [equipeId]: {
        ...(contagens[equipeId] || {}),
        [itemId]: num,
      },
    };

    setContagens(novasContagens);
    autosave(novasContagens, observacoes, fotoUrl);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    equipeIndex: number,
    itemIndex: number
  ) => {
    if (!expedicao) return;
    const nEquipes = expedicao.equipes.length;
    const nItens = PROTOCOLO_RES_ITENS.length;

    let targetEquipe = equipeIndex;
    let targetItem = itemIndex;

    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      targetItem = itemIndex + 1 < nItens ? itemIndex + 1 : 0;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      targetItem = itemIndex - 1 >= 0 ? itemIndex - 1 : nItens - 1;
    } else if (e.key === "ArrowRight") {
      if (equipeIndex + 1 < nEquipes) {
        e.preventDefault();
        targetEquipe = equipeIndex + 1;
      }
    } else if (e.key === "ArrowLeft") {
      if (equipeIndex - 1 >= 0) {
        e.preventDefault();
        targetEquipe = equipeIndex - 1;
      }
    }

    const key = `eq_${targetEquipe}_item_${targetItem}`;
    const targetInput = inputsRef.current.get(key);
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  };

  const handleEnviarParaRevisao = () => {
    if (!expedicao) return;
    const expedicoes = getLocalStorageData<ExpedicaoDetalhada[]>("expedicoes", MOCK_EXPEDICOES);
    const atualizadas = expedicoes.map((e) => {
      if (e.id === expedicaoId) {
        return {
          ...e,
          status: "enviado" as const,
          contagens,
          observacoes_texto: observacoes,
          foto_ficha_url: fotoUrl,
        };
      }
      return e;
    });

    setLocalStorageData("expedicoes", atualizadas);
    router.push(`/expedicoes/${expedicaoId}/revisar`);
  };

  const calcularTotalEquipe = (equipeId: number) => {
    const eqCounts = contagens[equipeId] || {};
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
    if (area === 0) return 0;
    return (calcularTotalGeral() / area).toFixed(3);
  };

  const gruposItens = PROTOCOLO_RES_ITENS.reduce((acc, item) => {
    if (!acc[item.grupo]) acc[item.grupo] = [];
    acc[item.grupo].push(item);
    return acc;
  }, {} as Record<string, ProtocoloItem[]>);

  if (estadoUi === "carregando") {
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Cabeçalho Fixo */}
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-xs px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link
              href="/expedicoes"
              className="p-1 text-muted-foreground hover:text-foreground rounded-sm hover:bg-secondary"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  #{expedicao.numero}
                </span>
                <h1 className="text-sm font-bold text-foreground">
                  {expedicao.titulo}
                </h1>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {expedicao.praia}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {expedicao.data_campo}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {expedicao.turma_nome}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-3 bg-secondary px-3 py-1.5 rounded-sm border border-border">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block">Total Itens</span>
                <span className="font-bold tabular-nums text-foreground">{calcularTotalGeral()}</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block">Densidade</span>
                <span className="font-bold tabular-nums text-accent">{calcularDensidade()} <span className="text-[10px] font-normal">itens/m²</span></span>
              </div>
            </div>

            <div className="text-[11px] font-medium flex items-center gap-1 text-muted-foreground">
              {statusSalvamento === "salvando" && (
                <span className="text-amber-500 flex items-center gap-1">
                  <Save className="w-3.5 h-3.5 animate-bounce" /> Salvando…
                </span>
              )}
              {statusSalvamento === "salvo" && (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Salvo
                </span>
              )}
            </div>

            {estadoUi !== "somente_leitura" && (
              <button
                onClick={handleEnviarParaRevisao}
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 rounded-sm transition-opacity flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar p/ Revisão</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tabela de Digitação */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 space-y-6">
        <EstadoContainer estado={estadoUi}>
          <div className="bg-card border border-border rounded-md shadow-2xs overflow-hidden">
            <div className="p-3 bg-muted/60 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Protocolo RES — Contagem de Resíduos (&gt; 2,5 cm)
              </span>
              <span className="text-[11px] text-muted-foreground hidden md:inline">
                Navegação: <strong>Tab / Enter / Setas</strong> alternam entre células
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-secondary/70 border-b border-border text-xs font-semibold tracking-wide text-muted-foreground">
                    <th className="py-2 px-3 w-16 text-center">Cód.</th>
                    <th className="py-2 px-3">Item de Resíduo</th>
                    {expedicao.equipes.map((eq) => (
                      <th key={eq.id} className="py-2 px-2 w-24 text-center border-l border-border">
                        <div>{eq.nome}</div>
                        <div className="text-[10px] font-normal text-muted-foreground">
                          {eq.area_m2} m²
                        </div>
                      </th>
                    ))}
                    <th className="py-2 px-3 w-20 text-center border-l border-border bg-secondary">
                      Soma
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(gruposItens).map(([grupo, itens]) => (
                    <React.Fragment key={grupo}>
                      <tr className="bg-secondary/40 border-b border-border">
                        <td
                          colSpan={3 + expedicao.equipes.length}
                          className="py-1 px-3 text-xs font-semibold uppercase tracking-wider text-primary"
                        >
                          {grupo}
                        </td>
                      </tr>

                      {itens.map((item) => {
                        const globalItemIdx = PROTOCOLO_RES_ITENS.findIndex((i) => i.id === item.id);
                        const somaLinha = expedicao.equipes.reduce((s, eq) => {
                          return s + (contagens[eq.id]?.[item.id] || 0);
                        }, 0);

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-border hover:bg-accent/10 transition-colors"
                          >
                            <td className="py-1.5 px-3 text-xs font-mono text-muted-foreground text-center">
                              {item.codigo}
                            </td>
                            <td className="py-1.5 px-3 font-medium text-foreground">
                              {item.nome}
                            </td>
                            {expedicao.equipes.map((eq, eqIdx) => {
                              const valor = contagens[eq.id]?.[item.id] ?? 0;
                              const inputKey = `eq_${eqIdx}_item_${globalItemIdx}`;

                              return (
                                <td
                                  key={eq.id}
                                  className="py-1 px-1 border-l border-border text-center"
                                >
                                  <input
                                    ref={(el) => {
                                      if (el) inputsRef.current.set(inputKey, el);
                                      else inputsRef.current.delete(inputKey);
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    disabled={estadoUi === "somente_leitura"}
                                    value={valor === 0 ? "" : valor}
                                    onChange={(e) =>
                                      handleInputChange(eq.id, item.id, e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                      handleKeyDown(e, eqIdx, globalItemIdx)
                                    }
                                    placeholder="0"
                                    className="w-full text-center py-1 px-1 text-sm font-semibold tabular-nums bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring focus:bg-accent/20 disabled:opacity-75"
                                  />
                                </td>
                              );
                            })}
                            <td className="py-1.5 px-3 text-center border-l border-border font-bold tabular-nums text-foreground bg-secondary/20">
                              {somaLinha}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}

                  <tr className="bg-secondary border-t-2 border-border font-bold">
                    <td colSpan={2} className="py-2.5 px-3 text-xs uppercase tracking-wider text-right">
                      Totais por Equipe:
                    </td>
                    {expedicao.equipes.map((eq) => (
                      <td key={eq.id} className="py-2.5 px-2 text-center border-l border-border tabular-nums text-sm">
                        {calcularTotalEquipe(eq.id)}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center border-l border-border tabular-nums text-base text-accent font-bold">
                      {calcularTotalGeral()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-md p-4 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>Foto da Ficha de Papel Digitalizada</span>
              </h2>
              <div>
                <input
                  type="text"
                  disabled={estadoUi === "somente_leitura"}
                  value={fotoUrl}
                  onChange={(e) => {
                    setFotoUrl(e.target.value);
                    autosave(contagens, observacoes, e.target.value);
                  }}
                  placeholder="Cole a URL da foto da ficha (ex: HTTPS...)"
                  className="w-full px-3 py-1.5 text-xs bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {fotoUrl && (
                <div className="mt-2 border border-border rounded-sm overflow-hidden bg-black/5 max-h-48 flex items-center justify-center">
                  {/* eslint-disable-next-html-element */}
                  <img
                    src={fotoUrl}
                    alt="Foto da ficha de papel"
                    className="max-h-48 object-contain"
                  />
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-md p-4 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Info className="w-4 h-4 text-primary" />
                <span>Observações da Equipe / Qualitativo</span>
              </h2>
              <textarea
                rows={4}
                disabled={estadoUi === "somente_leitura"}
                value={observacoes}
                onChange={(e) => {
                  setObservacoes(e.target.value);
                  autosave(contagens, e.target.value, fotoUrl);
                }}
                placeholder="Descreva itens não listados ('Outro'), presença de saídas de esgoto/drenagem ou peculiaridades do trecho..."
                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </EstadoContainer>
      </main>
    </div>
  );
}

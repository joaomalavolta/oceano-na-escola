"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown, Minus, Plus, Trash2 } from "lucide-react";

import type { ItemDeResiduo } from "@/lib/campo";
import { MATERIAIS, somaDosItens, type LixoNoPonto, type Material } from "@/lib/lixo-no-mar";

interface Props {
  valor: LixoNoPonto;
  onMudar: (l: LixoNoPonto) => void;
  itensDeResiduo: ItemDeResiduo[];
  marcasConhecidas: string[];
}

/** Texto do campo → número, ou nulo quando vazio. Aceita vírgula. */
function lerNumero(t: string): number | null {
  const s = t.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const base = "px-3 py-2 text-sm tabular-nums bg-background border border-input rounded-sm";
const campo = `w-full ${base}`;
const rotulo = "block text-[11px] font-semibold text-muted-foreground mb-1";

/**
 * Quanto lixo há no ponto, de quê e de que marca.
 *
 * Tudo opcional: o ponto vale como presença. A ordem é a do esforço —
 * primeiro o que se estima de olho (quantos itens, quantos sacos, que
 * material predomina), depois o que pede contar (por tipo e por marca).
 */
export function QuantoLixo({ valor, onMudar, itensDeResiduo, marcasConhecidas }: Props) {
  const l = valor;
  const idLista = useId();
  const [grupoAberto, setGrupoAberto] = useState<string | null>("Plástico");
  const [contarPorTipo, setContarPorTipo] = useState(somaDosItens(l) > 0);

  const grupos = useMemo(() => {
    const m = new Map<string, ItemDeResiduo[]>();
    for (const i of itensDeResiduo) m.set(i.grupo, [...(m.get(i.grupo) ?? []), i]);
    return [...m.entries()];
  }, [itensDeResiduo]);

  const mudarItem = (id: number, delta: number) => {
    const n = Math.max(0, (l.itens[id] ?? 0) + delta);
    const itens = { ...l.itens };
    if (n === 0) delete itens[id];
    else itens[id] = n;
    onMudar({ ...l, itens });
  };

  const soma = somaDosItens(l);

  return (
    <div className="space-y-4 p-3 rounded-sm border border-border bg-secondary/30">
      <p className="text-xs font-bold">Quanto lixo há aqui (opcional)</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 sm:col-span-1">
          <label className={rotulo}>Quantidade estimada de itens</label>
          <input
            inputMode="numeric"
            value={l.quantidadeEstimada ?? ""}
            onChange={(e) => onMudar({ ...l, quantidadeEstimada: lerNumero(e.target.value) })}
            placeholder={soma > 0 ? String(soma) : "Ex.: 40"}
            className={campo}
          />
        </div>
        <div>
          <label className={rotulo}>Volume em sacos</label>
          <input
            inputMode="decimal"
            value={l.sacos ?? ""}
            onChange={(e) => {
              const sacos = lerNumero(e.target.value);
              onMudar({ ...l, sacos, litrosPorSaco: sacos === null ? null : l.litrosPorSaco });
            }}
            placeholder="Ex.: 2"
            className={campo}
          />
        </div>
        <div>
          <label className={rotulo}>Tamanho do saco (L)</label>
          <input
            inputMode="numeric"
            value={l.litrosPorSaco ?? ""}
            disabled={l.sacos === null}
            onChange={(e) => onMudar({ ...l, litrosPorSaco: lerNumero(e.target.value) })}
            placeholder="Ex.: 100"
            className={`${campo} disabled:opacity-50`}
          />
        </div>
      </div>

      <div>
        <p className={rotulo}>Material predominante</p>
        <div className="flex flex-wrap gap-1.5">
          {MATERIAIS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onMudar({ ...l, material: l.material === m.id ? null : (m.id as Material) })}
              className={`px-2.5 py-1 text-xs rounded-full border ${
                l.material === m.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
              }`}
            >
              {m.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Contagem por tipo, com a lista de RES. Fechada de início: é a
          parte que pede tempo, e o ponto vale sem ela. */}
      <div>
        <button
          type="button"
          onClick={() => setContarPorTipo((v) => !v)}
          className="text-xs font-semibold text-primary inline-flex items-center gap-1"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${contarPorTipo ? "rotate-180" : ""}`} />
          Contar por tipo{soma > 0 ? ` · ${soma} item(ns)` : ""}
        </button>
        {contarPorTipo && (
          <div className="mt-2 space-y-1.5">
            {itensDeResiduo.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                A lista de tipos não está neste aparelho. Abra esta página uma vez com internet.
              </p>
            )}
            {grupos.map(([grupo, itens]) => {
              const noGrupo = itens.reduce((s, i) => s + (l.itens[i.id] ?? 0), 0);
              const aberto = grupoAberto === grupo;
              return (
                <div key={grupo} className="border border-border rounded-sm bg-background">
                  <button
                    type="button"
                    onClick={() => setGrupoAberto(aberto ? null : grupo)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold"
                  >
                    {grupo}
                    <span className="text-muted-foreground tabular-nums">
                      {noGrupo > 0 ? noGrupo : ""} <ChevronDown className={`inline w-3.5 h-3.5 ${aberto ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {aberto && (
                    <ul className="border-t border-border divide-y divide-border">
                      {itens.map((i) => (
                        <li key={i.id} className="flex items-center gap-2 px-3 py-1.5">
                          <span className="flex-1 text-xs leading-tight">{i.nome}</span>
                          <button
                            type="button"
                            onClick={() => mudarItem(i.id, -1)}
                            disabled={!l.itens[i.id]}
                            aria-label={`Menos ${i.nome}`}
                            className="w-9 h-9 rounded-full border border-border flex items-center justify-center disabled:opacity-30"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold tabular-nums">{l.itens[i.id] ?? 0}</span>
                          <button
                            type="button"
                            onClick={() => mudarItem(i.id, 1)}
                            aria-label={`Mais ${i.nome}`}
                            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Marcas: a base do ranking. Sugere as que a rede já registrou —
          escrever igual é o que faz a contagem somar. */}
      <div>
        <p className={rotulo}>Marcas identificadas</p>
        <datalist id={idLista}>
          {marcasConhecidas.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <div className="space-y-1.5">
          {l.marcas.map((m, i) => (
            <div key={i} className="flex gap-1.5">
              <input
                list={idLista}
                value={m.marca}
                maxLength={80}
                onChange={(e) => {
                  const marcas = [...l.marcas];
                  marcas[i] = { ...m, marca: e.target.value };
                  onMudar({ ...l, marcas });
                }}
                placeholder="Marca, como está na embalagem"
                className={`${base} flex-1 min-w-0`}
              />
              <input
                inputMode="numeric"
                value={m.quantidade || ""}
                onChange={(e) => {
                  const marcas = [...l.marcas];
                  marcas[i] = { ...m, quantidade: Math.max(0, Math.round(lerNumero(e.target.value) ?? 0)) };
                  onMudar({ ...l, marcas });
                }}
                placeholder="itens"
                aria-label="Quantos itens desta marca"
                className={`${base} w-20 shrink-0`}
              />
              <button
                type="button"
                onClick={() => onMudar({ ...l, marcas: l.marcas.filter((_, j) => j !== i) })}
                aria-label="Tirar esta marca"
                className="px-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onMudar({ ...l, marcas: [...l.marcas, { marca: "", quantidade: 1 }] })}
            className="text-xs font-semibold text-primary inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Acrescentar marca
          </button>
          <p className="text-[11px] text-muted-foreground">
            Só a marca que dá para ler no item. Na dúvida, não registre — marca errada pesa no
            ranking.
          </p>
        </div>
      </div>
    </div>
  );
}

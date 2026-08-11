"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────
// Painel lateral de camadas e filtros (desktop)
// Oculto em mobile — mobile usa <MobileSheet>
// ─────────────────────────────────────────────

/**
 * As camadas de protocolo são um dicionário por código, não campos
 * nomeados. Com `residuos` e `microplasticos` fixos aqui, um protocolo
 * novo existia no banco e não tinha como aparecer no mapa.
 */
export interface CamadasState {
  protocolos: Record<string, boolean>;
  escolas: boolean;
  ocorrencias: boolean;
}

/** O que o painel precisa saber de um protocolo para desenhá-lo. */
export interface ProtocoloCamada {
  codigo: string;
  nome: string;
  cor: string | null;
  /** Protocolos de densidade viram grade; os demais, só pins. */
  forma_agregacao: string;
}

export interface FiltrosState {
  municipio: string;
  escola: string;
  protocolo: string;
  mesInicio: string;
  mesFim: string;
}

interface PainelCamadasProps {
  camadas: CamadasState;
  onToggleProtocolo: (codigo: string) => void;
  onToggleCamada: (camada: "escolas" | "ocorrencias") => void;
  filtros: FiltrosState;
  onChangeFiltro: (campo: keyof FiltrosState, valor: string) => void;
  municipios: string[];
  escolas: { slug: string; nome: string }[];
  protocolos: ProtocoloCamada[];
}

export function PainelCamadas({
  camadas,
  onToggleProtocolo,
  onToggleCamada,
  filtros,
  onChangeFiltro,
  municipios,
  escolas,
  protocolos,
}: PainelCamadasProps) {
  const [expandido, setExpandido] = useState(true);

  return (
    <div className="hidden md:block fixed top-14 left-3 z-40">
      {/* Toggle button */}
      <button
        onClick={() => setExpandido((v) => !v)}
        className="
          absolute -right-4 top-3 z-50
          flex items-center justify-center
          w-8 h-8 rounded-full
          bg-glass-bg backdrop-blur-xl border border-glass-border
          text-muted-foreground hover:text-foreground
          shadow-sm transition-colors
        "
        aria-label={expandido ? "Recolher painel" : "Expandir painel"}
      >
        {expandido ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Panel body */}
      <div
        className={`
          bg-glass-bg backdrop-blur-xl border border-glass-border rounded-sm
          shadow-lg overflow-hidden
          transition-all duration-200 ease-out
          ${expandido ? "w-72 opacity-100" : "w-0 opacity-0 pointer-events-none"}
        `}
      >
        <div className="w-72 max-h-[calc(100vh-5rem)] overflow-y-auto px-3 py-2 space-y-4">
          {/* ── CAMADAS ────────────────────────── */}
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Camadas
            </h3>
            <div className="space-y-2">
              {protocolos.map((p) => {
                const ligada = camadas.protocolos[p.codigo] ?? false;
                return (
                  <button
                    key={p.codigo}
                    onClick={() => onToggleProtocolo(p.codigo)}
                    className="flex items-center gap-3 w-full text-left px-2 py-1.5 rounded-sm hover:bg-muted/50 transition-colors"
                  >
                    <span
                      className="w-8 h-5 rounded-full relative transition-colors"
                      style={{
                        backgroundColor: ligada
                          ? p.cor ?? "var(--color-primary)"
                          : "var(--color-muted)",
                      }}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          ligada ? "left-3.5" : "left-0.5"
                        }`}
                      />
                    </span>
                    <span className="text-sm flex-1">{p.nome}</span>
                    {p.forma_agregacao !== "densidade" && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        pin
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-1 mt-1 border-t border-glass-border space-y-2">
                {(
                  [
                    ["escolas", "Escolas"],
                    ["ocorrencias", "Ocorrências"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => onToggleCamada(key)}
                    className="flex items-center gap-3 w-full text-left px-2 py-1.5 rounded-sm hover:bg-muted/50 transition-colors"
                  >
                    <span
                      className={`w-8 h-5 rounded-full relative transition-colors ${
                        camadas[key] ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          camadas[key] ? "left-3.5" : "left-0.5"
                        }`}
                      />
                    </span>
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── FILTROS ────────────────────────── */}
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Filtros
            </h3>
            <div className="space-y-2">
              {/* Município */}
              <div>
                <label className="text-xs text-muted-foreground">Município</label>
                <select
                  value={filtros.municipio}
                  onChange={(e) => onChangeFiltro("municipio", e.target.value)}
                  className="mt-0.5 w-full bg-card border border-border rounded-sm text-sm px-2 py-1.5"
                >
                  <option value="">Todos</option>
                  {municipios.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Escola */}
              <div>
                <label className="text-xs text-muted-foreground">Escola</label>
                <select
                  value={filtros.escola}
                  onChange={(e) => onChangeFiltro("escola", e.target.value)}
                  className="mt-0.5 w-full bg-card border border-border rounded-sm text-sm px-2 py-1.5"
                >
                  <option value="">Todas</option>
                  {escolas.map((e) => (
                    <option key={e.slug} value={e.slug}>{e.nome}</option>
                  ))}
                </select>
              </div>

              {/* Protocolo */}
              <div>
                <label className="text-xs text-muted-foreground">Protocolo</label>
                <select
                  value={filtros.protocolo}
                  onChange={(e) => onChangeFiltro("protocolo", e.target.value)}
                  className="mt-0.5 w-full bg-card border border-border rounded-sm text-sm px-2 py-1.5"
                >
                  <option value="">Todos</option>
                  {protocolos.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.codigo} — {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Período */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">De</label>
                  <input
                    type="month"
                    value={filtros.mesInicio}
                    onChange={(e) => onChangeFiltro("mesInicio", e.target.value)}
                    className="mt-0.5 w-full bg-card border border-border rounded-sm text-sm px-2 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Até</label>
                  <input
                    type="month"
                    value={filtros.mesFim}
                    onChange={(e) => onChangeFiltro("mesFim", e.target.value)}
                    className="mt-0.5 w-full bg-card border border-border rounded-sm text-sm px-2 py-1.5"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

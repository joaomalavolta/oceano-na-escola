"use client";

import { useState } from "react";
import { Layers, X } from "lucide-react";
import { IconeBadge, COR_ESCOLA } from "./icones";
import { ListaOcorrencias } from "./lista-ocorrencias";
import type { CamadasState, FiltrosState, ProtocoloCamada } from "./painel-camadas";
import type { PubObservacaoPontual } from "@/lib/database.types";

// ─────────────────────────────────────────────
// Sheet deslizante de camadas e filtros (mobile)
// Acionado pelo FAB no canto inferior direito
// ─────────────────────────────────────────────

interface MobileSheetProps {
  camadas: CamadasState;
  onToggleProtocolo: (codigo: string) => void;
  onToggleCamada: (camada: "escolas" | "ocorrencias") => void;
  filtros: FiltrosState;
  onChangeFiltro: (campo: keyof FiltrosState, valor: string) => void;
  municipios: string[];
  escolas: { slug: string; nome: string }[];
  protocolos: ProtocoloCamada[];
  contagens: Record<string, number>;
  ocorrenciasNaVista: PubObservacaoPontual[];
  totalDeOcorrencias: number;
  onIrParaOcorrencia: (o: PubObservacaoPontual) => void;
}

export function MobileSheet({
  camadas,
  onToggleProtocolo,
  onToggleCamada,
  filtros,
  onChangeFiltro,
  municipios,
  escolas,
  protocolos,
  contagens,
  ocorrenciasNaVista,
  totalDeOcorrencias,
  onIrParaOcorrencia,
}: MobileSheetProps) {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<"camadas" | "lista">("camadas");

  return (
    <>
      {/* FAB — visível apenas em mobile */}
      <button
        onClick={() => setAberto(true)}
        className="
          fixed bottom-24 right-4 z-50 md:hidden
          flex items-center justify-center
          w-12 h-12 rounded-full
          bg-primary text-primary-foreground
          shadow-lg active:scale-95 transition-transform
        "
        aria-label="Abrir camadas e filtros"
      >
        <Layers size={20} />
      </button>

      {/* Backdrop */}
      {aberto && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 md:hidden"
          onClick={() => setAberto(false)}
        />
      )}

      {/* Sheet */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-[70] md:hidden
          transform transition-transform duration-300 ease-out
          ${aberto ? "translate-y-0" : "translate-y-full"}
        `}
      >
        {/* A mesma rolagem discreta do painel do desktop. No celular a
            barra quase não é desenhada, mas a folha também abre em
            tablet — e ali ela aparece. */}
        <div className="bg-glass-bg backdrop-blur-xl border-t border-glass-border rounded-t-lg max-h-[70vh] overflow-y-auto rolagem-suave">
          {/* Handle bar */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header com abas. No celular a lista importa mais que no
              desktop: não há como passar o mouse sobre um pino para saber
              o que ele é, então o mapa sozinho não diz nada em texto. */}
          <div className="flex items-center gap-1 px-2 pb-1 border-b border-glass-border">
            {(
              [
                ["camadas", "Camadas e filtros"],
                ["lista", `Ocorrências (${ocorrenciasNaVista.length})`],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`px-2.5 py-1.5 text-[13px] font-semibold rounded-sm transition-colors ${
                  aba === id ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                {rotulo}
              </button>
            ))}
            <button
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              className="ml-auto p-1 rounded-sm hover:bg-muted transition-colors"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className={`px-2 py-2 ${aba === "lista" ? "" : "hidden"}`}>
            <p className="text-[11px] text-muted-foreground px-2 pb-2">
              Ocorrências dentro do enquadramento. Mova o mapa para mudar a lista.
            </p>
            <ListaOcorrencias
              ocorrencias={ocorrenciasNaVista}
              totalNoFiltro={totalDeOcorrencias}
              onIr={(o) => {
                // Fecha junto: a folha cobre a metade de baixo da tela,
                // e o ponto para onde o mapa acabou de ir ficaria embaixo
                // dela.
                onIrParaOcorrencia(o);
                setAberto(false);
              }}
            />
          </div>

          <div className={`px-4 pb-6 pt-3 space-y-4 ${aba === "camadas" ? "" : "hidden"}`}>
            {/* Camadas */}
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
                      className="flex items-center gap-2.5 w-full text-left px-2 py-1.5 rounded-sm hover:bg-muted/50 transition-colors"
                    >
                      <IconeBadge
                        slug={p.icone}
                        cor={p.cor}
                        tamanho={24}
                        className={ligada ? "" : "opacity-35 saturate-0"}
                      />
                      <span
                        className={`text-sm flex-1 truncate ${ligada ? "" : "text-muted-foreground"}`}
                      >
                        {p.nome}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground shrink-0 min-w-[1.5rem] text-right">
                        {contagens[p.codigo] ?? 0}
                      </span>
                      <span
                        className="w-8 h-5 rounded-full relative transition-colors shrink-0"
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
                    </button>
                  );
                })}
                {(
                  [
                    ["escolas", "Escolas", "escola", COR_ESCOLA],
                    ["ocorrencias", "Ocorrências", null, null],
                  ] as ["escolas" | "ocorrencias", string, string | null, string | null][]
                ).map(([key, label, slug, cor]) => (
                  <button
                    key={key}
                    onClick={() => onToggleCamada(key)}
                    className="flex items-center gap-2.5 w-full text-left px-2 py-1.5 rounded-sm hover:bg-muted/50 transition-colors"
                  >
                    <IconeBadge
                      slug={slug}
                      cor={cor}
                      tamanho={24}
                      className={camadas[key] ? "" : "opacity-35 saturate-0"}
                    />
                    <span
                      className={`text-sm flex-1 ${camadas[key] ? "" : "text-muted-foreground"}`}
                    >
                      {label}
                    </span>
                    <span
                      className={`
                        w-8 h-5 rounded-full relative transition-colors shrink-0
                        ${camadas[key] ? "bg-primary" : "bg-muted"}
                      `}
                    >
                      <span
                        className={`
                          absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform
                          ${camadas[key] ? "left-3.5" : "left-0.5"}
                        `}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Filtros */}
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Filtros
              </h3>
              <div className="space-y-2.5">
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
    </>
  );
}

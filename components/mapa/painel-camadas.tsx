"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { IconeBadge, COR_ESCOLA } from "./icones";
import { ListaOcorrencias } from "./lista-ocorrencias";
import { AreaRolavel } from "@/components/ui/area-rolavel";
import type { PubObservacaoPontual } from "@/lib/database.types";

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
  /** Slug do glifo em icones.tsx — o mesmo pin que aparece no mapa. */
  icone: string | null;
  /** Protocolos de densidade viram grade; os demais, só pins. */
  forma_agregacao: string;
}

/**
 * Não há filtro de protocolo aqui, e a ausência é deliberada.
 *
 * Havia, e ele duplicava o liga-desliga das camadas: os dois recortam
 * os mesmos dados em memória, e escolher um protocolo no filtro é o
 * mesmo que desligar as camadas dos outros. Pior, os dois podiam se
 * contradizer — filtrar por RES com a camada RES desligada mostrava
 * mapa vazio, e nenhum dos dois controles explicava por quê.
 *
 * E ele desfazia o propósito dos números ao lado de cada camada, que
 * existem justamente para contar o que está desligado: filtrando por
 * um protocolo, todos os outros zeravam, e o número parava de servir
 * para decidir se vale a pena ligar a camada.
 */
export interface FiltrosState {
  municipio: string;
  escola: string;
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
  /** Feições de cada protocolo sob os filtros, com a camada ligada ou não. */
  contagens: Record<string, number>;
  /** Ocorrências dentro do enquadramento, para a aba de lista. */
  ocorrenciasNaVista: PubObservacaoPontual[];
  /** Ocorrências sob os filtros, incluindo as que estão fora da vista. */
  totalDeOcorrencias: number;
  onIrParaOcorrencia: (o: PubObservacaoPontual) => void;
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
  contagens,
  ocorrenciasNaVista,
  totalDeOcorrencias,
  onIrParaOcorrencia,
}: PainelCamadasProps) {
  const [expandido, setExpandido] = useState(true);
  const [aba, setAba] = useState<"camadas" | "lista">("camadas");

  /* Filtros fechados por padrão.

     Eram eles que faziam o painel rolar: quatro campos e um par de
     meses empurravam a lista de camadas para fora de qualquer tela de
     notebook. E o uso é desproporcional — ligar e desligar camada é o
     gesto de sempre, filtrar por município é de vez em quando. Fechados
     por padrão, o painel cabe inteiro, e a barra de rolagem deixa de
     existir na maior parte do tempo em vez de ficar bonita. */
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const ativos = [
    filtros.municipio,
    filtros.escola,
    filtros.mesInicio,
    filtros.mesFim,
  ].filter((v) => v !== "").length;

  const limparFiltros = () => {
    onChangeFiltro("municipio", "");
    onChangeFiltro("escola", "");
    onChangeFiltro("mesInicio", "");
    onChangeFiltro("mesFim", "");
  };

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
          ${expandido ? "w-80 opacity-100" : "w-0 opacity-0 pointer-events-none"}
        `}
      >
        <div className="w-80">
          {/* Duas abas no mesmo painel: o controle do mapa e o conteúdo
              que ele está mostrando. Separá-los em dois painéis exigiria
              tomar o outro lado da tela, que já tem legenda e zoom. */}
          <div className="flex border-b border-glass-border">
            {(
              [
                ["camadas", "Camadas"],
                ["lista", `Ocorrências (${ocorrenciasNaVista.length})`],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`flex-1 px-2 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  aba === id
                    ? "text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <AreaRolavel
            className={`max-h-[calc(100vh-11.5rem)] px-3 py-2 space-y-3 ${
              aba === "camadas" ? "" : "hidden"
            }`}
          >
          {/* ── CAMADAS ──────────────────────────

              Sem título de seção: a aba logo acima já diz "Camadas", e
              repetir a palavra duas vezes em vinte pixels custava uma
              linha de altura que faltava embaixo. */}
          <section>
            <div className="space-y-0.5">
              {protocolos.map((p) => {
                const ligada = camadas.protocolos[p.codigo] ?? false;
                return (
                  <button
                    key={p.codigo}
                    onClick={() => onToggleProtocolo(p.codigo)}
                    title={p.nome}
                    className="flex items-center gap-2.5 w-full text-left px-2 py-1 rounded-sm hover:bg-muted/50 transition-colors"
                  >
                    {/* O mesmo glifo do pin: o painel é a legenda do mapa. */}
                    <IconeBadge
                      slug={p.icone}
                      cor={p.cor}
                      tamanho={22}
                      className={ligada ? "" : "opacity-35 saturate-0"}
                    />
                    {/* Uma linha só, com reticências. Nome de protocolo
                        quebrado em duas linhas dobrava a altura da lista
                        e empurrava os filtros para fora da tela. */}
                    <span
                      className={`text-[13px] flex-1 truncate ${
                        ligada ? "" : "text-muted-foreground"
                      }`}
                    >
                      {p.nome}
                    </span>
                    {/* Quantas feições este protocolo tem sob os filtros.
                        Sem o número, ligar ou desligar uma camada era às
                        cegas: não dava para saber se ela traz 1 ponto ou
                        40 — nem se traz algum. */}
                    <span
                      className="text-[11px] tabular-nums text-muted-foreground shrink-0 min-w-[1.5rem] text-right"
                      title="Feições deste protocolo sob os filtros atuais"
                    >
                      {contagens[p.codigo] ?? 0}
                    </span>
                    <span
                      className="w-7 h-4 rounded-full relative transition-colors shrink-0"
                      style={{
                        backgroundColor: ligada
                          ? p.cor ?? "var(--color-primary)"
                          : "var(--color-muted)",
                      }}
                    >
                      <span
                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                          ligada ? "left-3.5" : "left-0.5"
                        }`}
                      />
                    </span>
                  </button>
                );
              })}

              <div className="pt-1 mt-1 border-t border-glass-border space-y-0.5">
                {/* A cor acompanha o pino do mapa: o painel é a legenda
                    dele, e um disco de cor diferente do pino mentiria. */}
                {(
                  [
                    ["escolas", "Escolas", "escola", COR_ESCOLA],
                    ["ocorrencias", "Ocorrências", null, null],
                  ] as const
                ).map(([key, label, slug, cor]) => (
                  <button
                    key={key}
                    onClick={() => onToggleCamada(key)}
                    className="flex items-center gap-2.5 w-full text-left px-2 py-1 rounded-sm hover:bg-muted/50 transition-colors"
                  >
                    <IconeBadge
                      slug={slug}
                      cor={cor}
                      tamanho={22}
                      className={camadas[key] ? "" : "opacity-35 saturate-0"}
                    />
                    <span
                      className={`text-[13px] flex-1 truncate ${
                        camadas[key] ? "" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                    <span
                      className={`w-7 h-4 rounded-full relative transition-colors shrink-0 ${
                        camadas[key] ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                          camadas[key] ? "left-3.5" : "left-0.5"
                        }`}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── FILTROS ────────────────────────── */}
          <section>
            {/* O cabeçalho vira botão, e leva o número de filtros ativos.
                Fechada, a seção precisa dizer se está fazendo alguma
                coisa — senão o professor vê o mapa com menos pontos do
                que esperava e não tem onde procurar o porquê. */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFiltrosAbertos((v) => !v)}
                aria-expanded={filtrosAbertos}
                className="flex items-center gap-1.5 flex-1 min-w-0 text-left py-1 rounded-sm hover:bg-muted/50 transition-colors"
              >
                <SlidersHorizontal size={13} className="shrink-0 text-muted-foreground" />
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Filtros
                </span>
                {ativos > 0 && (
                  <span className="px-1.5 py-px text-[10px] font-bold tabular-nums rounded-full bg-primary text-primary-foreground shrink-0">
                    {ativos}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`ml-auto shrink-0 text-muted-foreground transition-transform ${
                    filtrosAbertos ? "rotate-180" : ""
                  }`}
                />
              </button>

              {ativos > 0 && (
                <button
                  onClick={limparFiltros}
                  title="Limpar todos os filtros"
                  className="shrink-0 p-1 rounded-sm text-muted-foreground hover:text-destructive hover:bg-muted/50 transition-colors"
                  aria-label="Limpar todos os filtros"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className={`space-y-1.5 pt-1.5 ${filtrosAbertos ? "" : "hidden"}`}>
              {/* Município */}
              <div>
                <label className="text-[11px] text-muted-foreground">Município</label>
                <select
                  value={filtros.municipio}
                  onChange={(e) => onChangeFiltro("municipio", e.target.value)}
                  className="mt-0.5 w-full bg-card border border-border rounded-sm text-[13px] px-2 py-1"
                >
                  <option value="">Todos</option>
                  {municipios.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Escola */}
              <div>
                <label className="text-[11px] text-muted-foreground">Escola</label>
                <select
                  value={filtros.escola}
                  onChange={(e) => onChangeFiltro("escola", e.target.value)}
                  className="mt-0.5 w-full bg-card border border-border rounded-sm text-[13px] px-2 py-1"
                >
                  <option value="">Todas</option>
                  {escolas.map((e) => (
                    <option key={e.slug} value={e.slug}>{e.nome}</option>
                  ))}
                </select>
              </div>

              {/* Não há filtro de protocolo: quem faz esse recorte são
                  os liga-desliga acima, que já estão à mão e mostram
                  quantas feições cada um traz. */}

              {/* Período. "De" e "Até" ficam lado a lado dentro da
                  grade, então os dois rótulos dividem uma linha só —
                  juntá-los sob um "Período" não economizaria altura
                  nenhuma, e custaria a clareza de dizer qual é qual. */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">De</label>
                  <input
                    type="month"
                    value={filtros.mesInicio}
                    onChange={(e) => onChangeFiltro("mesInicio", e.target.value)}
                    className="mt-0.5 w-full bg-card border border-border rounded-sm text-[13px] px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Até</label>
                  <input
                    type="month"
                    value={filtros.mesFim}
                    onChange={(e) => onChangeFiltro("mesFim", e.target.value)}
                    className="mt-0.5 w-full bg-card border border-border rounded-sm text-[13px] px-2 py-1"
                  />
                </div>
              </div>
            </div>
          </section>
          </AreaRolavel>

          <AreaRolavel
            className={`max-h-[calc(100vh-11.5rem)] px-2 py-2 ${aba === "lista" ? "" : "hidden"}`}
          >
            <p className="text-[11px] text-muted-foreground px-2 pb-2">
              Ocorrências dentro do enquadramento. Mova o mapa para mudar a lista.
            </p>
            <ListaOcorrencias
              ocorrencias={ocorrenciasNaVista}
              totalNoFiltro={totalDeOcorrencias}
              onIr={onIrParaOcorrencia}
            />
          </AreaRolavel>
        </div>
      </div>
    </div>
  );
}

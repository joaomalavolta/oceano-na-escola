/**
 * Mock inline para o mapa público.
 *
 * Praias reais de Itanhaém. Coordenadas aproximadas.
 * Tipado a partir de Database["public"]["Views"] em lib/database.types.ts.
 *
 * Substituir por chamada ao Supabase depois: trocar apenas a fonte,
 * a tipagem já bate.
 */

import type {
  PubEscola,
  PubObservacaoGrade,
  PubIndicadorEscola,
  IndicadoresGerais,
} from "./database.types";

// ── Helpers para gerar quadrado de 100 m ─────────────────────────────

/** Graus por metro na latitude de Itanhaém (~24°S) */
const DEG_LAT_PER_M = 1 / 111_320;
const DEG_LNG_PER_M = 1 / (111_320 * Math.cos((-24.18 * Math.PI) / 180));

function celula100m(centerLat: number, centerLng: number): string {
  const halfLat = (50 * DEG_LAT_PER_M);
  const halfLng = (50 * DEG_LNG_PER_M);
  const coords = [
    [centerLng - halfLng, centerLat - halfLat],
    [centerLng + halfLng, centerLat - halfLat],
    [centerLng + halfLng, centerLat + halfLat],
    [centerLng - halfLng, centerLat + halfLat],
    [centerLng - halfLng, centerLat - halfLat],
  ];
  return JSON.stringify({
    type: "Polygon",
    coordinates: [coords],
  });
}

// ── Escolas ──────────────────────────────────────────────────────────

export const mockEscolas: PubEscola[] = [
  {
    id: 1,
    slug: "em-mapa-verde",
    nome: "E.M. Mapa Verde",
    apresentacao: "Escola fictícia de demonstração. Monitora um trecho de praia aberta.",
    municipio: "Itanhaém",
    uf: "SP",
    lat: -24.1875,
    lng: -46.8015,
  },
  {
    id: 2,
    slug: "em-mare-cheia",
    nome: "E.M. Maré Cheia",
    apresentacao: "Escola fictícia de demonstração. Monitora um trecho de praia com saídas quinzenais.",
    municipio: "Itanhaém",
    uf: "SP",
    lat: -24.1735,
    lng: -46.7645,
  },
  {
    id: 3,
    slug: "ee-costa-viva",
    nome: "E.E. Costa Viva",
    apresentacao: "Escola fictícia de demonstração. Monitora praia central e foz de rio.",
    municipio: "Itanhaém",
    uf: "SP",
    lat: -24.1830,
    lng: -46.7885,
  },
  {
    id: 4,
    slug: "em-duna-alta",
    nome: "E.M. Duna Alta",
    apresentacao: "Escola fictícia de demonstração. Monitora resíduos e microplásticos.",
    municipio: "Itanhaém",
    uf: "SP",
    lat: -24.2005,
    lng: -46.8220,
  },
];

// ── Células de grade (100 m) ─────────────────────────────────────────

export const mockGrade: PubObservacaoGrade[] = [
  // Praia do Sonho — 4 células
  {
    celula_geojson: celula100m(-24.1890, -46.8010),
    escola_slug: "em-mapa-verde",
    protocolo: "RES",
    mes: "2026-05-01",
    unidades_amostrais: 3,
    total_itens: 142,
    area_amostrada_m2: 500,
    densidade_itens_m2: 0.284,
  },
  {
    celula_geojson: celula100m(-24.1895, -46.7998),
    escola_slug: "em-mapa-verde",
    protocolo: "RES",
    mes: "2026-05-01",
    unidades_amostrais: 3,
    total_itens: 87,
    area_amostrada_m2: 500,
    densidade_itens_m2: 0.174,
  },
  {
    celula_geojson: celula100m(-24.1888, -46.8022),
    escola_slug: "em-mapa-verde",
    protocolo: "RES",
    mes: "2026-06-01",
    unidades_amostrais: 3,
    total_itens: 203,
    area_amostrada_m2: 500,
    densidade_itens_m2: 0.406,
  },
  {
    celula_geojson: celula100m(-24.1892, -46.8034),
    escola_slug: "em-mapa-verde",
    protocolo: "MIC",
    mes: "2026-06-01",
    unidades_amostrais: 3,
    total_itens: 312,
    area_amostrada_m2: 1.25,
    densidade_itens_m2: 249.6,
  },
  // Praia do Suarão — 3 células
  {
    celula_geojson: celula100m(-24.1750, -46.7640),
    escola_slug: "em-mare-cheia",
    protocolo: "RES",
    mes: "2026-04-01",
    unidades_amostrais: 3,
    total_itens: 56,
    area_amostrada_m2: 500,
    densidade_itens_m2: 0.112,
  },
  {
    celula_geojson: celula100m(-24.1755, -46.7628),
    escola_slug: "em-mare-cheia",
    protocolo: "RES",
    mes: "2026-04-01",
    unidades_amostrais: 3,
    total_itens: 98,
    area_amostrada_m2: 500,
    densidade_itens_m2: 0.196,
  },
  {
    celula_geojson: celula100m(-24.1748, -46.7652),
    escola_slug: "em-mare-cheia",
    protocolo: "RES",
    mes: "2026-05-01",
    unidades_amostrais: 3,
    total_itens: 175,
    area_amostrada_m2: 500,
    densidade_itens_m2: 0.350,
  },
  // Praia do Centro — 3 células
  {
    celula_geojson: celula100m(-24.1835, -46.7880),
    escola_slug: "ee-costa-viva",
    protocolo: "RES",
    mes: "2026-05-01",
    unidades_amostrais: 3,
    total_itens: 221,
    area_amostrada_m2: 500,
    densidade_itens_m2: 0.442,
  },
  {
    celula_geojson: celula100m(-24.1840, -46.7868),
    escola_slug: "ee-costa-viva",
    protocolo: "RES",
    mes: "2026-05-01",
    unidades_amostrais: 3,
    total_itens: 134,
    area_amostrada_m2: 500,
    densidade_itens_m2: 0.268,
  },
  {
    celula_geojson: celula100m(-24.1838, -46.7892),
    escola_slug: "ee-costa-viva",
    protocolo: "MIC",
    mes: "2026-06-01",
    unidades_amostrais: 3,
    total_itens: 189,
    area_amostrada_m2: 1.25,
    densidade_itens_m2: 151.2,
  },
  // Praia do Cibratel — 2 células
  {
    celula_geojson: celula100m(-24.2010, -46.8215),
    escola_slug: "em-duna-alta",
    protocolo: "RES",
    mes: "2026-06-01",
    unidades_amostrais: 3,
    total_itens: 68,
    area_amostrada_m2: 500,
    densidade_itens_m2: 0.136,
  },
  {
    celula_geojson: celula100m(-24.2015, -46.8228),
    escola_slug: "em-duna-alta",
    protocolo: "RES",
    mes: "2026-06-01",
    unidades_amostrais: 3,
    total_itens: 45,
    area_amostrada_m2: 500,
    densidade_itens_m2: 0.090,
  },
];

// ── Indicadores por escola ──────────────────────────────────────────

export const mockIndicadoresEscola: PubIndicadorEscola[] = [
  {
    escola_slug: "em-mapa-verde",
    expedicoes: 4,
    extensao_total_m: 800,
    itens_catalogados: 744,
    registros_pontuais: 12,
  },
  {
    escola_slug: "em-mare-cheia",
    expedicoes: 3,
    extensao_total_m: 600,
    itens_catalogados: 329,
    registros_pontuais: 5,
  },
  {
    escola_slug: "ee-costa-viva",
    expedicoes: 3,
    extensao_total_m: 450,
    itens_catalogados: 544,
    registros_pontuais: 8,
  },
  {
    escola_slug: "em-duna-alta",
    expedicoes: 2,
    extensao_total_m: 400,
    itens_catalogados: 113,
    registros_pontuais: 3,
  },
];

// ── Indicadores gerais (rodapé) ─────────────────────────────────────

export const mockIndicadoresGerais: IndicadoresGerais = {
  escolas: mockEscolas.length,
  expedicoes: mockIndicadoresEscola.reduce((s, e) => s + e.expedicoes, 0),
  observacoes: mockGrade.length,
  km_monitorados: Number(
    (mockIndicadoresEscola.reduce((s, e) => s + e.extensao_total_m, 0) / 1000).toFixed(1)
  ),
  itens_catalogados: mockIndicadoresEscola.reduce(
    (s, e) => s + e.itens_catalogados,
    0
  ),
};

// ── Escalas de densidade ────────────────────────────────────────────
//
// Cada protocolo tem a sua. Resíduos conta item por trecho de 100 m²;
// microplástico conta partícula por quadrat de 0,25 m². As densidades
// resultantes diferem em três ordens de grandeza — no piloto, 0,09 a
// 0,44 itens/m² no resíduo contra 152 e 248 no microplástico. Uma
// escala só achatava todo o microplástico na faixa máxima, e a legenda
// anunciava "> 0,5" para uma célula de 248.
//
// A rampa de cor é a mesma nos dois: ela significa "pouco a muito
// dentro deste protocolo", nunca uma comparação entre protocolos.

export interface FaixaDensidade {
  /** Limite superior, exclusivo. Infinity na última faixa. */
  max: number;
  label: string;
  /** Variável CSS, para a legenda. */
  cor: string;
  /** Hex literal, porque MapLibre não resolve variável CSS. */
  hex: string;
}

const RAMPA = [
  { cor: "var(--color-density-1)", hex: "#b4d7d5" },
  { cor: "var(--color-density-2)", hex: "#7bbcb4" },
  { cor: "var(--color-density-3)", hex: "#4a9e8f" },
  { cor: "var(--color-density-4)", hex: "#2d7d72" },
  { cor: "var(--color-density-5)", hex: "#1a5c55" },
] as const;

function faixas(limites: [number, string][]): FaixaDensidade[] {
  return limites.map(([max, label], i) => ({ max, label, ...RAMPA[i] }));
}

export const ESCALAS_DENSIDADE: Record<string, FaixaDensidade[]> = {
  // Resíduos costeiros — trecho de 50 m por 2 m
  RES: faixas([
    [0.1, "< 0,1"],
    [0.2, "0,1 – 0,2"],
    [0.3, "0,2 – 0,3"],
    [0.5, "0,3 – 0,5"],
    [Infinity, "> 0,5"],
  ]),
  // Microplásticos — quadrat de 0,25 m²
  MIC: faixas([
    [50, "< 50"],
    [100, "50 – 100"],
    [200, "100 – 200"],
    [400, "200 – 400"],
    [Infinity, "> 400"],
  ]),
};

export const PROTOCOLO_PADRAO = "RES";

export function escalaDe(protocolo: string): FaixaDensidade[] {
  return ESCALAS_DENSIDADE[protocolo] ?? ESCALAS_DENSIDADE[PROTOCOLO_PADRAO];
}

function faixaDe(d: number | null, protocolo: string): FaixaDensidade {
  const escala = escalaDe(protocolo);
  if (d === null || d <= 0) return escala[0];
  return escala.find((f) => d < f.max) ?? escala[escala.length - 1];
}

/** Cor CSS da densidade, dentro da escala do protocolo. */
export function corDensidade(d: number | null, protocolo = PROTOCOLO_PADRAO): string {
  return faixaDe(d, protocolo).cor;
}

/** Hex da densidade, para pintar a célula no MapLibre. */
export function hexDensidade(d: number | null, protocolo = PROTOCOLO_PADRAO): string {
  return faixaDe(d, protocolo).hex;
}

/** Nomes amigáveis dos meses em pt-BR */
export function formatarMes(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** Lista de municípios distintos nos dados */
export function municipiosDisponiveis(): string[] {
  return [...new Set(mockEscolas.map((e) => e.municipio))];
}

/** Lista de protocolos distintos nos dados */
export function protocolosDisponiveis(): string[] {
  return [...new Set(mockGrade.map((g) => g.protocolo))];
}

/** Lista de meses distintos nos dados */
export function mesesDisponiveis(): string[] {
  return [...new Set(mockGrade.map((g) => g.mes))].sort();
}

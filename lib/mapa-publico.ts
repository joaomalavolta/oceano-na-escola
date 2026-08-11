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

// ── Níveis de densidade para a legenda (protocolo RES) ──────────────

export const NIVEIS_DENSIDADE = [
  { min: 0, max: 0.1, label: "< 0,1", cor: "var(--color-density-1)" },
  { min: 0.1, max: 0.2, label: "0,1 – 0,2", cor: "var(--color-density-2)" },
  { min: 0.2, max: 0.3, label: "0,2 – 0,3", cor: "var(--color-density-3)" },
  { min: 0.3, max: 0.5, label: "0,3 – 0,5", cor: "var(--color-density-4)" },
  { min: 0.5, max: Infinity, label: "> 0,5", cor: "var(--color-density-5)" },
] as const;

/** Retorna a cor CSS para uma dada densidade em itens/m² */
export function corDensidade(d: number | null): string {
  if (d === null || d === 0) return "var(--color-density-1)";
  for (const nivel of NIVEIS_DENSIDADE) {
    if (d < nivel.max) return nivel.cor;
  }
  return NIVEIS_DENSIDADE[NIVEIS_DENSIDADE.length - 1].cor;
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

/**
 * Fonte de dados do mapa público.
 *
 * Lê as views `pub_*` do Supabase com a chave anônima. Essas views são
 * security definer de propósito: o visitante sem login não tem grant em
 * nenhuma tabela base, e alcança só o que elas expõem.
 *
 * Se as variáveis de ambiente não estiverem configuradas, ou se a
 * consulta falhar, cai no repositório de mock e diz qual origem usou.
 * A página nunca fica em branco por causa de configuração ausente.
 */

import { supabase, supabaseConfigurado } from "./supabase";
import type {
  PubEscola,
  PubObservacaoGrade,
  PubIndicadorEscola,
  PubProtocolo,
  PubObservacaoPontual,
  IndicadoresGerais,
} from "./database.types";
import {
  mockEscolas,
  mockGrade,
  mockPontuais,
  mockIndicadoresEscola,
  mockIndicadoresGerais,
} from "./mapa-publico";

export type OrigemDados = "supabase" | "mock";

export interface DadosPublicos {
  escolas: PubEscola[];
  grade: PubObservacaoGrade[];
  indicadoresEscola: PubIndicadorEscola[];
  indicadoresGerais: IndicadoresGerais;
  /** Protocolos com versão ativa. É daqui que saem as camadas do mapa. */
  protocolos: PubProtocolo[];
  /** Ocorrências ambientais, desenhadas como pin. */
  pontuais: PubObservacaoPontual[];
  origem: OrigemDados;
  /** Preenchido quando houve tentativa de ler o banco e ela falhou. */
  erro: string | null;
}

/**
 * Protocolos de reserva, para quando o mapa roda sobre o mock.
 * Espelham o catálogo do banco — os sete, não só RES e MIC: as camadas
 * nascem desta lista, e protocolo ausente aqui deixaria o pin do mock
 * invisível até o Supabase responder.
 */
export const PROTOCOLOS_INICIAIS: PubProtocolo[] = [
  {
    id: 1, codigo: "RES", nome: "Resíduos costeiros e marinhos", descricao: null,
    icone: "residuos", cor: "#2d7d72", unidade_medida: "itens/m²", forma_agregacao: "densidade",
  },
  {
    id: 2, codigo: "MIC", nome: "Microplásticos", descricao: null,
    icone: "microplasticos", cor: "#7c5cbf", unidade_medida: "itens/m²", forma_agregacao: "densidade",
  },
  {
    id: 3, codigo: "RST", nome: "Restinga e vegetação costeira", descricao: null,
    icone: "restinga", cor: "#4a7c2d", unidade_medida: "m²", forma_agregacao: "area_afetada",
  },
  {
    id: 4, codigo: "ESG", nome: "Esgoto e drenagem", descricao: null,
    icone: "esgoto", cor: "#8a5a2b", unidade_medida: "pontos", forma_agregacao: "ocorrencia",
  },
  {
    id: 5, codigo: "DES", nome: "Descarte irregular", descricao: null,
    icone: "descarte", cor: "#a63d40", unidade_medida: "pontos", forma_agregacao: "ocorrencia",
  },
  {
    id: 6, codigo: "AVI", nome: "Avifauna e fauna costeira", descricao: null,
    icone: "avifauna", cor: "#2f6f9f", unidade_medida: "indivíduos", forma_agregacao: "ocorrencia",
  },
  {
    id: 7, codigo: "AGU", nome: "Qualidade da água", descricao: null,
    icone: "agua", cor: "#1f8a9e", unidade_medida: "valor medido", forma_agregacao: "medida",
  },
];

/**
 * PostgREST serializa `numeric` como string, para não perder precisão.
 * `total_itens` chega como "132" e `area_amostrada_m2` como "300.0000".
 * Sem esta coerção, somar dois indicadores concatena em vez de somar.
 */
function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOuNulo(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Ordem das camadas no painel do mapa.
 *
 * Ordenar por código deixava os dois protocolos de densidade — os que
 * pintam a grade e são descritos pela legenda — no meio da lista, entre
 * ocorrências, porque MIC e RES caem no meio do alfabeto. Densidade
 * primeiro faz o painel acompanhar o que o mapa desenha: primeiro as
 * manchas, depois os pinos, e a medida por último.
 */
const PESO_DA_FORMA: Record<string, number> = {
  densidade: 0,
  area_afetada: 1,
  ocorrencia: 2,
  medida: 3,
};

function ordemDeCamada(a: PubProtocolo, b: PubProtocolo): number {
  const pa = PESO_DA_FORMA[a.forma_agregacao] ?? 9;
  const pb = PESO_DA_FORMA[b.forma_agregacao] ?? 9;
  return pa !== pb ? pa - pb : a.codigo.localeCompare(b.codigo);
}

function agregarGerais(
  escolas: PubEscola[],
  grade: PubObservacaoGrade[],
  porEscola: PubIndicadorEscola[]
): IndicadoresGerais {
  const extensaoTotal = porEscola.reduce((s, e) => s + e.extensao_total_m, 0);
  return {
    escolas: escolas.length,
    expedicoes: porEscola.reduce((s, e) => s + e.expedicoes, 0),
    observacoes: grade.length,
    km_monitorados: Number((extensaoTotal / 1000).toFixed(1)),
    itens_catalogados: porEscola.reduce((s, e) => s + e.itens_catalogados, 0),
  };
}

const DADOS_MOCK: DadosPublicos = {
  escolas: mockEscolas,
  grade: mockGrade,
  indicadoresEscola: mockIndicadoresEscola,
  indicadoresGerais: mockIndicadoresGerais,
  protocolos: PROTOCOLOS_INICIAIS,
  pontuais: mockPontuais,
  origem: "mock",
  erro: null,
};

export async function carregarDadosPublicos(): Promise<DadosPublicos> {
  if (!supabaseConfigurado) return DADOS_MOCK;

  try {
    const [escolasRes, gradeRes, indicadoresRes, protocolosRes, pontuaisRes] = await Promise.all([
      supabase.from("pub_escola").select("*").order("nome"),
      supabase.from("pub_observacao_grade").select("*"),
      supabase.from("pub_indicador_escola").select("*"),
      supabase.from("pub_protocolo").select("*").order("codigo"),
      supabase.from("pub_observacao_pontual").select("*"),
    ]);

    const falha =
      escolasRes.error ?? gradeRes.error ?? indicadoresRes.error ??
      protocolosRes.error ?? pontuaisRes.error;
    if (falha) return { ...DADOS_MOCK, erro: falha.message };

    const escolas: PubEscola[] = (escolasRes.data ?? []).map((e) => ({
      id: num(e.id),
      slug: String(e.slug),
      nome: String(e.nome),
      apresentacao: e.apresentacao ?? null,
      municipio: String(e.municipio),
      uf: String(e.uf),
      lat: num(e.lat),
      lng: num(e.lng),
    }));

    const grade: PubObservacaoGrade[] = (gradeRes.data ?? []).map((g) => ({
      celula_geojson: String(g.celula_geojson),
      escola_slug: String(g.escola_slug),
      protocolo: String(g.protocolo),
      mes: String(g.mes),
      unidades_amostrais: num(g.unidades_amostrais),
      total_itens: num(g.total_itens),
      area_amostrada_m2: num(g.area_amostrada_m2),
      densidade_itens_m2: numOuNulo(g.densidade_itens_m2),
    }));

    const indicadoresEscola: PubIndicadorEscola[] = (indicadoresRes.data ?? []).map((i) => ({
      escola_slug: String(i.escola_slug),
      expedicoes: num(i.expedicoes),
      extensao_total_m: num(i.extensao_total_m),
      itens_catalogados: num(i.itens_catalogados),
      registros_pontuais: num(i.registros_pontuais),
    }));

    const protocolos: PubProtocolo[] = (protocolosRes.data ?? [])
      .map((p) => ({
        id: num(p.id),
        codigo: String(p.codigo),
        nome: String(p.nome),
        descricao: p.descricao ?? null,
        icone: p.icone ?? null,
        cor: p.cor ?? null,
        unidade_medida: p.unidade_medida ?? null,
        forma_agregacao: String(p.forma_agregacao),
      }))
      .sort(ordemDeCamada);

    const pontuais: PubObservacaoPontual[] = (pontuaisRes.data ?? []).map((o) => ({
      id: num(o.id),
      escola_slug: String(o.escola_slug),
      escola_nome: String(o.escola_nome),
      protocolo: String(o.protocolo),
      protocolo_nome: String(o.protocolo_nome),
      protocolo_icone: o.protocolo_icone ?? null,
      protocolo_cor: o.protocolo_cor ?? null,
      item_codigo: o.item_codigo ?? null,
      item_nome: o.item_nome ?? null,
      item_grupo: o.item_grupo ?? null,
      item_icone: o.item_icone ?? null,
      item_unidade: o.item_unidade ?? null,
      valor: numOuNulo(o.valor),
      descricao: String(o.descricao),
      origem_provavel: o.origem_provavel ?? null,
      expedicao_numero: num(o.expedicao_numero),
      data_campo: String(o.data_campo),
      ponto_geojson: String(o.ponto_geojson),
    }));

    // Banco alcançável mas ainda sem piloto publicado: o mock é a
    // demonstração, e uma tela vazia não diria isso a ninguém.
    if (escolas.length === 0) return DADOS_MOCK;

    return {
      escolas,
      grade,
      indicadoresEscola,
      indicadoresGerais: agregarGerais(escolas, grade, indicadoresEscola),
      protocolos: protocolos.length > 0 ? protocolos : PROTOCOLOS_INICIAIS,
      pontuais,
      origem: "supabase",
      erro: null,
    };
  } catch (e) {
    return { ...DADOS_MOCK, erro: e instanceof Error ? e.message : String(e) };
  }
}

// ── Derivações usadas pelos filtros ──────────────────────────────────

export function municipiosDe(escolas: PubEscola[]): string[] {
  return [...new Set(escolas.map((e) => e.municipio))].sort();
}

export function protocolosDe(grade: PubObservacaoGrade[]): string[] {
  return [...new Set(grade.map((g) => g.protocolo))].sort();
}

export function mesesDe(grade: PubObservacaoGrade[]): string[] {
  return [...new Set(grade.map((g) => g.mes))].sort();
}

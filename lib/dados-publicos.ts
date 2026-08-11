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
  IndicadoresGerais,
} from "./database.types";
import {
  mockEscolas,
  mockGrade,
  mockIndicadoresEscola,
  mockIndicadoresGerais,
} from "./mapa-publico";

export type OrigemDados = "supabase" | "mock";

export interface DadosPublicos {
  escolas: PubEscola[];
  grade: PubObservacaoGrade[];
  indicadoresEscola: PubIndicadorEscola[];
  indicadoresGerais: IndicadoresGerais;
  origem: OrigemDados;
  /** Preenchido quando houve tentativa de ler o banco e ela falhou. */
  erro: string | null;
}

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
  origem: "mock",
  erro: null,
};

export async function carregarDadosPublicos(): Promise<DadosPublicos> {
  if (!supabaseConfigurado) return DADOS_MOCK;

  try {
    const [escolasRes, gradeRes, indicadoresRes] = await Promise.all([
      supabase.from("pub_escola").select("*").order("nome"),
      supabase.from("pub_observacao_grade").select("*"),
      supabase.from("pub_indicador_escola").select("*"),
    ]);

    const falha = escolasRes.error ?? gradeRes.error ?? indicadoresRes.error;
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

    // Banco alcançável mas ainda sem piloto publicado: o mock é a
    // demonstração, e uma tela vazia não diria isso a ninguém.
    if (escolas.length === 0) return DADOS_MOCK;

    return {
      escolas,
      grade,
      indicadoresEscola,
      indicadoresGerais: agregarGerais(escolas, grade, indicadoresEscola),
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

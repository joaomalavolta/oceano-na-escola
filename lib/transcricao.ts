/**
 * Transcrição da ficha de campo.
 *
 * O formulário não é escrito em código: ele nasce de protocolo_secao,
 * protocolo_campo e protocolo_item. É a premissa central do projeto — a
 * ficha é o schema, e a mesma definição gera o formulário web e o PDF
 * impresso. Protocolo novo aparece aqui sem uma linha de React.
 */

import { supabase } from "./supabase";

export interface EquipeFicha {
  id: number;
  identificacao: string;
}

export interface ExpedicaoFicha {
  id: number;
  numero: number;
  titulo: string | null;
  data_campo: string;
  status: string;
  escola_id: number;
  escola_nome: string;
  turmas: string[];
  equipes: EquipeFicha[];
}

export interface CampoProtocolo {
  id: number;
  codigo: string;
  rotulo: string;
  tipo: string;
  unidade: string | null;
  obrigatorio: boolean;
  opcoes: string[] | null;
  ordem: number;
}

export interface SecaoProtocolo {
  id: number;
  codigo: string;
  nome: string;
  ordem: number;
  campos: CampoProtocolo[];
}

export interface ItemProtocolo {
  id: number;
  codigo: string;
  nome: string;
  grupo: string;
  ordem: number;
}

export interface DefinicaoProtocolo {
  versao_id: number;
  codigo: string;
  nome: string;
  versao: string;
  secoes: SecaoProtocolo[];
  itens: ItemProtocolo[];
}

/** Uma unidade amostral por equipe, com o que foi contado nela. */
export interface UnidadeFicha {
  id: number | null;
  equipe_id: number;
  /** Valores da seção de esforço, por código de campo. */
  esforco: Record<string, string>;
  /** Quantidade por item de lista. */
  porItem: Record<number, number>;
  /** Quantidade por campo de ficha (microplásticos). */
  porCampo: Record<number, number>;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function primeiro<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function carregarExpedicaoFicha(id: number): Promise<ExpedicaoFicha | null> {
  const { data, error } = await supabase
    .from("expedicao")
    .select(
      "id, numero, titulo, data_campo, status, escola_id, escola:escola_id (nome), equipe (id, identificacao), expedicao_turma (turma:turma_id (nome))"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  type TurmaEmbed = { turma: { nome: string } | { nome: string }[] | null };

  return {
    id: num(data.id),
    numero: num(data.numero),
    titulo: data.titulo ?? null,
    data_campo: String(data.data_campo),
    status: String(data.status),
    escola_id: num(data.escola_id),
    escola_nome: primeiro(data.escola as { nome: string } | { nome: string }[])?.nome ?? "",
    turmas: ((data.expedicao_turma ?? []) as TurmaEmbed[])
      .map((et) => primeiro(et.turma)?.nome)
      .filter((n): n is string => Boolean(n)),
    equipes: ((data.equipe ?? []) as { id: number; identificacao: string }[])
      .map((e) => ({ id: num(e.id), identificacao: String(e.identificacao) }))
      .sort((a, b) => a.identificacao.localeCompare(b.identificacao)),
  };
}

export async function carregarDefinicaoProtocolo(
  versaoId: number
): Promise<DefinicaoProtocolo | null> {
  const [versaoRes, secoesRes, itensRes] = await Promise.all([
    supabase
      .from("protocolo_versao")
      .select("id, versao, protocolo:protocolo_id (codigo, nome)")
      .eq("id", versaoId)
      .maybeSingle(),
    supabase
      .from("protocolo_secao")
      .select("id, codigo, nome, ordem, protocolo_campo (id, codigo, rotulo, tipo, unidade, obrigatorio, opcoes, ordem)")
      .eq("versao_id", versaoId)
      .order("ordem"),
    supabase
      .from("protocolo_item")
      .select("id, codigo, nome, grupo, ordem")
      .eq("versao_id", versaoId)
      .order("ordem"),
  ]);

  if (versaoRes.error || !versaoRes.data) return null;
  const p = primeiro(versaoRes.data.protocolo as { codigo: string; nome: string } | { codigo: string; nome: string }[]);

  type CampoBruto = {
    id: number; codigo: string; rotulo: string; tipo: string;
    unidade: string | null; obrigatorio: boolean; opcoes: unknown; ordem: number;
  };

  const secoes: SecaoProtocolo[] = (secoesRes.data ?? []).map((s) => ({
    id: num(s.id),
    codigo: String(s.codigo),
    nome: String(s.nome),
    ordem: num(s.ordem),
    campos: ((s.protocolo_campo ?? []) as CampoBruto[])
      .map((c) => ({
        id: num(c.id),
        codigo: String(c.codigo),
        rotulo: String(c.rotulo),
        tipo: String(c.tipo),
        unidade: c.unidade ?? null,
        obrigatorio: Boolean(c.obrigatorio),
        opcoes: Array.isArray(c.opcoes) ? (c.opcoes as string[]) : null,
        ordem: num(c.ordem),
      }))
      .sort((a, b) => a.ordem - b.ordem),
  }));

  return {
    versao_id: num(versaoRes.data.id),
    versao: String(versaoRes.data.versao),
    codigo: p?.codigo ?? "",
    nome: p?.nome ?? "",
    secoes,
    itens: (itensRes.data ?? []).map((i) => ({
      id: num(i.id),
      codigo: String(i.codigo),
      nome: String(i.nome),
      grupo: String(i.grupo),
      ordem: num(i.ordem),
    })),
  };
}

/**
 * Área amostrada, a partir dos campos de esforço preenchidos.
 *
 * É o cálculo mais consequente da tela: sem área, a contagem não vira
 * densidade e o dado não compara praia nem ano — está dito assim no
 * documento de protocolos. Reconhece os dois padrões definidos até aqui:
 * trecho, que é comprimento por largura, e quadrat, que é número de
 * quadrats pela área de cada um. Protocolo com outra forma de esforço
 * fica sem área, e a tela avisa em vez de inventar um número.
 */
export function calcularArea(esforco: Record<string, string>): number | null {
  const n = (codigo: string) => {
    const v = Number(String(esforco[codigo] ?? "").replace(",", "."));
    return Number.isFinite(v) && v > 0 ? v : null;
  };

  const comprimento = n("comprimento_m");
  const largura = n("largura_m");
  if (comprimento && largura) return comprimento * largura;

  const quadrats = n("n_quadrats");
  const areaQuadrat = n("area_quadrat");
  if (quadrats && areaQuadrat) return quadrats * areaQuadrat;

  return null;
}

/** Campos de esforço que têm coluna própria em unidade_amostral. */
const COLUNA_POR_CAMPO: Record<string, string> = {
  comprimento_m: "comprimento_m",
  largura_m: "largura_m",
  profundidade: "profundidade_cm",
  malha: "malha_mm",
  posicao: "posicao_praia",
  peso_kg: "peso_kg",
  distancia_m: "distancia_m",
};

export async function carregarUnidadesExistentes(
  expedicaoId: number,
  versaoId: number
): Promise<UnidadeFicha[]> {
  const { data, error } = await supabase
    .from("unidade_amostral")
    .select("id, equipe_id, metadados, observacao_contagem (item_id, campo_id, quantidade)")
    .eq("expedicao_id", expedicaoId)
    .eq("versao_id", versaoId);

  if (error || !data) return [];

  type ContagemBruta = { item_id: number | null; campo_id: number | null; quantidade: number };

  return data.map((u) => {
    const porItem: Record<number, number> = {};
    const porCampo: Record<number, number> = {};
    for (const c of (u.observacao_contagem ?? []) as ContagemBruta[]) {
      if (c.item_id !== null) porItem[num(c.item_id)] = num(c.quantidade);
      else if (c.campo_id !== null) porCampo[num(c.campo_id)] = num(c.quantidade);
    }
    const meta = (u.metadados ?? {}) as Record<string, unknown>;
    const esforco: Record<string, string> = {};
    for (const [k, v] of Object.entries(meta.esforco ?? {})) esforco[k] = String(v);

    return { id: num(u.id), equipe_id: num(u.equipe_id), esforco, porItem, porCampo };
  });
}

/**
 * Grava a ficha inteira.
 *
 * Apaga e regrava as contagens de cada unidade em vez de comparar linha
 * a linha: a ficha é digitada de uma vez, e um upsert parcial deixaria
 * contagem antiga órfã quando o professor corrige um valor para zero.
 */
export async function salvarFicha(
  expedicaoId: number,
  versaoId: number,
  tipo: string,
  unidades: UnidadeFicha[]
): Promise<{ erro: string | null }> {
  for (const u of unidades) {
    const area = calcularArea(u.esforco);

    const linha: Record<string, unknown> = {
      expedicao_id: expedicaoId,
      versao_id: versaoId,
      equipe_id: u.equipe_id,
      tipo,
      area_m2: area,
      metadados: { esforco: u.esforco, seed: null },
    };
    for (const [campo, coluna] of Object.entries(COLUNA_POR_CAMPO)) {
      const bruto = u.esforco[campo];
      if (bruto === undefined || bruto === "") continue;
      linha[coluna] =
        coluna === "posicao_praia" ? bruto : Number(String(bruto).replace(",", "."));
    }

    let unidadeId = u.id;
    if (unidadeId) {
      const { error } = await supabase.from("unidade_amostral").update(linha).eq("id", unidadeId);
      if (error) return { erro: error.message };
    } else {
      const { data, error } = await supabase
        .from("unidade_amostral")
        .insert(linha)
        .select("id")
        .single();
      if (error) return { erro: error.message };
      unidadeId = num(data.id);
    }

    const { error: erroApagar } = await supabase
      .from("observacao_contagem")
      .delete()
      .eq("unidade_id", unidadeId);
    if (erroApagar) return { erro: erroApagar.message };

    const contagens = [
      ...Object.entries(u.porItem)
        .filter(([, q]) => q > 0)
        .map(([itemId, q]) => ({ unidade_id: unidadeId, item_id: Number(itemId), quantidade: q })),
      ...Object.entries(u.porCampo)
        .filter(([, q]) => q > 0)
        .map(([campoId, q]) => ({ unidade_id: unidadeId, campo_id: Number(campoId), quantidade: q })),
    ];

    if (contagens.length > 0) {
      const { error } = await supabase.from("observacao_contagem").insert(contagens);
      if (error) return { erro: error.message };
    }
  }

  return { erro: null };
}

/** Move a expedição de rascunho para enviado, encerrando a transcrição. */
export async function enviarParaRevisao(expedicaoId: number): Promise<{ erro: string | null }> {
  const { error } = await supabase
    .from("expedicao")
    .update({ status: "enviado" })
    .eq("id", expedicaoId);
  return { erro: error?.message ?? null };
}

/**
 * Dados da área autenticada.
 *
 * Tudo aqui passa pelo RLS: as consultas não filtram por escola, porque
 * as policies já o fazem pelo vínculo do usuário. Um professor sem
 * vínculo recebe lista vazia, não erro — e não há como pedir a escola
 * de outra pessoa.
 */

import { supabase } from "./supabase";

export interface EscolaDoUsuario {
  id: number;
  nome: string;
  slug: string;
  municipio: string;
  uf: string;
}

export interface ExpedicaoResumo {
  id: number;
  numero: number;
  titulo: string | null;
  data_campo: string;
  extensao_m: number | null;
  status: string;
  escola_id: number;
  escola_nome: string | null;
  turma: string | null;
  territorio: string | null;
  n_mapeadores: number | null;
  /** Protocolos das unidades amostrais desta expedição. */
  protocolos: string[];
  total_itens: number;
}

export interface ItemContado {
  codigo: string;
  nome: string;
  grupo: string;
  quantidade: number;
}

/**
 * Densidade é sempre por protocolo, nunca agregada entre eles.
 *
 * Resíduos conta item por trecho de 100 m²; microplástico conta
 * partícula por quadrat de 0,25 m². Somar os dois numeradores sobre a
 * soma dos denominadores produz um número que não descreve nem um nem
 * outro — no piloto, 0,349 contra 0,249 do resíduo e 200 do
 * microplástico.
 */
export interface DensidadeProtocolo {
  protocolo: string;
  unidades: number;
  areaM2: number;
  itens: number;
  densidade: number | null;
}

export interface PainelEscola {
  escolas: EscolaDoUsuario[];
  expedicoes: ExpedicaoResumo[];
  totalItens: number;
  areaAmostradaM2: number;
  densidades: DensidadeProtocolo[];
  composicao: Record<string, number>;
  topItens: ItemContado[];
  erro: string | null;
}

const VAZIO: PainelEscola = {
  escolas: [],
  expedicoes: [],
  totalItens: 0,
  areaAmostradaM2: 0,
  densidades: [],
  composicao: {},
  topItens: [],
  erro: null,
};

/** PostgREST serializa numeric como string. */
function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Formato do embed do PostgREST: objeto, ou array quando a relação é ambígua. */
function primeiro<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function carregarPainel(): Promise<PainelEscola> {
  try {
    const [escolasRes, expedicoesRes, unidadesRes, contagensRes] = await Promise.all([
      supabase.from("escola").select("id, nome, slug, municipio:municipio_id (nome, uf)"),
      supabase
        .from("expedicao")
        // A string do select precisa ser literal: o supabase-js a analisa
        // no nível de tipo, e concatenação em runtime ele não lê — o
        // resultado degrada para GenericStringError.
        .select(
          "id, numero, titulo, data_campo, extensao_m, status, escola_id, n_mapeadores, escola:escola_id (nome), turma:turma_id (nome), territorio:territorio_id (nome)"
        )
        .order("data_campo", { ascending: false }),
      // Área vem daqui, uma linha por unidade. Somá-la junto da contagem
      // multiplicaria a área pelo número de linhas de contagem da unidade
      // — o mesmo defeito que a view pública tinha e que já corrigimos.
      supabase
        .from("unidade_amostral")
        .select("id, area_m2, expedicao_id, versao:versao_id ( protocolo:protocolo_id ( codigo ) )"),
      supabase
        .from("observacao_contagem")
        .select("quantidade, unidade_id, item:item_id (codigo, nome, grupo)"),
    ]);

    const falha =
      escolasRes.error ?? expedicoesRes.error ?? unidadesRes.error ?? contagensRes.error;
    if (falha) return { ...VAZIO, erro: falha.message };

    const escolas: EscolaDoUsuario[] = (escolasRes.data ?? []).map((e) => {
      const m = primeiro(e.municipio as { nome: string; uf: string } | { nome: string; uf: string }[]);
      return {
        id: num(e.id),
        nome: String(e.nome),
        slug: String(e.slug),
        municipio: m?.nome ?? "",
        uf: m?.uf ?? "",
      };
    });

    type VersaoEmbed = { protocolo: { codigo: string } | { codigo: string }[] | null };

    const unidades = (unidadesRes.data ?? []).map((u) => {
      const versao = primeiro(u.versao as VersaoEmbed | VersaoEmbed[]);
      const protocolo = primeiro(versao?.protocolo ?? null);
      return {
        id: num(u.id),
        area_m2: num(u.area_m2),
        expedicao_id: num(u.expedicao_id),
        protocolo: protocolo?.codigo ?? "—",
      };
    });

    const areaAmostradaM2 = unidades.reduce((s, u) => s + u.area_m2, 0);
    const expedicaoDaUnidade = new Map(unidades.map((u) => [u.id, u.expedicao_id]));
    const protocoloDaUnidade = new Map(unidades.map((u) => [u.id, u.protocolo]));

    // Área e unidades por protocolo. Cada unidade entra uma vez só.
    const porProtocolo = new Map<string, DensidadeProtocolo>();
    for (const u of unidades) {
      const atual = porProtocolo.get(u.protocolo) ?? {
        protocolo: u.protocolo,
        unidades: 0,
        areaM2: 0,
        itens: 0,
        densidade: null,
      };
      atual.unidades += 1;
      atual.areaM2 += u.area_m2;
      porProtocolo.set(u.protocolo, atual);
    }

    const composicao: Record<string, number> = {};
    const porItem = new Map<string, ItemContado>();
    const porExpedicao = new Map<number, number>();
    let totalItens = 0;

    for (const c of contagensRes.data ?? []) {
      const qtd = num(c.quantidade);
      totalItens += qtd;

      const expId = expedicaoDaUnidade.get(num(c.unidade_id));
      if (expId !== undefined) {
        porExpedicao.set(expId, (porExpedicao.get(expId) ?? 0) + qtd);
      }

      const proto = protocoloDaUnidade.get(num(c.unidade_id));
      const agregado = proto ? porProtocolo.get(proto) : undefined;
      if (agregado) agregado.itens += qtd;

      const item = primeiro(
        c.item as { codigo: string; nome: string; grupo: string } | { codigo: string; nome: string; grupo: string }[]
      );
      // Contagem de microplástico aponta para campo de ficha, não para
      // item de lista: entra no total, mas não na composição por material.
      if (!item) continue;

      composicao[item.grupo] = (composicao[item.grupo] ?? 0) + qtd;

      const atual = porItem.get(item.codigo);
      if (atual) atual.quantidade += qtd;
      else porItem.set(item.codigo, { ...item, quantidade: qtd });
    }

    // Protocolos por expedição, a partir das unidades amostrais dela.
    const protocolosDaExpedicao = new Map<number, Set<string>>();
    for (const u of unidades) {
      const conj = protocolosDaExpedicao.get(u.expedicao_id) ?? new Set<string>();
      if (u.protocolo !== "—") conj.add(u.protocolo);
      protocolosDaExpedicao.set(u.expedicao_id, conj);
    }

    const expedicoes: ExpedicaoResumo[] = (expedicoesRes.data ?? []).map((x) => ({
      id: num(x.id),
      numero: num(x.numero),
      titulo: x.titulo ?? null,
      data_campo: String(x.data_campo),
      extensao_m: x.extensao_m === null ? null : num(x.extensao_m),
      status: String(x.status),
      escola_id: num(x.escola_id),
      escola_nome: primeiro(x.escola as { nome: string } | { nome: string }[])?.nome ?? null,
      turma: primeiro(x.turma as { nome: string } | { nome: string }[])?.nome ?? null,
      territorio: primeiro(x.territorio as { nome: string } | { nome: string }[])?.nome ?? null,
      n_mapeadores: x.n_mapeadores === null ? null : num(x.n_mapeadores),
      protocolos: [...(protocolosDaExpedicao.get(num(x.id)) ?? [])].sort(),
      total_itens: porExpedicao.get(num(x.id)) ?? 0,
    }));

    return {
      escolas,
      expedicoes,
      totalItens,
      areaAmostradaM2,
      densidades: [...porProtocolo.values()]
        .map((d) => ({ ...d, densidade: d.areaM2 > 0 ? d.itens / d.areaM2 : null }))
        .sort((a, b) => a.protocolo.localeCompare(b.protocolo)),
      composicao,
      topItens: [...porItem.values()].sort((a, b) => b.quantidade - a.quantidade).slice(0, 5),
      erro: null,
    };
  } catch (e) {
    return { ...VAZIO, erro: e instanceof Error ? e.message : String(e) };
  }
}

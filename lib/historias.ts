/**
 * Histórias do Território.
 *
 * O recurso de educomunicação do plano de produção: mapa, texto, fotos
 * e indicadores juntos. É onde a escola responde à pergunta que o
 * documento coloca como central — não "quantos resíduos encontramos?",
 * mas "o que estes dados dizem deste território?".
 *
 * A história aponta para as expedições que narra em vez de copiar
 * números: assim ela não envelhece quando o dado é corrigido, e a
 * página pública monta mapa e indicadores a partir do que está
 * publicado no momento da leitura.
 */

import { supabase } from "./supabase";

export interface Historia {
  id: number;
  escola_id: number;
  slug: string;
  titulo: string;
  resumo: string | null;
  corpo: string;
  capa_id: number | null;
  publicada: boolean;
  publicada_em: string | null;
  expedicoes: number[];
}

export interface HistoriaPublica {
  id: number;
  slug: string;
  titulo: string;
  resumo: string | null;
  corpo: string;
  publicada_em: string | null;
  escola_slug: string;
  escola_nome: string;
  municipio: string;
  uf: string;
  capa_storage_path: string | null;
  /** Números das expedições publicadas que a história narra. */
  expedicoes: number[];
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Slug legível a partir do título, com desempate no banco. */
export function slugificar(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function listarHistoriasDaEscola(): Promise<Historia[]> {
  const { data, error } = await supabase
    .from("historia")
    .select(
      "id, escola_id, slug, titulo, resumo, corpo, capa_id, publicada, publicada_em, historia_expedicao (expedicao_id)"
    )
    .order("atualizado_em", { ascending: false });
  if (error) return [];

  return (data ?? []).map((h) => ({
    id: num(h.id),
    escola_id: num(h.escola_id),
    slug: String(h.slug),
    titulo: String(h.titulo),
    resumo: h.resumo ?? null,
    corpo: String(h.corpo ?? ""),
    capa_id: h.capa_id === null ? null : num(h.capa_id),
    publicada: Boolean(h.publicada),
    publicada_em: h.publicada_em ?? null,
    expedicoes: ((h.historia_expedicao ?? []) as { expedicao_id: number }[]).map((he) =>
      num(he.expedicao_id)
    ),
  }));
}

export async function carregarHistoria(id: number): Promise<Historia | null> {
  const { data, error } = await supabase
    .from("historia")
    .select(
      "id, escola_id, slug, titulo, resumo, corpo, capa_id, publicada, publicada_em, historia_expedicao (expedicao_id)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: num(data.id),
    escola_id: num(data.escola_id),
    slug: String(data.slug),
    titulo: String(data.titulo),
    resumo: data.resumo ?? null,
    corpo: String(data.corpo ?? ""),
    capa_id: data.capa_id === null ? null : num(data.capa_id),
    publicada: Boolean(data.publicada),
    publicada_em: data.publicada_em ?? null,
    expedicoes: ((data.historia_expedicao ?? []) as { expedicao_id: number }[]).map((he) =>
      num(he.expedicao_id)
    ),
  };
}

export async function criarHistoria(
  escolaId: number,
  titulo: string
): Promise<{ id: number | null; erro: string | null }> {
  const { data: sessao } = await supabase.auth.getUser();
  const base = slugificar(titulo) || "historia";

  // Desempata o slug na mão: a unicidade é por escola, e duas turmas
  // podem escrever sobre a mesma praia no mesmo ano.
  for (let tentativa = 0; tentativa < 20; tentativa += 1) {
    const slug = tentativa === 0 ? base : `${base}-${tentativa + 1}`;
    const { data, error } = await supabase
      .from("historia")
      .insert({
        escola_id: escolaId,
        slug,
        titulo: titulo.trim(),
        criado_por: sessao.user?.id ?? null,
      })
      .select("id")
      .single();

    if (!error) return { id: num(data.id), erro: null };
    // 23505 é violação de unicidade — só isso merece outra tentativa.
    // Qualquer outro erro repetido vinte vezes seria só demora.
    if (error.code !== "23505") return { id: null, erro: error.message };
  }
  return { id: null, erro: "Não foi possível gerar um endereço único para esta história." };
}

export async function salvarHistoria(
  id: number,
  campos: { titulo: string; resumo: string; corpo: string; capa_id: number | null }
): Promise<{ erro: string | null }> {
  const { error } = await supabase
    .from("historia")
    .update({
      titulo: campos.titulo.trim(),
      resumo: campos.resumo.trim() || null,
      corpo: campos.corpo,
      capa_id: campos.capa_id,
    })
    .eq("id", id);
  return { erro: error?.message ?? null };
}

/** Troca o conjunto de expedições narradas, apagando e regravando. */
export async function definirExpedicoes(
  historiaId: number,
  expedicaoIds: number[]
): Promise<{ erro: string | null }> {
  const { error: erroApagar } = await supabase
    .from("historia_expedicao")
    .delete()
    .eq("historia_id", historiaId);
  if (erroApagar) return { erro: erroApagar.message };

  if (expedicaoIds.length === 0) return { erro: null };

  const { error } = await supabase
    .from("historia_expedicao")
    .insert(expedicaoIds.map((expedicao_id) => ({ historia_id: historiaId, expedicao_id })));
  return { erro: error?.message ?? null };
}

export async function publicarHistoria(
  id: number,
  publicada: boolean
): Promise<{ erro: string | null }> {
  const { error } = await supabase.from("historia").update({ publicada }).eq("id", id);
  return { erro: error?.message ?? null };
}

export async function apagarHistoria(id: number): Promise<{ erro: string | null }> {
  const { error } = await supabase.from("historia").delete().eq("id", id);
  return { erro: error?.message ?? null };
}

/** Histórias publicadas de uma escola, para a página pública. */
export async function listarHistoriasPublicas(escolaSlug: string): Promise<HistoriaPublica[]> {
  const { data, error } = await supabase
    .from("pub_historia")
    .select(
      "id, slug, titulo, resumo, corpo, publicada_em, escola_slug, escola_nome, municipio, uf, capa_storage_path, expedicoes"
    )
    .eq("escola_slug", escolaSlug)
    .order("publicada_em", { ascending: false });
  if (error) return [];

  return (data ?? []).map((h) => ({
    id: num(h.id),
    slug: String(h.slug),
    titulo: String(h.titulo),
    resumo: h.resumo ?? null,
    corpo: String(h.corpo ?? ""),
    publicada_em: h.publicada_em ?? null,
    escola_slug: String(h.escola_slug),
    escola_nome: String(h.escola_nome),
    municipio: String(h.municipio),
    uf: String(h.uf),
    capa_storage_path: h.capa_storage_path ?? null,
    expedicoes: Array.isArray(h.expedicoes) ? (h.expedicoes as number[]).map(num) : [],
  }));
}

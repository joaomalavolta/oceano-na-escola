/**
 * Edição da escola e administração da rede.
 *
 * Duas camadas de permissão, e o banco é quem as separa:
 *
 * - **Quem tem vínculo** com a escola edita a escola — professor e
 *   coordenação escolar. A policy é `app_tem_vinculo(id)`, e ela devolve
 *   verdadeiro para o admin também, então a administração do Ecosurf
 *   edita qualquer escola sem regra extra.
 * - **Só o Ecosurf** altera papel de usuário e cria vínculo. Papel passa
 *   por função com definer, porque conceder a coluna deixaria qualquer
 *   pessoa se promover ao editar o próprio perfil.
 *
 * Duas colunas não entram aqui de propósito: `slug`, que é o endereço
 * público e quebraria links já compartilhados, e `criado_por`, que é
 * registro de autoria.
 */

import { supabase } from "./supabase";

export type Papel =
  | "professor"
  | "coordenacao_escolar"
  | "coordenacao_municipal"
  | "pesquisador"
  | "admin_ecosurf";

export const PAPEIS: { id: Papel; nome: string; descricao: string }[] = [
  { id: "professor", nome: "Professor", descricao: "Cadastra, sai a campo, transcreve, valida e publica" },
  { id: "coordenacao_escolar", nome: "Coordenação escolar", descricao: "Acompanha as turmas e cura a galeria" },
  { id: "coordenacao_municipal", nome: "Coordenação municipal", descricao: "Acompanha várias escolas" },
  { id: "pesquisador", nome: "Pesquisador", descricao: "Consulta e exporta dados da rede" },
  { id: "admin_ecosurf", nome: "Administração Ecosurf", descricao: "Gestão da rede inteira e validação técnica" },
];

export interface EscolaEditavel {
  id: number;
  slug: string;
  nome: string;
  municipio_id: number;
  rede_ensino: string | null;
  endereco: string | null;
  apresentacao: string | null;
  lat: number | null;
  lng: number | null;
  publicada: boolean;
  termos_ok: boolean;
}

export interface TurmaEditavel {
  id: number;
  nome: string;
  ano_letivo: number;
  nivel: string | null;
}

export interface PerfilDaRede {
  id: string;
  nome: string;
  papel: Papel;
  escolas: { id: number; nome: string }[];
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOuNulo(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Carrega a escola para edição.
 *
 * A coordenada vem de uma view auxiliar em vez da coluna `geom`: o
 * formato que o PostgREST devolve para geography varia com a versão, e
 * aqui é preciso o par de números para preencher os campos.
 */
export async function carregarEscolaEditavel(slug: string): Promise<EscolaEditavel | null> {
  const { data, error } = await supabase
    .from("escola")
    .select("id, slug, nome, municipio_id, rede_ensino, endereco, apresentacao, publicada, termos_ok")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const { data: coord } = await supabase.rpc("coordenada_da_escola", { p_escola_id: num(data.id) });
  const ponto = Array.isArray(coord) ? coord[0] : coord;

  return {
    id: num(data.id),
    slug: String(data.slug),
    nome: String(data.nome),
    municipio_id: num(data.municipio_id),
    rede_ensino: data.rede_ensino ?? null,
    endereco: data.endereco ?? null,
    apresentacao: data.apresentacao ?? null,
    lat: numOuNulo(ponto?.lat),
    lng: numOuNulo(ponto?.lng),
    publicada: Boolean(data.publicada),
    termos_ok: Boolean(data.termos_ok),
  };
}

export async function salvarEscola(
  id: number,
  d: Omit<EscolaEditavel, "id" | "slug">
): Promise<{ erro: string | null }> {
  const { error } = await supabase
    .from("escola")
    .update({
      nome: d.nome.trim(),
      municipio_id: d.municipio_id,
      rede_ensino: d.rede_ensino?.trim() || null,
      endereco: d.endereco?.trim() || null,
      apresentacao: d.apresentacao?.trim() || null,
      geom: d.lat !== null && d.lng !== null ? `SRID=4326;POINT(${d.lng} ${d.lat})` : null,
      publicada: d.publicada,
      termos_ok: d.termos_ok,
    })
    .eq("id", id);
  return { erro: error?.message ?? null };
}

// ── Turmas ────────────────────────────────────────────────────────────

export async function listarTurmasDaEscola(escolaId: number): Promise<TurmaEditavel[]> {
  const { data, error } = await supabase
    .from("turma")
    .select("id, nome, ano_letivo, nivel")
    .eq("escola_id", escolaId)
    .order("ano_letivo", { ascending: false })
    .order("nome");
  if (error) return [];
  return (data ?? []).map((t) => ({
    id: num(t.id),
    nome: String(t.nome),
    ano_letivo: num(t.ano_letivo),
    nivel: t.nivel ?? null,
  }));
}

export async function salvarTurma(
  id: number,
  nome: string,
  anoLetivo: number,
  nivel: string
): Promise<{ erro: string | null }> {
  const { error } = await supabase
    .from("turma")
    .update({ nome: nome.trim(), ano_letivo: anoLetivo, nivel: nivel.trim() || null })
    .eq("id", id);
  if (error?.code === "23505") {
    return { erro: `Já existe uma turma "${nome.trim()}" nesta escola em ${anoLetivo}.` };
  }
  return { erro: error?.message ?? null };
}

/**
 * Apagar turma é destrutivo por cascata: a expedição referencia a turma
 * responsável. O banco recusa quando há expedição pendurada, e a
 * mensagem aqui diz isso em vez de repetir o texto da constraint.
 */
export async function apagarTurma(id: number): Promise<{ erro: string | null }> {
  const { error } = await supabase.from("turma").delete().eq("id", id);
  if (error?.code === "23503") {
    return {
      erro: "Esta turma já saiu a campo e não pode ser apagada. O registro de quem esteve lá faz parte do dado.",
    };
  }
  return { erro: error?.message ?? null };
}

// ── Administração da rede ─────────────────────────────────────────────

export async function listarPerfisDaRede(): Promise<PerfilDaRede[]> {
  const [perfisRes, vinculosRes] = await Promise.all([
    supabase.from("perfil").select("id, nome, papel").order("nome"),
    supabase.from("vinculo_escola").select("perfil_id, escola:escola_id (id, nome)"),
  ]);

  if (perfisRes.error) return [];

  type V = { perfil_id: string; escola: { id: number; nome: string } | { id: number; nome: string }[] | null };
  const porPerfil = new Map<string, { id: number; nome: string }[]>();
  for (const v of (vinculosRes.data ?? []) as V[]) {
    const e = Array.isArray(v.escola) ? v.escola[0] : v.escola;
    if (!e) continue;
    const lista = porPerfil.get(String(v.perfil_id)) ?? [];
    lista.push({ id: num(e.id), nome: String(e.nome) });
    porPerfil.set(String(v.perfil_id), lista);
  }

  return (perfisRes.data ?? []).map((p) => ({
    id: String(p.id),
    nome: String(p.nome),
    papel: String(p.papel) as Papel,
    escolas: porPerfil.get(String(p.id)) ?? [],
  }));
}

export async function definirPapel(perfilId: string, papel: Papel): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc("admin_define_papel", {
    p_perfil_id: perfilId,
    p_papel: papel,
  });
  return { erro: error?.message ?? null };
}

export async function criarVinculo(perfilId: string, escolaId: number): Promise<{ erro: string | null }> {
  const { error } = await supabase
    .from("vinculo_escola")
    .insert({ perfil_id: perfilId, escola_id: escolaId });
  if (error?.code === "23505") return { erro: "Esta pessoa já responde por esta escola." };
  return { erro: error?.message ?? null };
}

export async function removerVinculo(perfilId: string, escolaId: number): Promise<{ erro: string | null }> {
  const { error } = await supabase
    .from("vinculo_escola")
    .delete()
    .eq("perfil_id", perfilId)
    .eq("escola_id", escolaId);
  return { erro: error?.message ?? null };
}

/** Todas as escolas que a sessão alcança. Para o admin, é a rede toda. */
export async function listarEscolasAdministraveis(): Promise<
  { id: number; nome: string; slug: string; publicada: boolean; termos_ok: boolean }[]
> {
  const { data, error } = await supabase
    .from("escola")
    .select("id, nome, slug, publicada, termos_ok")
    .order("nome");
  if (error) return [];
  return (data ?? []).map((e) => ({
    id: num(e.id),
    nome: String(e.nome),
    slug: String(e.slug),
    publicada: Boolean(e.publicada),
    termos_ok: Boolean(e.termos_ok),
  }));
}

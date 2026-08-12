/**
 * Abertura de uma saída de campo.
 *
 * Tudo passa pelo RLS com a sessão do professor: as consultas não
 * filtram por escola porque as policies já filtram pelo vínculo.
 */

import { supabase } from "./supabase";

export interface EscolaDoProfessor {
  id: number;
  nome: string;
  slug: string;
  municipio_id: number;
}

export interface TurmaDisponivel {
  id: number;
  nome: string;
  ano_letivo: number;
}

export interface ProtocoloDisponivel {
  id: number;
  codigo: string;
  nome: string;
  versao_id: number;
  forma_agregacao: string;
}

export interface TerritorioDisponivel {
  id: number;
  nome: string;
  tipo: string;
}

export interface NovaExpedicao {
  escola_id: number;
  turma_ids: number[];
  territorio_id: number | null;
  titulo: string;
  data_campo: string;
  hora_inicio: string;
  hora_fim: string;
  extensao_m: number | null;
  n_mapeadores: number | null;
  n_equipes: number;
  mare: string;
  chuva_24h: string;
  vento: string;
  observacoes: string;
}

export async function listarEscolasDoProfessor(): Promise<EscolaDoProfessor[]> {
  const { data, error } = await supabase
    .from("escola")
    .select("id, nome, slug, municipio_id")
    .order("nome");
  if (error) return [];
  return (data ?? []).map((e) => ({
    id: Number(e.id),
    nome: String(e.nome),
    slug: String(e.slug),
    municipio_id: Number(e.municipio_id),
  }));
}

export async function listarTurmas(escolaId: number): Promise<TurmaDisponivel[]> {
  const { data, error } = await supabase
    .from("turma")
    .select("id, nome, ano_letivo")
    .eq("escola_id", escolaId)
    .order("ano_letivo", { ascending: false })
    .order("nome");
  if (error) return [];
  return (data ?? []).map((t) => ({
    id: Number(t.id),
    nome: String(t.nome),
    ano_letivo: Number(t.ano_letivo),
  }));
}

/**
 * Cria uma turma no ato.
 *
 * O ano letivo faz parte da identidade da turma: "7º ano B" de 2026 e
 * de 2027 são turmas diferentes, com estudantes diferentes, e o banco
 * trata assim — a unicidade é (escola, nome, ano). Sem isso, a série
 * histórica da escola misturaria gerações.
 */
export async function criarTurma(
  escolaId: number,
  nome: string,
  anoLetivo: number,
  nivel: string
): Promise<{ turma: TurmaDisponivel | null; erro: string | null }> {
  const { data, error } = await supabase
    .from("turma")
    .insert({
      escola_id: escolaId,
      nome: nome.trim(),
      ano_letivo: anoLetivo,
      nivel: nivel.trim() || null,
    })
    .select("id, nome, ano_letivo")
    .single();

  if (error) {
    // 23505 é a unicidade (escola, nome, ano). Uma frase que diz o que
    // aconteceu vale mais que o texto da constraint.
    if (error.code === "23505") {
      return {
        turma: null,
        erro: `A turma "${nome.trim()}" já existe nesta escola em ${anoLetivo}.`,
      };
    }
    return { turma: null, erro: error.message };
  }

  return {
    turma: {
      id: Number(data.id),
      nome: String(data.nome),
      ano_letivo: Number(data.ano_letivo),
    },
    erro: null,
  };
}

/** Protocolos com versão ativa, para a expedição escolher qual aplicar. */
export async function listarProtocolos(): Promise<ProtocoloDisponivel[]> {
  const { data, error } = await supabase
    .from("protocolo_versao")
    .select("id, ativa, protocolo:protocolo_id (id, codigo, nome, forma_agregacao)")
    .eq("ativa", true);
  if (error) return [];

  type P = { id: number; codigo: string; nome: string; forma_agregacao: string };
  return (data ?? [])
    .map((v) => {
      const bruto = v.protocolo as P | P[] | null;
      const p = Array.isArray(bruto) ? bruto[0] : bruto;
      if (!p) return null;
      return {
        id: Number(p.id),
        codigo: String(p.codigo),
        nome: String(p.nome),
        versao_id: Number(v.id),
        forma_agregacao: String(p.forma_agregacao),
      };
    })
    .filter((p): p is ProtocoloDisponivel => p !== null)
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export async function listarTerritorios(municipioId: number): Promise<TerritorioDisponivel[]> {
  const { data, error } = await supabase
    .from("territorio")
    .select("id, nome, tipo")
    .eq("municipio_id", municipioId)
    .order("nome");
  if (error) return [];
  return (data ?? []).map((t) => ({
    id: Number(t.id),
    nome: String(t.nome),
    tipo: String(t.tipo),
  }));
}

/**
 * Cria a expedição, as turmas participantes e as equipes de campo.
 *
 * O número é sequencial por escola, com unicidade garantida no banco.
 * Calculamos o próximo aqui; se duas pessoas da mesma escola abrirem uma
 * expedição no mesmo instante, a constraint recusa a segunda e o erro
 * chega à tela — melhor recusar do que gravar duas com o mesmo número.
 */
export async function criarExpedicao(
  d: NovaExpedicao
): Promise<{ id: number | null; erro: string | null }> {
  const { data: ultima } = await supabase
    .from("expedicao")
    .select("numero")
    .eq("escola_id", d.escola_id)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();

  const numero = (ultima ? Number(ultima.numero) : 0) + 1;

  const { data: criada, error } = await supabase
    .from("expedicao")
    .insert({
      escola_id: d.escola_id,
      // Turma responsável: a primeira selecionada. A lista completa vai
      // para expedicao_turma logo abaixo.
      turma_id: d.turma_ids[0] ?? null,
      territorio_id: d.territorio_id,
      numero,
      titulo: d.titulo || null,
      data_campo: d.data_campo,
      hora_inicio: d.hora_inicio || null,
      hora_fim: d.hora_fim || null,
      extensao_m: d.extensao_m,
      n_mapeadores: d.n_mapeadores,
      n_equipes: d.n_equipes,
      mare: d.mare || null,
      chuva_24h: d.chuva_24h || null,
      vento: d.vento || null,
      observacoes: d.observacoes || null,
      status: "rascunho",
    })
    .select("id")
    .single();

  if (error) return { id: null, erro: error.message };
  const expedicaoId = Number(criada.id);

  if (d.turma_ids.length > 0) {
    const { error: erroTurmas } = await supabase
      .from("expedicao_turma")
      .insert(d.turma_ids.map((turma_id) => ({ expedicao_id: expedicaoId, turma_id })));
    if (erroTurmas) return { id: expedicaoId, erro: erroTurmas.message };
  }

  // As equipes existem para virar coluna na ficha de transcrição: cada
  // uma conta o seu trecho, e a soma é a contagem da expedição.
  if (d.n_equipes > 0) {
    const equipes = Array.from({ length: d.n_equipes }, (_, i) => ({
      expedicao_id: expedicaoId,
      identificacao: `E${i + 1}`,
    }));
    const { error: erroEquipes } = await supabase.from("equipe").insert(equipes);
    if (erroEquipes) return { id: expedicaoId, erro: erroEquipes.message };
  }

  return { id: expedicaoId, erro: null };
}

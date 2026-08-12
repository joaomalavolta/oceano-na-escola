/**
 * Curadoria da galeria.
 *
 * As premissas dizem que a galeria é sempre pública **com curadoria do
 * professor ou coordenador**. A foto tirada em campo nasce
 * `despublicada` justamente por isso — e sem esta tela ela nasceria e
 * nunca sairia, porque não havia por onde publicá-la.
 *
 * Publicar exige a segunda trava, que é da escola e não da foto: o
 * `termos_ok`, que registra o termo de uso de imagem. A tela cobra as
 * duas coisas antes de deixar publicar.
 */

import { supabase } from "./supabase";

export type StatusEvidencia = "publicada" | "despublicada" | "removida";

export interface EvidenciaCurada {
  id: number;
  storage_path: string;
  legenda: string | null;
  tipo: string;
  status: StatusEvidencia;
  publicada_em: string | null;
  criado_em: string;
  escola_id: number;
  escola_nome: string;
  escola_termos_ok: boolean;
  expedicao_numero: number | null;
  /** Descrição da ocorrência que a foto documenta, quando houver. */
  ocorrencia: string | null;
  /** Pedidos de remoção em aberto sobre esta imagem. */
  remocoesAbertas: number;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function primeiro<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function listarEvidencias(): Promise<EvidenciaCurada[]> {
  const { data, error } = await supabase
    .from("evidencia")
    .select(
      "id, storage_path, legenda, tipo, status, publicada_em, criado_em, escola_id, escola:escola_id (nome, termos_ok), expedicao:expedicao_id (numero), pontual:pontual_id (descricao), solicitacao_remocao (id, atendida_em)"
    )
    .neq("status", "removida")
    .order("criado_em", { ascending: false });

  if (error) return [];

  type Remocao = { id: number; atendida_em: string | null };

  return (data ?? []).map((e) => {
    const escola = primeiro(e.escola as { nome: string; termos_ok: boolean } | { nome: string; termos_ok: boolean }[]);
    const expedicao = primeiro(e.expedicao as { numero: number } | { numero: number }[]);
    const pontual = primeiro(e.pontual as { descricao: string } | { descricao: string }[]);
    const remocoes = (e.solicitacao_remocao ?? []) as Remocao[];

    return {
      id: num(e.id),
      storage_path: String(e.storage_path),
      legenda: e.legenda ?? null,
      tipo: String(e.tipo),
      status: String(e.status) as StatusEvidencia,
      publicada_em: e.publicada_em ?? null,
      criado_em: String(e.criado_em),
      escola_id: num(e.escola_id),
      escola_nome: escola?.nome ?? "",
      escola_termos_ok: Boolean(escola?.termos_ok),
      expedicao_numero: expedicao ? num(expedicao.numero) : null,
      ocorrencia: pontual?.descricao ?? null,
      remocoesAbertas: remocoes.filter((r) => r.atendida_em === null).length,
    };
  });
}

/**
 * Publica ou despublica.
 *
 * Quem curou fica registrado: a responsabilidade pela imagem pública é
 * de uma pessoa, não do sistema. Despublicar limpa a data para a
 * galeria nunca exibir data de foto que saiu do ar.
 */
export async function curarEvidencia(
  id: number,
  publicar: boolean
): Promise<{ erro: string | null }> {
  const { data: sessao } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("evidencia")
    .update({
      status: publicar ? "publicada" : "despublicada",
      publicada_em: publicar ? new Date().toISOString() : null,
      curada_por: sessao.user?.id ?? null,
    })
    .eq("id", id);
  return { erro: error?.message ?? null };
}

export async function salvarLegenda(id: number, legenda: string): Promise<{ erro: string | null }> {
  const { error } = await supabase
    .from("evidencia")
    .update({ legenda: legenda.trim() || null })
    .eq("id", id);
  return { erro: error?.message ?? null };
}

/**
 * Remoção definitiva: apaga o arquivo e o registro.
 *
 * É o que o termo de parceria promete em até 72 horas quando há pedido
 * formalizado. O arquivo sai do Storage primeiro; se essa parte falhar,
 * a linha continua e o pedido segue aberto, em vez de o sistema dizer
 * que removeu uma imagem que ainda está lá.
 */
export async function removerEvidencia(
  id: number,
  storagePath: string
): Promise<{ erro: string | null }> {
  const { error: erroArquivo } = await supabase.storage.from("evidencias").remove([storagePath]);
  if (erroArquivo) return { erro: `A imagem não pôde ser apagada: ${erroArquivo.message}` };

  const { error } = await supabase.from("evidencia").delete().eq("id", id);
  return { erro: error?.message ?? null };
}

/** Registra o termo de uso de imagem da escola, que destrava a galeria. */
export async function registrarTermos(escolaId: number): Promise<{ erro: string | null }> {
  const { error } = await supabase.from("escola").update({ termos_ok: true }).eq("id", escolaId);
  return { erro: error?.message ?? null };
}

// ── Pedidos de remoção ────────────────────────────────────────────────

export interface PedidoRemocao {
  id: number;
  evidencia_id: number;
  solicitante_nome: string;
  solicitante_contato: string;
  motivo: string | null;
  criado_em: string;
  prazo_em: string;
  atendida_em: string | null;
  storage_path: string | null;
  escola_nome: string;
}

export async function listarPedidosRemocao(): Promise<PedidoRemocao[]> {
  const { data, error } = await supabase
    .from("solicitacao_remocao")
    .select(
      "id, evidencia_id, solicitante_nome, solicitante_contato, motivo, criado_em, prazo_em, atendida_em, evidencia:evidencia_id (storage_path, escola:escola_id (nome))"
    )
    .order("criado_em", { ascending: false });

  if (error) return [];

  type Ev = { storage_path: string; escola: { nome: string } | { nome: string }[] | null };

  return (data ?? []).map((p) => {
    const ev = primeiro(p.evidencia as Ev | Ev[]);
    return {
      id: num(p.id),
      evidencia_id: num(p.evidencia_id),
      solicitante_nome: String(p.solicitante_nome),
      solicitante_contato: String(p.solicitante_contato),
      motivo: p.motivo ?? null,
      criado_em: String(p.criado_em),
      prazo_em: String(p.prazo_em),
      atendida_em: p.atendida_em ?? null,
      storage_path: ev?.storage_path ?? null,
      escola_nome: primeiro(ev?.escola ?? null)?.nome ?? "",
    };
  });
}

/**
 * Abre um pedido de remoção e despublica a imagem na hora.
 *
 * As premissas são explícitas: a imagem passa a "despublicada" ANTES da
 * exclusão definitiva. Quem pede não precisa esperar o atendimento para
 * a foto sair do ar — o prazo de 72 horas é para apagar, não para
 * deixar de exibir. Isso acontece num gatilho do banco: o anônimo não
 * tem update em evidencia, e não deve ter.
 *
 * Não acrescente `.select()` aqui. O anônimo tem insert por coluna e
 * nenhum select nesta tabela — de propósito, para ninguém ler o pedido
 * dos outros. Com `.select()`, o insert passa a exigir leitura e volta
 * "permission denied", que soa como bug de policy e não é.
 */
export async function pedirRemocao(d: {
  evidenciaId: number;
  nome: string;
  contato: string;
  motivo: string;
}): Promise<{ erro: string | null }> {
  const { error } = await supabase.from("solicitacao_remocao").insert({
    evidencia_id: d.evidenciaId,
    solicitante_nome: d.nome.trim(),
    solicitante_contato: d.contato.trim(),
    motivo: d.motivo.trim() || null,
  });
  return { erro: error?.message ?? null };
}

export async function marcarAtendido(id: number): Promise<{ erro: string | null }> {
  const { data: sessao } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("solicitacao_remocao")
    .update({ atendida_em: new Date().toISOString(), atendida_por: sessao.user?.id ?? null })
    .eq("id", id);
  return { erro: error?.message ?? null };
}

/**
 * A saída de campo como coisa que se abre, se usa e se encerra.
 *
 * O registro em campo só aceita saída em rascunho. Enviar para revisão
 * é encerrar a saída — e por isso o banco recusa encerrar saída vazia
 * (ver `valida_transicao_expedicao`). Aqui ficam as perguntas que as
 * telas fazem em volta disso.
 */

import { supabase } from "./supabase";

/** A mesma conferência do banco: ocorrência, contagem ou trecho medido. */
export async function saidaTemDado(expedicaoId: number): Promise<boolean | null> {
  const { data, error } = await supabase.rpc("expedicao_tem_dado", { p_expedicao_id: expedicaoId });
  if (error) return null;
  return data === true;
}

export interface SaidaEncerrada {
  id: number;
  numero: number;
  titulo: string | null;
  data_campo: string;
  status: string;
  escola_nome: string;
}

/** Quantos dias para trás o registro em campo oferece reabrir. */
export const DIAS_PARA_REABRIR = 30;

/**
 * Saídas recentes que já foram enviadas, mas ainda não publicadas.
 *
 * É o que o registro em campo mostra quando não há saída aberta: sem
 * isto, a tela dizia "nenhuma expedição aberta" para quem tinha acabado
 * de abrir uma e enviado sem querer. Publicadas ficam de fora: reabrir
 * uma delas tira o dado do mapa, e isso se decide na revisão, com o
 * aviso do custo, e não no meio da praia.
 */
export async function listarSaidasEncerradasRecentes(hoje = new Date()): Promise<SaidaEncerrada[]> {
  const { data: escolas, error: erroEscolas } = await supabase.rpc("app_escolas_que_posso_usar");
  if (erroEscolas) return [];
  const ids = ((escolas ?? []) as { id: number }[]).map((e) => Number(e.id));
  if (ids.length === 0) return [];

  const desde = new Date(hoje.getTime() - DIAS_PARA_REABRIR * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("expedicao")
    .select("id, numero, titulo, data_campo, status, escola:escola_id (nome)")
    .in("status", ["enviado", "revisado", "validado"])
    .in("escola_id", ids)
    .gte("data_campo", desde)
    .order("data_campo", { ascending: false })
    .limit(10);
  if (error) return [];
  return (data ?? []).map((x) => {
    const e = Array.isArray(x.escola) ? x.escola[0] : x.escola;
    return {
      id: Number(x.id),
      numero: Number(x.numero),
      titulo: x.titulo ?? null,
      data_campo: String(x.data_campo),
      status: String(x.status),
      escola_nome: (e as { nome?: string } | null)?.nome ?? "",
    };
  });
}

/**
 * Publica as fotos de campo da saída que ainda aguardam curadoria.
 *
 * É um ato de curadoria como o da galeria, só que em lote, feito por uma
 * pessoa que declarou ter conferido as fotos — e quem publicou fica
 * registrado em `curada_por`. Foto com pedido de remoção fica de fora,
 * atendido ou não: quem pediu para tirar não pode ver a foto voltar por
 * um botão de outra tela.
 */
export async function publicarFotosDaSaida(expedicaoId: number): Promise<{ publicadas: number; erro: string | null }> {
  const { data, error } = await supabase
    .from("evidencia")
    .select("id, solicitacao_remocao (id)")
    .eq("expedicao_id", expedicaoId)
    .eq("status", "despublicada")
    .not("pontual_id", "is", null);
  if (error) return { publicadas: 0, erro: error.message };

  const ids = (data ?? [])
    .filter((f) => !((f.solicitacao_remocao as unknown[] | null)?.length))
    .map((f) => Number(f.id));
  if (ids.length === 0) return { publicadas: 0, erro: null };

  const { data: sessao } = await supabase.auth.getUser();
  const { error: erroUpdate } = await supabase
    .from("evidencia")
    .update({ status: "publicada", publicada_em: new Date().toISOString(), curada_por: sessao.user?.id ?? null })
    .in("id", ids);
  return { publicadas: erroUpdate ? 0 : ids.length, erro: erroUpdate?.message ?? null };
}

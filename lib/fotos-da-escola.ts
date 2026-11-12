/**
 * Fotos que a escola envia fora do registro de ocorrência: a capa, a
 * turma e a saída de campo.
 *
 * As regras são as mesmas da galeria, e moram no banco, não aqui:
 *
 *   - só quem responde pela escola envia (RLS de `evidencia` e política
 *     do Storage, que confere a pasta `escola-<id>`);
 *   - a foto nasce despublicada e só aparece por ato de uma pessoa, que
 *     fica registrada em `curada_por`;
 *   - nada aparece em público sem escola publicada e termo de imagem;
 *   - o pedido de remoção tira a foto do ar na hora, por gatilho.
 *
 * A capa é a exceção à primeira publicação: escolhê-la na ficha da
 * escola JÁ é o ato de curadoria. Quem escolhe a capa está dizendo
 * "esta é a foto que nos representa", e uma segunda confirmação seria
 * a mesma pessoa clicando duas vezes na mesma decisão.
 */

import { supabase } from "./supabase";
import { reduzirFoto } from "./campo";
import type { StatusEvidencia } from "./galeria";

export type DestinoDaFoto =
  | { tipo: "capa_escola" }
  | { tipo: "foto_turma"; turmaId: number | null }
  | { tipo: "foto_campo"; expedicaoId: number };

/**
 * Onde o arquivo mora no Storage.
 *
 * O primeiro segmento TEM de ser `escola-<id>`: é ele que a política do
 * bucket confere para decidir se quem envia responde pela escola. Um
 * caminho fora dessa forma é recusado pelo banco, com uma mensagem que
 * não diria por quê.
 */
export function caminhoDaFoto(escolaId: number, destino: DestinoDaFoto, instante: number): string {
  const pasta =
    destino.tipo === "capa_escola"
      ? "capa"
      : destino.tipo === "foto_turma"
        ? destino.turmaId === null
          ? "turma"
          : `turma-${destino.turmaId}`
        : `exp-${destino.expedicaoId}`;
  return `escola-${escolaId}/${pasta}/${instante}.jpg`;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function primeiro<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

async function quemSou(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function enviarArquivo(caminho: string, arquivo: File): Promise<string | null> {
  const blob = await reduzirFoto(arquivo);
  const { error } = await supabase.storage
    .from("evidencias")
    .upload(caminho, blob, { contentType: "image/jpeg" });
  return error?.message ?? null;
}

// ── Capa ──────────────────────────────────────────────────────────────

export interface Capa {
  id: number;
  storage_path: string;
  status: StatusEvidencia;
}

export async function carregarCapa(escolaId: number): Promise<Capa | null> {
  const { data, error } = await supabase
    .from("evidencia")
    .select("id, storage_path, status")
    .eq("escola_id", escolaId)
    .eq("tipo", "capa_escola")
    .neq("status", "removida")
    .maybeSingle();
  if (error || !data) return null;
  return { id: num(data.id), storage_path: String(data.storage_path), status: data.status as StatusEvidencia };
}

/**
 * Define ou troca a capa.
 *
 * A ordem protege a capa atual: o arquivo novo sobe primeiro, e só
 * depois a anterior sai. Se o envio falhar, a escola continua com a capa
 * que tinha. O banco só aceita uma capa por escola, por isso a anterior
 * precisa sair antes de a nova entrar.
 */
export async function definirCapa(escolaId: number, arquivo: File): Promise<{ erro: string | null }> {
  const caminho = caminhoDaFoto(escolaId, { tipo: "capa_escola" }, Date.now());
  const erroEnvio = await enviarArquivo(caminho, arquivo);
  if (erroEnvio) return { erro: `A foto não pôde ser enviada: ${erroEnvio}` };

  const anterior = await carregarCapa(escolaId);
  if (anterior) {
    // Arquivo antes da linha, como na remoção da galeria: se o arquivo
    // não sair, a capa antiga fica inteira, e a nova é que é descartada.
    const { error: erroArquivo } = await supabase.storage
      .from("evidencias")
      .remove([anterior.storage_path]);
    if (erroArquivo) {
      await supabase.storage.from("evidencias").remove([caminho]);
      return { erro: `A capa anterior não pôde ser substituída: ${erroArquivo.message}` };
    }
    await supabase.from("evidencia").delete().eq("id", anterior.id);
  }

  const eu = await quemSou();
  const { error } = await supabase.from("evidencia").insert({
    escola_id: escolaId,
    tipo: "capa_escola",
    storage_path: caminho,
    status: "publicada",
    publicada_em: new Date().toISOString(),
    curada_por: eu,
    criado_por: eu,
  });
  if (error) {
    await supabase.storage.from("evidencias").remove([caminho]);
    return { erro: error.message };
  }
  return { erro: null };
}

// ── Fotos da turma e da saída ─────────────────────────────────────────

export interface FotoEnviada {
  id: number;
  storage_path: string;
  legenda: string | null;
  status: StatusEvidencia;
  criado_em: string;
  turma_nome: string | null;
}

/** Nasce despublicada: quem decide se vai a público é a curadoria. */
export async function enviarFoto(
  escolaId: number,
  destino: Exclude<DestinoDaFoto, { tipo: "capa_escola" }>,
  arquivo: File,
  legenda: string
): Promise<{ erro: string | null }> {
  // O instante leva um sufixo: várias fotos escolhidas de uma vez saem
  // no mesmo milissegundo, e o Storage recusaria o segundo nome igual.
  const caminho = caminhoDaFoto(escolaId, destino, Date.now()).replace(
    /\.jpg$/,
    `-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}.jpg`
  );
  const erroEnvio = await enviarArquivo(caminho, arquivo);
  if (erroEnvio) return { erro: erroEnvio };

  const { error } = await supabase.from("evidencia").insert({
    escola_id: escolaId,
    tipo: destino.tipo,
    turma_id: destino.tipo === "foto_turma" ? destino.turmaId : null,
    expedicao_id: destino.tipo === "foto_campo" ? destino.expedicaoId : null,
    storage_path: caminho,
    legenda: legenda.trim() || null,
    criado_por: await quemSou(),
  });
  if (error) {
    await supabase.storage.from("evidencias").remove([caminho]);
    return { erro: error.message };
  }
  return { erro: null };
}

export async function listarFotos(
  escolaId: number,
  filtro: { tipo: "foto_turma" } | { expedicaoId: number }
): Promise<FotoEnviada[]> {
  let consulta = supabase
    .from("evidencia")
    .select("id, storage_path, legenda, status, criado_em, turma:turma_id (nome)")
    .eq("escola_id", escolaId)
    .neq("status", "removida");

  consulta =
    "tipo" in filtro
      ? consulta.eq("tipo", "foto_turma")
      : // Na saída entram todas as fotos dela, inclusive as das
        // ocorrências registradas em campo: é a mesma saída.
        consulta.eq("expedicao_id", filtro.expedicaoId).neq("tipo", "capa_escola");

  const { data, error } = await consulta.order("criado_em", { ascending: false });
  if (error) return [];

  return (data ?? []).map((f) => ({
    id: num(f.id),
    storage_path: String(f.storage_path),
    legenda: f.legenda ?? null,
    status: f.status as StatusEvidencia,
    criado_em: String(f.criado_em),
    turma_nome: primeiro(f.turma as { nome: string } | { nome: string }[] | null)?.nome ?? null,
  }));
}

/** O termo de imagem, lido do banco: é ele que vale para o público. */
export async function escolaTemTermo(escolaId: number): Promise<boolean> {
  const { data } = await supabase.from("escola").select("termos_ok").eq("id", escolaId).maybeSingle();
  return Boolean(data?.termos_ok);
}

// ── Foto de uma ocorrência já registrada ──────────────────────────────

/**
 * Põe foto numa ocorrência que já existe: a que foi registrada sem foto,
 * a transcrita da ficha de papel, a que pede um segundo ângulo.
 *
 * Vai para a mesma pasta da saída e para a mesma tabela que a foto
 * tirada no registro de campo — é a mesma coisa, chegando depois. Nasce
 * despublicada, como toda foto.
 */
export async function enviarFotoDaOcorrencia(
  escolaId: number,
  expedicaoId: number,
  pontualId: number,
  arquivo: File
): Promise<{ erro: string | null }> {
  const caminho = caminhoDaFoto(escolaId, { tipo: "foto_campo", expedicaoId }, Date.now()).replace(
    /\.jpg$/,
    `-oc${pontualId}.jpg`
  );
  const erroEnvio = await enviarArquivo(caminho, arquivo);
  if (erroEnvio) return { erro: erroEnvio };

  const { error } = await supabase.from("evidencia").insert({
    escola_id: escolaId,
    expedicao_id: expedicaoId,
    pontual_id: pontualId,
    tipo: "foto_campo",
    storage_path: caminho,
    criado_por: await quemSou(),
  });
  if (error) {
    await supabase.storage.from("evidencias").remove([caminho]);
    return { erro: error.message };
  }
  return { erro: null };
}

export async function listarFotosDaOcorrencia(pontualId: number): Promise<FotoEnviada[]> {
  const { data, error } = await supabase
    .from("evidencia")
    .select("id, storage_path, legenda, status, criado_em")
    .eq("pontual_id", pontualId)
    .neq("status", "removida")
    .order("criado_em");
  if (error) return [];
  return (data ?? []).map((f) => ({
    id: num(f.id),
    storage_path: String(f.storage_path),
    legenda: f.legenda ?? null,
    status: f.status as StatusEvidencia,
    criado_em: String(f.criado_em),
    turma_nome: null,
  }));
}

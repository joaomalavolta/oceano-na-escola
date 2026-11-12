/**
 * Mural da escola: texto do coordenador com fotos ou vídeos curtos.
 *
 * As travas estão no banco (ver a migração do mural): só quem responde
 * pela escola escreve, publicar publica a mídia junto, retirar retira
 * junto, e o visitante só vê mídia com termo de imagem. Aqui fica o que
 * o banco não sabe medir — tamanho e duração do vídeo — e a ordem dos
 * passos do envio.
 */

import { supabase } from "./supabase";
import { reduzirFoto } from "./campo";

export type TipoMidia = "foto_mural" | "video_mural";

/**
 * Limites do mural. Sem fonte externa: são escolhas para caber no
 * armazenamento do projeto e numa conexão de celular na praia.
 *
 * 50 MB é o teto de arquivo do plano gratuito do Supabase. Um minuto de
 * vídeo de celular em 1080p passa disso, por isso o limite de duração é
 * o que a pessoa vai sentir primeiro — e ele também é o que torna o vídeo
 * "curto", como foi pedido.
 */
export const LIMITES = {
  arquivos: 6,
  videoBytes: 50 * 1024 * 1024,
  videoSegundos: 60,
  texto: 2000,
};

const VIDEOS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export function tipoDaMidia(arquivo: { type: string }): TipoMidia | null {
  if (arquivo.type.startsWith("image/")) return "foto_mural";
  if (arquivo.type in VIDEOS) return "video_mural";
  return null;
}

export function extensaoDoVideo(tipo: string): string {
  return VIDEOS[tipo] ?? "mp4";
}

/**
 * O que impede o arquivo de entrar, em português, ou nulo.
 * `duracao` é nula quando o navegador não conseguiu ler — aí vale só o
 * tamanho, que o Storage confere de novo.
 */
export function problemaDaMidia(
  arquivo: { type: string; size: number; name: string },
  duracao: number | null
): string | null {
  const tipo = tipoDaMidia(arquivo);
  if (!tipo) return `${arquivo.name}: só fotos e vídeos MP4, WebM ou MOV.`;
  if (tipo === "video_mural") {
    if (arquivo.size > LIMITES.videoBytes) return `${arquivo.name}: vídeo acima de 50 MB.`;
    if (duracao !== null && duracao > LIMITES.videoSegundos + 0.5)
      return `${arquivo.name}: vídeo de ${Math.round(duracao)} s — o limite é ${LIMITES.videoSegundos} s.`;
  }
  return null;
}

export function caminhoDaMidia(
  escolaId: number,
  publicacaoId: number,
  instante: number,
  sufixo: string,
  extensao: string
): string {
  return `escola-${escolaId}/mural-${publicacaoId}/${instante}-${sufixo}.${extensao}`;
}

/** Duração lida pelo próprio navegador, sem enviar nada. */
export function duracaoDoVideo(arquivo: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(arquivo);
    const v = document.createElement("video");
    v.preload = "metadata";
    const fim = (d: number | null) => {
      URL.revokeObjectURL(url);
      resolve(d);
    };
    v.onloadedmetadata = () => fim(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => fim(null);
    v.src = url;
  });
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sufixo(): string {
  return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

/**
 * Escreve e publica.
 *
 * A publicação nasce fora do ar, recebe a mídia e só então é publicada,
 * numa função do banco que publica texto e mídia de uma vez. Se qualquer
 * arquivo falhar no meio, tudo o que subiu é apagado e a publicação
 * também: meia publicação no ar — o texto dizendo "olha o vídeo" sem o
 * vídeo — é pior que nenhuma.
 */
export async function criarPublicacao(
  escolaId: number,
  texto: string,
  arquivos: File[]
): Promise<{ erro: string | null }> {
  const { data: sessao } = await supabase.auth.getUser();
  const eu = sessao.user?.id ?? null;

  const { data: post, error: erroPost } = await supabase
    .from("mural_publicacao")
    .insert({ escola_id: escolaId, texto: texto.trim() })
    .select("id")
    .single();
  if (erroPost) return { erro: erroPost.message };
  const postId = num(post.id);

  const enviados: string[] = [];
  const desfazer = async (motivo: string) => {
    if (enviados.length > 0) await supabase.storage.from("evidencias").remove(enviados);
    await supabase.from("mural_publicacao").delete().eq("id", postId);
    return { erro: motivo };
  };

  for (const arquivo of arquivos) {
    const tipo = tipoDaMidia(arquivo);
    if (!tipo) return desfazer(`${arquivo.name}: tipo de arquivo não aceito.`);

    const corpo = tipo === "foto_mural" ? await reduzirFoto(arquivo) : arquivo;
    const contentType = tipo === "foto_mural" ? "image/jpeg" : arquivo.type;
    const ext = tipo === "foto_mural" ? "jpg" : extensaoDoVideo(arquivo.type);
    const caminho = caminhoDaMidia(escolaId, postId, Date.now(), sufixo(), ext);

    const { error: erroEnvio } = await supabase.storage
      .from("evidencias")
      .upload(caminho, corpo, { contentType });
    if (erroEnvio) return desfazer(`${arquivo.name}: ${erroEnvio.message}`);
    enviados.push(caminho);

    const { error: erroEv } = await supabase.from("evidencia").insert({
      escola_id: escolaId,
      tipo,
      storage_path: caminho,
      publicacao_id: postId,
      criado_por: eu,
    });
    if (erroEv) return desfazer(`${arquivo.name}: ${erroEv.message}`);
  }

  const { error: erroPub } = await supabase.rpc("publicar_no_mural", { p_id: postId });
  if (erroPub) return desfazer(erroPub.message);
  return { erro: null };
}

export interface PublicacaoDaEscola {
  id: number;
  texto: string;
  publicada: boolean;
  publicada_em: string | null;
  criado_em: string;
  midias: { id: number; storage_path: string; tipo: TipoMidia; status: string }[];
}

export async function listarPublicacoes(escolaId: number): Promise<PublicacaoDaEscola[]> {
  const { data, error } = await supabase
    .from("mural_publicacao")
    .select("id, texto, publicada, publicada_em, criado_em, evidencia (id, storage_path, tipo, status)")
    .eq("escola_id", escolaId)
    .order("criado_em", { ascending: false });
  if (error) return [];

  type Ev = { id: number; storage_path: string; tipo: string; status: string };
  return (data ?? []).map((p) => ({
    id: num(p.id),
    texto: String(p.texto),
    publicada: Boolean(p.publicada),
    publicada_em: p.publicada_em ?? null,
    criado_em: String(p.criado_em),
    midias: ((p.evidencia ?? []) as Ev[])
      .filter((e) => e.status !== "removida")
      .map((e) => ({ id: num(e.id), storage_path: String(e.storage_path), tipo: e.tipo as TipoMidia, status: e.status })),
  }));
}

export async function retirarDoMural(id: number): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc("retirar_do_mural", { p_id: id });
  return { erro: error?.message ?? null };
}

export async function republicarNoMural(id: number): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc("publicar_no_mural", { p_id: id });
  return { erro: error?.message ?? null };
}

/** Arquivos antes da linha: apagar é apagar, e não esconder. */
export async function apagarPublicacao(p: PublicacaoDaEscola): Promise<{ erro: string | null }> {
  const caminhos = p.midias.map((m) => m.storage_path);
  if (caminhos.length > 0) {
    const { error } = await supabase.storage.from("evidencias").remove(caminhos);
    if (error) return { erro: `Os arquivos não puderam ser apagados: ${error.message}` };
  }
  const { error } = await supabase.from("mural_publicacao").delete().eq("id", p.id);
  return { erro: error?.message ?? null };
}

/** Quem está vendo responde por esta escola? Decide se o campo de escrever aparece. */
export async function possoEscreverNoMural(escolaId: number): Promise<boolean> {
  const { data: sessao } = await supabase.auth.getSession();
  if (!sessao.session) return false;
  const { data, error } = await supabase.rpc("app_tem_vinculo", { p_escola_id: escolaId });
  return !error && data === true;
}

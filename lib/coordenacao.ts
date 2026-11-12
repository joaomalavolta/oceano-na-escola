/**
 * Coordenação da escola: as pessoas que aparecem na página pública com
 * foto e contato.
 *
 * Quem pode criar e editar é o banco que decide (vínculo com a escola).
 * Quem aparece também: só a pessoa marcada como `autorizado`.
 */

import { supabase } from "./supabase";
import { reduzirFoto } from "./campo";
import {
  emailValido,
  instagramValido,
  normalizarInstagram,
  telefoneValido,
} from "./contato";

export interface Coordenador {
  id: number;
  nome: string;
  funcao: string | null;
  email: string | null;
  telefone: string | null;
  telefone_whatsapp: boolean;
  instagram: string | null;
  foto_path: string | null;
  autorizado: boolean;
  ordem: number;
}

export type DadosDoCoordenador = Omit<Coordenador, "id" | "foto_path" | "ordem">;

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function vazioViraNulo(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

export function normalizarCoordenador(d: DadosDoCoordenador): DadosDoCoordenador {
  const telefone = vazioViraNulo(d.telefone);
  return {
    nome: (d.nome ?? "").trim(),
    funcao: vazioViraNulo(d.funcao),
    email: vazioViraNulo(d.email)?.toLowerCase() ?? null,
    telefone,
    telefone_whatsapp: Boolean(telefone) && d.telefone_whatsapp,
    instagram: normalizarInstagram(d.instagram),
    autorizado: d.autorizado,
  };
}

/** Os problemas, já em português. Vazio quando pode salvar. */
export function problemasDoCoordenador(d: DadosDoCoordenador): string[] {
  const p: string[] = [];
  if (d.nome.length === 0) p.push("Falta o nome.");
  if (d.nome.length > 120) p.push("Nome com mais de 120 caracteres.");
  if (d.funcao && d.funcao.length > 80) p.push("Função com mais de 80 caracteres.");
  if (!emailValido(d.email)) p.push("E-mail incompleto.");
  if (!telefoneValido(d.telefone)) p.push("Telefone: use só números, espaço, parênteses e traço.");
  if (!instagramValido(d.instagram)) p.push("Instagram: só o nome de usuário.");
  return p;
}

export function caminhoDaFotoDoCoordenador(escolaId: number, coordenadorId: number, instante: number): string {
  return `escola-${escolaId}/coordenacao/${coordenadorId}-${instante}.jpg`;
}

export async function listarCoordenadores(escolaId: number): Promise<Coordenador[]> {
  const { data, error } = await supabase
    .from("escola_coordenador")
    .select("id, nome, funcao, email, telefone, telefone_whatsapp, instagram, foto_path, autorizado, ordem")
    .eq("escola_id", escolaId)
    .order("ordem")
    .order("id");
  if (error) return [];
  return (data ?? []).map((c) => ({
    id: num(c.id),
    nome: String(c.nome),
    funcao: c.funcao ?? null,
    email: c.email ?? null,
    telefone: c.telefone ?? null,
    telefone_whatsapp: Boolean(c.telefone_whatsapp),
    instagram: c.instagram ?? null,
    foto_path: c.foto_path ?? null,
    autorizado: Boolean(c.autorizado),
    ordem: num(c.ordem),
  }));
}

export async function criarCoordenador(
  escolaId: number,
  d: DadosDoCoordenador,
  ordem: number
): Promise<{ id: number | null; erro: string | null }> {
  const dados = normalizarCoordenador(d);
  const problemas = problemasDoCoordenador(dados);
  if (problemas.length > 0) return { id: null, erro: problemas.join(" ") };
  const { data, error } = await supabase
    .from("escola_coordenador")
    .insert({ escola_id: escolaId, ...dados, ordem })
    .select("id")
    .single();
  if (error) return { id: null, erro: error.message };
  return { id: num(data.id), erro: null };
}

export async function salvarCoordenador(id: number, d: DadosDoCoordenador): Promise<{ erro: string | null }> {
  const dados = normalizarCoordenador(d);
  const problemas = problemasDoCoordenador(dados);
  if (problemas.length > 0) return { erro: problemas.join(" ") };
  const { error } = await supabase.from("escola_coordenador").update(dados).eq("id", id);
  return { erro: error?.message ?? null };
}

export async function moverCoordenador(id: number, ordem: number): Promise<{ erro: string | null }> {
  const { error } = await supabase.from("escola_coordenador").update({ ordem }).eq("id", id);
  return { erro: error?.message ?? null };
}

/** Arquivo antes da linha: apagar é apagar, e não esconder. */
export async function apagarCoordenador(c: Coordenador): Promise<{ erro: string | null }> {
  if (c.foto_path) {
    const { error } = await supabase.storage.from("evidencias").remove([c.foto_path]);
    if (error) return { erro: `A foto não pôde ser apagada: ${error.message}` };
  }
  const { error } = await supabase.from("escola_coordenador").delete().eq("id", c.id);
  return { erro: error?.message ?? null };
}

/**
 * Troca a foto. A nova sobe primeiro e só então a antiga sai: se o envio
 * falhar no meio, a pessoa continua com a foto que tinha.
 */
export async function trocarFotoDoCoordenador(
  escolaId: number,
  c: Coordenador,
  arquivo: File
): Promise<{ erro: string | null }> {
  const caminho = caminhoDaFotoDoCoordenador(escolaId, c.id, Date.now());
  const blob = await reduzirFoto(arquivo, 800);
  const { error: erroEnvio } = await supabase.storage
    .from("evidencias")
    .upload(caminho, blob, { contentType: "image/jpeg" });
  if (erroEnvio) return { erro: erroEnvio.message };

  const { error } = await supabase.from("escola_coordenador").update({ foto_path: caminho }).eq("id", c.id);
  if (error) {
    await supabase.storage.from("evidencias").remove([caminho]);
    return { erro: error.message };
  }
  if (c.foto_path) await supabase.storage.from("evidencias").remove([c.foto_path]);
  return { erro: null };
}

export async function tirarFotoDoCoordenador(c: Coordenador): Promise<{ erro: string | null }> {
  if (!c.foto_path) return { erro: null };
  const { error: erroArquivo } = await supabase.storage.from("evidencias").remove([c.foto_path]);
  if (erroArquivo) return { erro: erroArquivo.message };
  const { error } = await supabase.from("escola_coordenador").update({ foto_path: null }).eq("id", c.id);
  return { erro: error?.message ?? null };
}

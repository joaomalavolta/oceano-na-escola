/**
 * Diário de Campo.
 *
 * O antigo Diário de Bordo do Rio do Nosso Bairro, preso à expedição. O
 * manual de Mapa Verde divide o processo em antes, durante e depois do
 * mapeamento, e é essa a divisão das entradas — preparar, observar,
 * interpretar.
 *
 * Fica dentro da escola. Escrita de estudante em processo não é dado
 * público: o que sai é a História do Território, que a escola escreve
 * para ser lida.
 */

import { supabase } from "./supabase";

export type Momento = "antes" | "durante" | "depois";

export const MOMENTOS: { id: Momento; nome: string; convite: string }[] = [
  {
    id: "antes",
    nome: "Antes",
    convite:
      "O que a turma já sabe deste lugar? O que espera encontrar? Que perguntas leva para o campo?",
  },
  {
    id: "durante",
    nome: "Durante",
    convite:
      "O que apareceu no caminho? O que surpreendeu? Quem vive e trabalha aqui, o que contou?",
  },
  {
    id: "depois",
    nome: "Depois",
    convite:
      "O que estes números dizem deste território? O que mudaria a situação? De quem é a responsabilidade?",
  },
];

export interface EntradaDiario {
  id: number;
  momento: Momento;
  titulo: string | null;
  texto: string;
  autoria: string | null;
  turma_id: number | null;
  criado_em: string;
}

export interface NovaEntrada {
  expedicaoId: number;
  momento: Momento;
  titulo: string;
  texto: string;
  autoria: string;
  turmaId: number | null;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function listarEntradas(expedicaoId: number): Promise<EntradaDiario[]> {
  const { data, error } = await supabase
    .from("diario_entrada")
    .select("id, momento, titulo, texto, autoria, turma_id, criado_em")
    .eq("expedicao_id", expedicaoId)
    .order("criado_em");
  if (error) return [];
  return (data ?? []).map((e) => ({
    id: num(e.id),
    momento: String(e.momento) as Momento,
    titulo: e.titulo ?? null,
    texto: String(e.texto),
    autoria: e.autoria ?? null,
    turma_id: e.turma_id === null ? null : num(e.turma_id),
    criado_em: String(e.criado_em),
  }));
}

export async function criarEntrada(e: NovaEntrada): Promise<{ erro: string | null }> {
  const { data: sessao } = await supabase.auth.getUser();
  const { error } = await supabase.from("diario_entrada").insert({
    expedicao_id: e.expedicaoId,
    turma_id: e.turmaId,
    momento: e.momento,
    titulo: e.titulo.trim() || null,
    texto: e.texto.trim(),
    autoria: e.autoria.trim() || null,
    criado_por: sessao.user?.id ?? null,
  });
  return { erro: error?.message ?? null };
}

export async function apagarEntrada(id: number): Promise<{ erro: string | null }> {
  const { error } = await supabase.from("diario_entrada").delete().eq("id", id);
  return { erro: error?.message ?? null };
}

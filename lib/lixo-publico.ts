/**
 * O lado público do Lixo no mar: o detalhe de um ponto e o ranking de
 * marcas da rede. Só lê as visões `pub_*`, que já filtram saída
 * publicada de escola publicada.
 */

import { supabase, supabaseConfigurado } from "./supabase";

export interface LixoPublico {
  quantidade_estimada: number | null;
  sacos: number | null;
  litros_por_saco: number | null;
  material: string | null;
  itens: { nome: string; quantidade: number }[];
  marcas: { marca: string; quantidade: number }[];
}

export interface MarcaNoRanking {
  marca: string;
  itens: number;
  pontos: number;
  escolas: number;
}

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function carregarLixoPublico(pontualId: number): Promise<LixoPublico | null> {
  if (!supabaseConfigurado) return null;
  const { data, error } = await supabase
    .from("pub_lixo_no_ponto")
    .select("quantidade_estimada, sacos, litros_por_saco, material, itens, marcas")
    .eq("pontual_id", pontualId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    quantidade_estimada: n(data.quantidade_estimada),
    sacos: n(data.sacos),
    litros_por_saco: n(data.litros_por_saco),
    material: data.material ?? null,
    itens: (data.itens ?? []) as LixoPublico["itens"],
    marcas: (data.marcas ?? []) as LixoPublico["marcas"],
  };
}

export async function carregarRankingDeMarcas(limite = 20): Promise<MarcaNoRanking[] | null> {
  if (!supabaseConfigurado) return [];
  const { data, error } = await supabase
    .from("pub_ranking_marcas")
    .select("marca, itens, pontos, escolas")
    .order("itens", { ascending: false })
    .order("marca")
    .limit(limite);
  if (error) return null;
  return (data ?? []).map((m) => ({
    marca: String(m.marca),
    itens: Number(m.itens),
    pontos: Number(m.pontos),
    escolas: Number(m.escolas),
  }));
}

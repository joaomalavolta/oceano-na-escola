/**
 * Carga da linha do tempo da rede.
 *
 * Três views públicas, as mesmas que a página de cada escola lê. Sem
 * banco configurado, a demonstração monta as saídas a partir das
 * ocorrências fictícias do mapa, para contar a mesma história que ele.
 */

import { supabase, supabaseConfigurado } from "./supabase";
import { mockEscolas, mockPontuais } from "./mapa-publico";
import { tipoDe } from "./organizacao";
import {
  expedicoesDosPontuais,
  type EscolaNaLinha,
  type ExpedicaoNaLinha,
  type FotoNaLinha,
  type MidiaNaLinha,
  type PublicacaoNaLinha,
} from "./linha-do-tempo";

export interface DadosDaLinha {
  expedicoes: ExpedicaoNaLinha[];
  fotos: FotoNaLinha[];
  escolas: EscolaNaLinha[];
  publicacoes: PublicacaoNaLinha[];
  midias: MidiaNaLinha[];
  origem: "supabase" | "mock";
  erro: string | null;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOuNulo(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const VAZIO: DadosDaLinha = {
  expedicoes: [],
  fotos: [],
  escolas: [],
  publicacoes: [],
  midias: [],
  origem: "supabase",
  erro: null,
};

function demonstracao(erro: string | null): DadosDaLinha {
  return {
    expedicoes: expedicoesDosPontuais(mockPontuais),
    fotos: [],
    escolas: mockEscolas.map((e) => ({
      slug: e.slug,
      nome: e.nome,
      tipo: e.tipo,
      municipio: e.municipio,
    })),
    publicacoes: [],
    midias: [],
    origem: "mock",
    erro,
  };
}

export async function carregarLinhaDoTempo(): Promise<DadosDaLinha> {
  if (!supabaseConfigurado) return demonstracao(null);

  try {
    const [expRes, fotosRes, escolasRes, muralRes, midiaRes] = await Promise.all([
      supabase
        .from("pub_expedicao")
        .select("id, numero, titulo, data_campo, n_mapeadores, extensao_m, territorio, escola_slug, escola_nome")
        .order("data_campo", { ascending: false }),
      supabase.from("pub_galeria").select("id, storage_path, legenda, escola_slug, expedicao_numero, tipo"),
      supabase.from("pub_escola").select("slug, nome, tipo, municipio"),
      supabase.from("pub_mural").select("id, texto, publicada_em, escola_slug, escola_nome"),
      supabase.from("pub_mural_midia").select("id, publicacao_id, storage_path, tipo, legenda"),
    ]);

    const falha = expRes.error ?? escolasRes.error;
    if (falha) return { ...VAZIO, erro: falha.message };

    return {
      expedicoes: (expRes.data ?? []).map((x) => ({
        id: num(x.id),
        numero: num(x.numero),
        titulo: x.titulo ?? null,
        data_campo: String(x.data_campo),
        n_mapeadores: numOuNulo(x.n_mapeadores),
        extensao_m: numOuNulo(x.extensao_m),
        territorio: x.territorio ?? null,
        escola_slug: String(x.escola_slug),
        escola_nome: String(x.escola_nome),
      })),
      // Sem foto, a linha do tempo continua sendo a linha do tempo: a
      // falha da galeria não derruba as datas de campo.
      fotos: fotosRes.error
        ? []
        : (fotosRes.data ?? []).map((f) => ({
            id: num(f.id),
            storage_path: String(f.storage_path),
            legenda: f.legenda ?? null,
            escola_slug: String(f.escola_slug),
            expedicao_numero: numOuNulo(f.expedicao_numero),
            tipo: String(f.tipo ?? "foto_campo"),
          })),
      escolas: (escolasRes.data ?? []).map((e) => ({
        slug: String(e.slug),
        nome: String(e.nome),
        tipo: tipoDe(e.tipo),
        municipio: String(e.municipio),
      })),
      // O mural é como a foto: se falhar, a linha do tempo segue com as
      // saídas em vez de cair inteira.
      publicacoes: muralRes.error
        ? []
        : (muralRes.data ?? []).map((p) => ({
            id: num(p.id),
            texto: String(p.texto),
            publicada_em: String(p.publicada_em),
            escola_slug: String(p.escola_slug),
            escola_nome: String(p.escola_nome),
          })),
      midias: midiaRes.error
        ? []
        : (midiaRes.data ?? []).map((m) => ({
            id: num(m.id),
            publicacao_id: num(m.publicacao_id),
            storage_path: String(m.storage_path),
            tipo: String(m.tipo),
            legenda: m.legenda ?? null,
          })),
      origem: "supabase",
      erro: null,
    };
  } catch (e) {
    return { ...VAZIO, erro: String(e) };
  }
}

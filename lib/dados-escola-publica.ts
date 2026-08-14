/**
 * Dados públicos de uma escola.
 *
 * Tudo vem das views `pub_*`, com a chave anônima — a mesma fonte do
 * mapa. Nenhuma tabela base é alcançada, e a página funciona para quem
 * não tem conta, que é o ponto de ter uma página pública por escola.
 */

import { supabase, supabaseConfigurado } from "./supabase";
import type {
  PubEscola,
  PubIndicadorEscola,
  PubExpedicao,
  PubObservacaoPontual,
  PubFotoGeorreferenciada,
  PubGaleria,
} from "./database.types";

export interface EscolaPublica {
  escola: PubEscola | null;
  indicador: PubIndicadorEscola | null;
  expedicoes: PubExpedicao[];
  ocorrencias: PubObservacaoPontual[];
  fotos: PubFotoGeorreferenciada[];
  galeria: PubGaleria[];
  /** false quando faltam as variáveis do Supabase. */
  disponivel: boolean;
  erro: string | null;
}

const VAZIO: EscolaPublica = {
  escola: null,
  indicador: null,
  expedicoes: [],
  ocorrencias: [],
  fotos: [],
  galeria: [],
  disponivel: true,
  erro: null,
};

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOuNulo(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function carregarEscolaPublica(slug: string): Promise<EscolaPublica> {
  if (!supabaseConfigurado) return { ...VAZIO, disponivel: false };

  try {
    const [escolaRes, indicadorRes, expedicoesRes, ocorrenciasRes, fotosRes, galeriaRes] =
      await Promise.all([
        supabase.from("pub_escola").select("*").eq("slug", slug).maybeSingle(),
        supabase.from("pub_indicador_escola").select("*").eq("escola_slug", slug).maybeSingle(),
        supabase
          .from("pub_expedicao")
          .select("*")
          .eq("escola_slug", slug)
          .order("data_campo", { ascending: false }),
        supabase.from("pub_observacao_pontual").select("*").eq("escola_slug", slug),
        supabase.from("pub_foto_georreferenciada").select("*").eq("escola_slug", slug),
        supabase.from("pub_galeria").select("*").eq("escola_slug", slug),
      ]);

    const falha =
      escolaRes.error ?? indicadorRes.error ?? expedicoesRes.error ??
      ocorrenciasRes.error ?? fotosRes.error ?? galeriaRes.error;
    if (falha) return { ...VAZIO, erro: falha.message };

    const e = escolaRes.data;
    const escola: PubEscola | null = e
      ? {
          id: num(e.id),
          slug: String(e.slug),
          nome: String(e.nome),
          apresentacao: e.apresentacao ?? null,
          municipio: String(e.municipio),
          uf: String(e.uf),
          lat: num(e.lat),
          lng: num(e.lng),
        }
      : null;

    const i = indicadorRes.data;
    const indicador: PubIndicadorEscola | null = i
      ? {
          escola_slug: String(i.escola_slug),
          expedicoes: num(i.expedicoes),
          extensao_total_m: num(i.extensao_total_m),
          itens_catalogados: num(i.itens_catalogados),
          registros_pontuais: num(i.registros_pontuais),
        }
      : null;

    const expedicoes: PubExpedicao[] = (expedicoesRes.data ?? []).map((x) => ({
      id: num(x.id),
      numero: num(x.numero),
      titulo: x.titulo ?? null,
      data_campo: String(x.data_campo),
      extensao_m: numOuNulo(x.extensao_m),
      n_mapeadores: numOuNulo(x.n_mapeadores),
      n_equipes: numOuNulo(x.n_equipes),
      escola_slug: String(x.escola_slug),
      escola_nome: String(x.escola_nome),
      territorio: x.territorio ?? null,
      percurso_geojson: x.percurso_geojson ?? null,
    }));

    const ocorrencias: PubObservacaoPontual[] = (ocorrenciasRes.data ?? []).map((o) => ({
      id: num(o.id),
      escola_slug: String(o.escola_slug),
      escola_nome: String(o.escola_nome),
      protocolo: String(o.protocolo),
      protocolo_nome: String(o.protocolo_nome),
      protocolo_icone: o.protocolo_icone ?? null,
      protocolo_cor: o.protocolo_cor ?? null,
      item_codigo: o.item_codigo ?? null,
      item_nome: o.item_nome ?? null,
      item_grupo: o.item_grupo ?? null,
      item_icone: o.item_icone ?? null,
      item_unidade: o.item_unidade ?? null,
      valor: numOuNulo(o.valor),
      descricao: String(o.descricao),
      origem_provavel: o.origem_provavel ?? null,
      expedicao_numero: num(o.expedicao_numero),
      data_campo: String(o.data_campo),
      ponto_geojson: String(o.ponto_geojson),
    }));

    const fotos: PubFotoGeorreferenciada[] = (fotosRes.data ?? []).map((f) => ({
      id: num(f.id),
      pontual_id: num(f.pontual_id),
      storage_path: String(f.storage_path),
      legenda: f.legenda ?? null,
      publicada_em: f.publicada_em ?? null,
      escola_slug: String(f.escola_slug),
      escola_nome: String(f.escola_nome),
      protocolo: String(f.protocolo),
      protocolo_icone: f.protocolo_icone ?? null,
      protocolo_cor: f.protocolo_cor ?? null,
      item_nome: f.item_nome ?? null,
      item_icone: f.item_icone ?? null,
      item_unidade: f.item_unidade ?? null,
      valor: numOuNulo(f.valor),
      ocorrencia: String(f.ocorrencia),
      origem_provavel: f.origem_provavel ?? null,
      expedicao_numero: num(f.expedicao_numero),
      data_campo: String(f.data_campo),
      ponto_geojson: String(f.ponto_geojson),
    }));

    const galeria: PubGaleria[] = (galeriaRes.data ?? []).map((g) => ({
      id: num(g.id),
      storage_path: String(g.storage_path),
      legenda: g.legenda ?? null,
      publicada_em: g.publicada_em ?? null,
      escola_slug: String(g.escola_slug),
      expedicao_numero: numOuNulo(g.expedicao_numero),
    }));

    return { escola, indicador, expedicoes, ocorrencias, fotos, galeria, disponivel: true, erro: null };
  } catch (err) {
    return { ...VAZIO, erro: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * URL assinada de um arquivo no Storage.
 *
 * O bucket é privado: a `pub_foto_georreferenciada` entrega
 * `storage_path` a quem não tem login, e com bucket público nem a
 * curadoria do professor nem o `termos_ok` da escola protegeriam a
 * foto. A assinatura passa pelas políticas do storage — o anônimo só
 * consegue assinar foto curada, de escola publicada e com termo.
 */
export async function urlAssinadaDaFoto(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("evidencias")
    .createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

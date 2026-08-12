/**
 * Registro de ocorrência direto do campo.
 *
 * É o caminho do celular: GPS, foto e o item observado, sem passar pela
 * ficha de papel. A ficha continua valendo para as contagens (RES e
 * MIC, que são amostragem por área); a ocorrência pontual — o entulho,
 * o esgoto, a supressão, o encalhe — nasce onde o aluno está.
 *
 * Tudo passa pelo RLS com a sessão do professor. A foto sobe para o
 * bucket privado na pasta da escola; entra como evidência despublicada
 * e só chega à galeria pública com curadoria e termo de imagem.
 */

import { supabase } from "./supabase";
import type { RegistroDeCampo } from "./fila-campo";

export interface ExpedicaoAberta {
  id: number;
  numero: number;
  titulo: string | null;
  data_campo: string;
  escola_id: number;
  escola_nome: string;
}

export interface ItemDeCampo {
  id: number;
  codigo: string;
  nome: string;
  icone: string | null;
  unidade: string | null;
}

export interface ProtocoloDeCampo {
  versao_id: number;
  codigo: string;
  nome: string;
  cor: string | null;
  icone: string | null;
  /** O método de campo aprovado. Vale mais aqui do que na ficha: é o
   *  lugar onde o aluno está prestes a se aproximar da ocorrência. */
  metodo: string | null;
  itens: ItemDeCampo[];
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function primeiro<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

/** Expedições em rascunho: são as que ainda recebem registro de campo. */
export async function listarExpedicoesAbertas(): Promise<ExpedicaoAberta[]> {
  const { data, error } = await supabase
    .from("expedicao")
    .select("id, numero, titulo, data_campo, escola_id, escola:escola_id (nome)")
    .eq("status", "rascunho")
    .order("data_campo", { ascending: false });
  if (error) return [];
  return (data ?? []).map((x) => ({
    id: num(x.id),
    numero: num(x.numero),
    titulo: x.titulo ?? null,
    data_campo: String(x.data_campo),
    escola_id: num(x.escola_id),
    escola_nome: primeiro(x.escola as { nome: string } | { nome: string }[])?.nome ?? "",
  }));
}

/**
 * Protocolos de ocorrência, com seus itens.
 *
 * RES e MIC ficam de fora: são protocolos de densidade, contados por
 * área amostrada na ficha — um registro avulso sem esforço amostral
 * não vira densidade e só sujaria o dado.
 */
export async function listarProtocolosDeCampo(): Promise<ProtocoloDeCampo[]> {
  const { data, error } = await supabase
    .from("protocolo_versao")
    .select(
      "id, ativa, metodo, protocolo:protocolo_id (codigo, nome, cor, icone, forma_agregacao), protocolo_item (id, codigo, nome, icone, unidade, ordem)"
    )
    .eq("ativa", true);
  if (error) return [];

  type P = { codigo: string; nome: string; cor: string | null; icone: string | null; forma_agregacao: string };
  type I = { id: number; codigo: string; nome: string; icone: string | null; unidade: string | null; ordem: number };

  return (data ?? [])
    .map((v) => {
      const p = primeiro(v.protocolo as P | P[]);
      if (!p || p.forma_agregacao === "densidade") return null;
      return {
        versao_id: num(v.id),
        codigo: String(p.codigo),
        nome: String(p.nome),
        cor: p.cor ?? null,
        icone: p.icone ?? null,
        metodo: v.metodo ?? null,
        itens: ((v.protocolo_item ?? []) as I[])
          .sort((a, b) => a.ordem - b.ordem)
          .map((i) => ({
            id: num(i.id),
            codigo: String(i.codigo),
            nome: String(i.nome),
            icone: i.icone ?? null,
            unidade: i.unidade ?? null,
          })),
      };
    })
    .filter((p): p is ProtocoloDeCampo => p !== null)
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
}

/**
 * Reduz a foto antes do envio. Na praia a conexão é a pior possível, e
 * uma foto de celular moderno passa de 5 MB — 1600 px de lado maior em
 * JPEG dá conta da evidência.
 */
export async function reduzirFoto(arquivo: File, maxLado = 1600): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && arquivo.size < 1_500_000) return arquivo;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return arquivo;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? arquivo), "image/jpeg", 0.85)
    );
  } catch {
    return arquivo;
  }
}

/**
 * Grava o registro: a ocorrência sempre, a foto quando houver.
 *
 * A ordem importa: primeiro a ocorrência, porque a evidência aponta
 * para ela. Se a foto falhar depois de a ocorrência entrar, o registro
 * de dado sobrevive e o erro diz que só a foto ficou de fora.
 */
export async function enviarRegistro(
  r: RegistroDeCampo,
  foto: Blob | null
): Promise<{ erro: string | null; soFotoFalhou: boolean }> {
  const { data: pontual, error: erroPontual } = await supabase
    .from("observacao_pontual")
    .insert({
      expedicao_id: r.expedicaoId,
      versao_id: r.versaoId,
      item_id: r.itemId,
      valor: r.valor,
      descricao: r.descricao,
      origem_provavel: r.origemProvavel,
      geom: `SRID=4326;POINT(${r.lng} ${r.lat})`,
    })
    .select("id")
    .single();

  if (erroPontual) return { erro: erroPontual.message, soFotoFalhou: false };

  if (!foto) return { erro: null, soFotoFalhou: false };

  const caminho = `escola-${r.escolaId}/exp-${r.expedicaoId}/${Date.now()}.jpg`;
  const { error: erroUpload } = await supabase.storage
    .from("evidencias")
    .upload(caminho, foto, { contentType: "image/jpeg" });
  if (erroUpload) return { erro: erroUpload.message, soFotoFalhou: true };

  const { data: sessao } = await supabase.auth.getUser();
  const { error: erroEvidencia } = await supabase.from("evidencia").insert({
    escola_id: r.escolaId,
    expedicao_id: r.expedicaoId,
    pontual_id: num(pontual.id),
    tipo: "foto_campo",
    storage_path: caminho,
    legenda: r.legenda,
    criado_por: sessao.user?.id ?? null,
  });
  if (erroEvidencia) return { erro: erroEvidencia.message, soFotoFalhou: true };

  return { erro: null, soFotoFalhou: false };
}

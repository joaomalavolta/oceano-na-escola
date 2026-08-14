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

/**
 * Expedições em rascunho: são as que ainda recebem registro de campo.
 *
 * Devolve `null` quando não deu para perguntar, e `[]` só quando a
 * resposta veio e estava vazia. A diferença decide a tela: lista vazia é
 * "abra uma saída antes"; falha é "estamos sem rede" — e antes as duas
 * viravam a mesma coisa, o que fazia a página anunciar que não havia
 * expedição nenhuma justamente quando ela não conseguia olhar.
 */
export async function listarExpedicoesAbertas(): Promise<ExpedicaoAberta[] | null> {
  // Só as escolas em que dá para escrever. A política de leitura de
  // `expedicao` também deixa passar o pesquisador, que enxerga os
  // rascunhos da rede inteira e não pode registrar em nenhum: sem este
  // recorte, o seletor ofereceria expedição que o registro recusa.
  const { data: escolas, error: erroEscolas } = await supabase.rpc("app_escolas_que_posso_usar");
  if (erroEscolas) return null;
  const ids = ((escolas ?? []) as { id: number }[]).map((e) => num(e.id));
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("expedicao")
    .select("id, numero, titulo, data_campo, escola_id, escola:escola_id (nome)")
    .eq("status", "rascunho")
    .in("escola_id", ids)
    .order("data_campo", { ascending: false });
  if (error) return null;
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
export async function listarProtocolosDeCampo(): Promise<ProtocoloDeCampo[] | null> {
  const { data, error } = await supabase
    .from("protocolo_versao")
    .select(
      "id, ativa, metodo, protocolo:protocolo_id (codigo, nome, cor, icone, forma_agregacao), protocolo_item (id, codigo, nome, icone, unidade, ordem)"
    )
    .eq("ativa", true);
  if (error) return null;

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
 * O catálogo guardado no aparelho: expedições abertas e protocolos.
 *
 * Sem isto, o modo offline não existia de fato. A fila em IndexedDB
 * guarda o que foi registrado, mas para registrar é preciso antes
 * escolher expedição, protocolo e item — e essas listas vêm do banco.
 * Sem rede, a página abria sem nenhuma delas e o formulário nem
 * chegava a aparecer: a fila ficava inalcançável exatamente na praia,
 * que é o lugar para o qual foi construída.
 *
 * Fica em localStorage, e não em IndexedDB como a fila: é texto pequeno
 * e a fila só está lá porque precisa guardar a foto.
 */
const CHAVE_CATALOGO = "oceano.campo.catalogo";

export interface CatalogoDeCampo {
  expedicoes: ExpedicaoAberta[];
  protocolos: ProtocoloDeCampo[];
  /** Quando foi guardado, para a tela poder dizer de quando é a lista. */
  em: string;
}

export function guardarCatalogo(expedicoes: ExpedicaoAberta[], protocolos: ProtocoloDeCampo[]): void {
  try {
    const c: CatalogoDeCampo = { expedicoes, protocolos, em: new Date().toISOString() };
    window.localStorage.setItem(CHAVE_CATALOGO, JSON.stringify(c));
  } catch {
    // Cota cheia ou modo privado: seguir sem cache é pior, não fatal.
  }
}

export function catalogoGuardado(): CatalogoDeCampo | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE_CATALOGO);
    if (!bruto) return null;
    const c = JSON.parse(bruto) as CatalogoDeCampo;
    return Array.isArray(c.expedicoes) && Array.isArray(c.protocolos) ? c : null;
  } catch {
    return null;
  }
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

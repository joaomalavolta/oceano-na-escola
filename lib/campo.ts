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
import { juntarMarcas, somaDosItens, type LixoNoPonto } from "./lixo-no-mar";

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

/** Um item da lista de RES, usado na contagem por tipo do Lixo no mar. */
export interface ItemDeResiduo {
  id: number;
  nome: string;
  grupo: string;
}

/**
 * A lista de itens de RES, na ordem da ficha. É a lista aprovada de
 * resíduos; o Lixo no mar a usa para contar por tipo, e assim os dois
 * protocolos falam a mesma língua.
 */
export async function listarItensDeResiduo(): Promise<ItemDeResiduo[] | null> {
  const { data, error } = await supabase
    .from("protocolo_versao")
    .select("id, protocolo:protocolo_id!inner (codigo), protocolo_item (id, nome, grupo, ordem)")
    .eq("ativa", true)
    .eq("protocolo.codigo", "RES");
  if (error) return null;
  type I = { id: number; nome: string; grupo: string; ordem: number };
  const itens = ((data ?? [])[0]?.protocolo_item ?? []) as I[];
  return itens
    .sort((a, b) => a.ordem - b.ordem)
    .map((i) => ({ id: num(i.id), nome: String(i.nome), grupo: String(i.grupo) }));
}

/**
 * Marcas já registradas na rede, para sugerir ao digitar. Vem do ranking
 * público: escrever igual ao que já existe é o que faz a contagem somar.
 */
export async function listarMarcasConhecidas(): Promise<string[]> {
  const { data, error } = await supabase
    .from("pub_ranking_marcas")
    .select("marca")
    .order("itens", { ascending: false })
    .limit(300);
  if (error) return [];
  return (data ?? []).map((m) => String(m.marca));
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
  /** Ausente em cópias guardadas antes do Lixo no mar. */
  itensDeResiduo?: ItemDeResiduo[];
  marcas?: string[];
  /** Quando foi guardado, para a tela poder dizer de quando é a lista. */
  em: string;
}

export function guardarCatalogo(
  expedicoes: ExpedicaoAberta[],
  protocolos: ProtocoloDeCampo[],
  extras: { itensDeResiduo?: ItemDeResiduo[]; marcas?: string[] } = {}
): void {
  try {
    // O que não veio agora fica como estava: uma falha na lista de marcas
    // não pode apagar a cópia que o aparelho já tinha.
    const antes = catalogoGuardado();
    const c: CatalogoDeCampo = {
      expedicoes,
      protocolos,
      itensDeResiduo: extras.itensDeResiduo ?? antes?.itensDeResiduo ?? [],
      marcas: extras.marcas ?? antes?.marcas ?? [],
      em: new Date().toISOString(),
    };
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

  // O detalhe do lixo vai junto com a ocorrência, ou nenhum dos dois:
  // se falhar, a ocorrência sai, para o reenvio da fila não duplicá-la.
  if (r.lixo) {
    const erroLixo = await gravarLixo(num(pontual.id), r.lixo);
    if (erroLixo) {
      await supabase.from("observacao_pontual").delete().eq("id", num(pontual.id));
      return { erro: erroLixo, soFotoFalhou: false };
    }
  }

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

/** Grava quantidade, contagem por tipo e marcas de um ponto de Lixo no mar. */
async function gravarLixo(pontualId: number, l: LixoNoPonto): Promise<string | null> {
  if (l.quantidadeEstimada !== null || l.sacos !== null || l.material !== null) {
    const { error } = await supabase.from("lixo_no_ponto").insert({
      pontual_id: pontualId,
      quantidade_estimada: l.quantidadeEstimada,
      sacos: l.sacos,
      litros_por_saco: l.sacos !== null ? l.litrosPorSaco : null,
      material: l.material,
    });
    if (error) return error.message;
  }

  if (somaDosItens(l) > 0) {
    const linhas = Object.entries(l.itens)
      .filter(([, n]) => n > 0)
      .map(([itemId, n]) => ({ pontual_id: pontualId, item_id: Number(itemId), quantidade: n }));
    const { error } = await supabase.from("lixo_no_ponto_item").insert(linhas);
    if (error) return error.message;
  }

  const marcas = juntarMarcas(l.marcas);
  if (marcas.length > 0) {
    const { error } = await supabase
      .from("lixo_no_ponto_marca")
      .insert(marcas.map((m) => ({ pontual_id: pontualId, marca: m.marca, quantidade: m.quantidade })));
    if (error) return error.message;
  }
  return null;
}

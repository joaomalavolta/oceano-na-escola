/**
 * Super administração: editar e excluir qualquer conteúdo da rede.
 *
 * Quem decide é o banco. Excluir escola e remover conta com trabalho
 * passam por funções que conferem `app_is_super()`; o resto (saída,
 * ocorrência, foto, mural, história, item de protocolo) já era permitido
 * à administração pela regra de vínculo, e esta camada só junta tudo
 * numa tela.
 *
 * Arquivos: excluir uma linha do banco não apaga a foto no Storage. Por
 * isso cada exclusão aqui segue a mesma ordem — pega a lista de
 * arquivos, exclui no banco e, confirmada a exclusão, apaga os arquivos.
 * Se o banco recusar, nenhuma foto some; se os arquivos falharem depois,
 * sobra arquivo sem dono, que não aparece em lugar nenhum.
 */

import { supabase } from "./supabase";

export async function souSuper(): Promise<boolean> {
  const { data, error } = await supabase.rpc("app_is_super");
  return !error && data === true;
}

/** Apaga arquivos do bucket em lotes. Devolve quantos não saíram. */
async function apagarArquivos(caminhos: string[]): Promise<number> {
  let falhas = 0;
  const unicos = [...new Set(caminhos.filter(Boolean))];
  for (let i = 0; i < unicos.length; i += 100) {
    const lote = unicos.slice(i, i + 100);
    const { error } = await supabase.storage.from("evidencias").remove(lote);
    if (error) falhas += lote.length;
  }
  return falhas;
}

function avisoDeArquivos(falhas: number): string | null {
  return falhas > 0
    ? `Excluído. ${falhas} arquivo(s) de foto não saíram do armazenamento; ficam sem dono e não aparecem em lugar nenhum.`
    : null;
}

async function caminhosDe(filtro: { coluna: "expedicao_id" | "pontual_id" | "publicacao_id"; id: number }) {
  const { data } = await supabase.from("evidencia").select("storage_path").eq(filtro.coluna, filtro.id);
  return (data ?? []).map((e) => String(e.storage_path));
}

export interface Resultado {
  erro: string | null;
  aviso: string | null;
}

// ── Escola ────────────────────────────────────────────────────────────

export async function excluirEscola(id: number, nomeDigitado: string): Promise<Resultado> {
  const { data: arquivos, error: erroLista } = await supabase.rpc("super_arquivos_da_escola", { p_escola_id: id });
  if (erroLista) return { erro: erroLista.message, aviso: null };
  const { error } = await supabase.rpc("super_exclui_escola", { p_escola_id: id, p_nome_confirmado: nomeDigitado });
  if (error) return { erro: error.message, aviso: null };
  const falhas = await apagarArquivos(((arquivos ?? []) as string[]).map(String));
  return { erro: null, aviso: avisoDeArquivos(falhas) };
}

// ── Pessoa ────────────────────────────────────────────────────────────

/** Remove a conta; o trabalho dela fica, sem autor. */
export async function removerContaComTrabalho(id: string): Promise<Resultado> {
  const { error } = await supabase.rpc("super_remove_conta", { p_id: id });
  return { erro: error?.message ?? null, aviso: null };
}

// ── Saídas ────────────────────────────────────────────────────────────

export interface SaidaDaRede {
  id: number;
  numero: number;
  titulo: string | null;
  data_campo: string;
  status: string;
  escola_nome: string;
  ocorrencias: number;
}

type Emb<T> = T | T[] | null;
const um = <T,>(v: Emb<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export async function listarSaidas(): Promise<SaidaDaRede[]> {
  const { data, error } = await supabase
    .from("expedicao")
    .select("id, numero, titulo, data_campo, status, escola:escola_id (nome), observacao_pontual (count)")
    .order("data_campo", { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []).map((x) => ({
    id: Number(x.id),
    numero: Number(x.numero),
    titulo: x.titulo ?? null,
    data_campo: String(x.data_campo),
    status: String(x.status),
    escola_nome: um(x.escola as Emb<{ nome: string }>)?.nome ?? "",
    ocorrencias: Number(um(x.observacao_pontual as Emb<{ count: number }>)?.count ?? 0),
  }));
}

export async function excluirSaida(id: number): Promise<Resultado> {
  const caminhos = await caminhosDe({ coluna: "expedicao_id", id });
  const { error } = await supabase.from("expedicao").delete().eq("id", id);
  if (error) return { erro: error.message, aviso: null };
  return { erro: null, aviso: avisoDeArquivos(await apagarArquivos(caminhos)) };
}

// ── Ocorrências (pinos) ───────────────────────────────────────────────

export interface OcorrenciaDaRede {
  id: number;
  descricao: string;
  valor: number | null;
  origem_provavel: string | null;
  item: string | null;
  unidade: string | null;
  protocolo: string;
  cor: string | null;
  icone: string | null;
  item_icone: string | null;
  escola_nome: string;
  expedicao_id: number;
  expedicao_numero: number;
  data_campo: string;
  status: string;
  fotos: number;
}

export async function listarOcorrencias(): Promise<OcorrenciaDaRede[]> {
  const { data, error } = await supabase
    .from("observacao_pontual")
    .select(
      "id, descricao, valor, origem_provavel, item:item_id (nome, unidade, icone), versao:versao_id (protocolo:protocolo_id (codigo, cor, icone)), expedicao:expedicao_id (id, numero, data_campo, status, escola:escola_id (nome)), evidencia (count)"
    )
    .order("id", { ascending: false })
    .limit(1000);
  if (error) return [];
  return (data ?? []).map((o) => {
    const item = um(o.item as Emb<{ nome: string; unidade: string | null; icone: string | null }>);
    const versao = um(o.versao as Emb<{ protocolo: Emb<{ codigo: string; cor: string | null; icone: string | null }> }>);
    const p = um(versao?.protocolo ?? null);
    const x = um(o.expedicao as Emb<{ id: number; numero: number; data_campo: string; status: string; escola: Emb<{ nome: string }> }>);
    return {
      id: Number(o.id),
      descricao: String(o.descricao),
      valor: o.valor === null ? null : Number(o.valor),
      origem_provavel: o.origem_provavel ?? null,
      item: item?.nome ?? null,
      unidade: item?.unidade ?? null,
      protocolo: p?.codigo ?? "—",
      cor: p?.cor ?? null,
      icone: p?.icone ?? null,
      item_icone: item?.icone ?? null,
      escola_nome: um(x?.escola ?? null)?.nome ?? "",
      expedicao_id: Number(x?.id ?? 0),
      expedicao_numero: Number(x?.numero ?? 0),
      data_campo: String(x?.data_campo ?? ""),
      status: String(x?.status ?? ""),
      fotos: Number(um(o.evidencia as Emb<{ count: number }>)?.count ?? 0),
    };
  });
}

export async function editarOcorrencia(
  id: number,
  d: { descricao: string; valor: number | null; origem_provavel: string | null }
): Promise<Resultado> {
  if (d.descricao.trim() === "") return { erro: "A descrição não pode ficar vazia.", aviso: null };
  const { error } = await supabase
    .from("observacao_pontual")
    .update({ descricao: d.descricao.trim(), valor: d.valor, origem_provavel: d.origem_provavel?.trim() || null })
    .eq("id", id);
  return { erro: error?.message ?? null, aviso: null };
}

export async function excluirOcorrencia(id: number): Promise<Resultado> {
  const caminhos = await caminhosDe({ coluna: "pontual_id", id });
  const { error } = await supabase.from("observacao_pontual").delete().eq("id", id);
  if (error) return { erro: error.message, aviso: null };
  return { erro: null, aviso: avisoDeArquivos(await apagarArquivos(caminhos)) };
}

// ── Mural e histórias ─────────────────────────────────────────────────

export interface TextoDaRede {
  tipo: "mural" | "historia";
  id: number;
  titulo: string;
  publicada: boolean;
  criado_em: string;
  escola_nome: string;
}

export async function listarTextos(): Promise<TextoDaRede[]> {
  const [mural, historias] = await Promise.all([
    supabase.from("mural_publicacao").select("id, texto, publicada, criado_em, escola:escola_id (nome)").order("criado_em", { ascending: false }).limit(300),
    supabase.from("historia").select("id, titulo, publicada, criado_em, escola:escola_id (nome)").order("criado_em", { ascending: false }).limit(300),
  ]);
  const m: TextoDaRede[] = (mural.data ?? []).map((x) => ({
    tipo: "mural",
    id: Number(x.id),
    titulo: String(x.texto ?? "").slice(0, 140) || "(publicação só com mídia)",
    publicada: Boolean(x.publicada),
    criado_em: String(x.criado_em),
    escola_nome: um(x.escola as Emb<{ nome: string }>)?.nome ?? "",
  }));
  const h: TextoDaRede[] = (historias.data ?? []).map((x) => ({
    tipo: "historia",
    id: Number(x.id),
    titulo: String(x.titulo ?? "Sem título"),
    publicada: Boolean(x.publicada),
    criado_em: String(x.criado_em),
    escola_nome: um(x.escola as Emb<{ nome: string }>)?.nome ?? "",
  }));
  return [...m, ...h].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
}

export async function excluirTexto(t: Pick<TextoDaRede, "tipo" | "id">): Promise<Resultado> {
  if (t.tipo === "historia") {
    const { error } = await supabase.from("historia").delete().eq("id", t.id);
    return { erro: error?.message ?? null, aviso: null };
  }
  const caminhos = await caminhosDe({ coluna: "publicacao_id", id: t.id });
  const { error } = await supabase.from("mural_publicacao").delete().eq("id", t.id);
  if (error) return { erro: error.message, aviso: null };
  return { erro: null, aviso: avisoDeArquivos(await apagarArquivos(caminhos)) };
}

// ── Itens dos protocolos ──────────────────────────────────────────────

export interface ItemEditavel {
  id: number;
  codigo: string;
  nome: string;
  grupo: string;
  unidade: string | null;
  icone: string | null;
  ordem: number;
}

export interface ProtocoloEditavel {
  codigo: string;
  nome: string;
  cor: string | null;
  icone: string | null;
  versao_id: number;
  versao: string;
  itens: ItemEditavel[];
}

export async function listarProtocolosEditaveis(): Promise<ProtocoloEditavel[]> {
  const { data, error } = await supabase
    .from("protocolo_versao")
    .select("id, versao, ativa, protocolo:protocolo_id (codigo, nome, cor, icone), protocolo_item (id, codigo, nome, grupo, unidade, icone, ordem)")
    .eq("ativa", true);
  if (error) return [];
  return (data ?? [])
    .map((v) => {
      const p = um(v.protocolo as Emb<{ codigo: string; nome: string; cor: string | null; icone: string | null }>);
      return {
        codigo: p?.codigo ?? "—",
        nome: p?.nome ?? "",
        cor: p?.cor ?? null,
        icone: p?.icone ?? null,
        versao_id: Number(v.id),
        versao: String(v.versao),
        itens: ((v.protocolo_item ?? []) as ItemEditavel[])
          .map((i) => ({ ...i, id: Number(i.id), ordem: Number(i.ordem) }))
          .sort((a, b) => a.ordem - b.ordem),
      };
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export async function salvarItem(
  id: number,
  d: Pick<ItemEditavel, "nome" | "grupo" | "unidade" | "icone">
): Promise<Resultado> {
  if (d.nome.trim() === "" || d.grupo.trim() === "") return { erro: "Nome e grupo são obrigatórios.", aviso: null };
  const { error } = await supabase
    .from("protocolo_item")
    .update({ nome: d.nome.trim(), grupo: d.grupo.trim(), unidade: d.unidade?.trim() || null, icone: d.icone?.trim() || null })
    .eq("id", id);
  return { erro: error?.message ?? null, aviso: null };
}

/**
 * Item novo no fim da lista. O código segue o do protocolo: LIM06, LIM07…
 * O próximo número é o maior que já existe mais um.
 */
export async function criarItem(p: ProtocoloEditavel, d: Pick<ItemEditavel, "nome" | "grupo" | "unidade">): Promise<Resultado> {
  if (d.nome.trim() === "" || d.grupo.trim() === "") return { erro: "Nome e grupo são obrigatórios.", aviso: null };
  const numeros = p.itens.map((i) => Number(i.codigo.replace(/\D/g, ""))).filter(Number.isFinite);
  const codigo = `${p.codigo}${String((numeros.length ? Math.max(...numeros) : 0) + 1).padStart(2, "0")}`;
  const ordem = (p.itens.length ? Math.max(...p.itens.map((i) => i.ordem)) : 0) + 1;
  const { error } = await supabase.from("protocolo_item").insert({
    versao_id: p.versao_id,
    codigo,
    nome: d.nome.trim(),
    grupo: d.grupo.trim(),
    unidade: d.unidade?.trim() || null,
    ordem,
  });
  return { erro: error?.message ?? null, aviso: null };
}

/** Só sai o item que nunca foi usado: o usado está amarrado a dados. */
export async function excluirItem(id: number): Promise<Resultado> {
  const { error } = await supabase.from("protocolo_item").delete().eq("id", id);
  if (error?.code === "23503")
    return {
      erro: "Este item já foi usado em registros e não pode ser excluído — excluir apagaria o sentido desses dados. Dá para renomeá-lo.",
      aviso: null,
    };
  return { erro: error?.message ?? null, aviso: null };
}

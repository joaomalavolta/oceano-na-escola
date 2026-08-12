/**
 * Cadastro de escola e turmas.
 *
 * Escreve pelo RLS, com a sessão do professor. O vínculo entre quem
 * cadastra e a escola criada não é feito aqui: quem o cria é o trigger
 * `trg_escola_vincula_criador`, no banco. Fazê-lo pelo cliente exigiria
 * conceder insert em `vinculo_escola` a qualquer autenticado, e aí
 * qualquer pessoa se vincularia a qualquer escola.
 */

import { supabase } from "./supabase";

export interface Municipio {
  id: number;
  nome: string;
  uf: string;
}

export interface DadosCadastro {
  nome: string;
  municipio_id: number;
  rede_ensino: string;
  endereco: string;
  apresentacao: string;
  /** Nulos quando a escola é aberta no meio de outra tarefa. A escola
   *  só aparece no mapa com coordenada, e ela pode chegar depois. */
  lat: number | null;
  lng: number | null;
  termosOk: boolean;
  turmas: { nome: string; ano_letivo: number; nivel: string }[];
}

export interface ResultadoCadastro {
  slug: string | null;
  erro: string | null;
  /** O id da escola criada, para quem precisa continuar usando-a. */
  id?: number | null;
}

/**
 * Município é tabela de referência: só o Ecosurf insere. O professor
 * escolhe de uma lista, para que o indicador por município não se parta
 * entre grafias diferentes da mesma cidade.
 */
export async function listarMunicipios(): Promise<Municipio[]> {
  const { data, error } = await supabase
    .from("municipio")
    .select("id, nome, uf")
    .order("nome");
  if (error) return [];
  return (data ?? []).map((m) => ({
    id: Number(m.id),
    nome: String(m.nome),
    uf: String(m.uf),
  }));
}

function gerarSlug(nome: string): string {
  return (
    nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "escola"
  );
}

export async function cadastrarEscola(d: DadosCadastro): Promise<ResultadoCadastro> {
  const base = gerarSlug(d.nome);

  // O slug é único no banco. Em vez de deixar a inserção falhar com erro
  // de constraint, procuramos um livre antes — duas escolas com nome
  // parecido em municípios diferentes são caso normal, não erro.
  let slug = base;
  for (let tentativa = 2; tentativa <= 20; tentativa++) {
    const { data } = await supabase.from("escola").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${tentativa}`;
  }

  const { data: criada, error } = await supabase
    .from("escola")
    .insert({
      municipio_id: d.municipio_id,
      nome: d.nome,
      slug,
      rede_ensino: d.rede_ensino,
      endereco: d.endereco,
      apresentacao: d.apresentacao,
      geom:
        d.lat !== null && d.lng !== null ? `SRID=4326;POINT(${d.lng} ${d.lat})` : null,
    })
    .select("id, slug")
    .single();

  if (error) return { slug: null, id: null, erro: error.message };

  const escolaId = Number(criada.id);

  // `publicada` e `termos_ok` não entram no insert: as colunas não são
  // concedidas ao papel authenticated, justamente para que ninguém
  // publique escola no mapa apenas cadastrando. O termo é declaração da
  // escola e vai por update, depois do vínculo existir.
  if (d.termosOk) {
    const { error: erroTermos } = await supabase
      .from("escola")
      .update({ termos_ok: true })
      .eq("id", escolaId);
    if (erroTermos) return { slug, id: escolaId, erro: erroTermos.message };
  }

  const turmas = d.turmas.filter((t) => t.nome.trim() !== "");
  if (turmas.length > 0) {
    const { error: erroTurmas } = await supabase.from("turma").insert(
      turmas.map((t) => ({
        escola_id: escolaId,
        nome: t.nome.trim(),
        ano_letivo: t.ano_letivo,
        nivel: t.nivel,
      }))
    );
    if (erroTurmas) return { slug, id: escolaId, erro: erroTurmas.message };
  }

  return { slug, id: escolaId, erro: null };
}

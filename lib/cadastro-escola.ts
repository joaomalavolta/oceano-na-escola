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

  // O slug é único na tabela inteira, mas o RLS só deixa o professor
  // enxergar as escolas dele. Procurar um slug livre com um select antes
  // de inserir não funcionava: a consulta não via a escola alheia que já
  // ocupava o nome, dava o slug por livre, e o insert estourava com o
  // texto cru da constraint.
  //
  // Então tenta-se inserir e trata-se a colisão, que é o único jeito de
  // saber o que existe sem poder ler. Duas escolas com nome parecido em
  // municípios diferentes são caso normal, não erro.
  let escolaId: number | null = null;
  let slug = base;

  for (let tentativa = 1; tentativa <= 20; tentativa += 1) {
    slug = tentativa === 1 ? base : `${base}-${tentativa}`;

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

    if (!error) {
      escolaId = Number(criada.id);
      break;
    }
    // 23505 é a colisão de slug: tenta o próximo sufixo. Qualquer outro
    // erro é do cadastro em si e volta para a tela como está.
    if (error.code !== "23505") return { slug: null, id: null, erro: error.message };
  }

  if (escolaId === null) {
    return {
      slug: null,
      id: null,
      erro: "Já existem muitas escolas com um nome parecido. Diferencie o nome e tente de novo.",
    };
  }

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

/**
 * Os dois tipos de organização que participam da plataforma.
 *
 * A escola regular e a escola de surf (programa Guardiões Ecosurf) usam
 * o mesmo sistema: mesmos protocolos, mesmo mapa, mesma análise de
 * cadastro. O que muda é a língua. Ninguém numa escola de surf é
 * "professor responsável pelo 7º ano B" — é instrutor de uma turma de
 * aula —, e uma tela que insiste no vocabulário da escola regular diz a
 * quem chega que aquele lugar não foi feito para ele.
 *
 * Por isso os termos moram aqui, num lugar só. Tela nenhuma decide
 * sozinha como chamar o responsável: pergunta a este arquivo.
 */

export type TipoOrganizacao = "regular" | "surf";

export const TIPOS: TipoOrganizacao[] = ["regular", "surf"];

/** Banco antigo, mock ou view sem a coluna: tudo que não for surf é regular. */
export function tipoDe(bruto: unknown): TipoOrganizacao {
  return bruto === "surf" ? "surf" : "regular";
}

export interface Vocabulario {
  /** "Escola" / "Escola de surf" */
  organizacao: string;
  organizacoes: string;
  /** Com artigo, para frase corrida: "a escola" / "a escola de surf" */
  aOrganizacao: string;
  /** "Professor" / "Instrutor" */
  responsavel: string;
  responsaveis: string;
  /** "Turma" / "Turma de aula" */
  grupo: string;
  grupos: string;
  /** "Estudantes" / "Alunos de surf" */
  participantes: string;
  /** Exemplo para o campo de nome, no cadastro. */
  exemploDeNome: string;
  exemploDeGrupo: string;
  /** As faixas que o cadastro oferece para o grupo. */
  niveis: string[];
  nivelPadrao: string;
  /** Rótulos dos dois campos do grupo: "Ano letivo"/"Nível", "Ano"/"Faixa". */
  rotuloAno: string;
  rotuloNivel: string;
  /** Rótulo do número de atendidos, na ficha e na página pública. */
  rotuloAtendidos: string;
  /** A escola regular tem rede de ensino; a de surf não. */
  temRedeDeEnsino: boolean;
  /** Uma linha dizendo o que é participar, para o cartão de escolha. */
  descricao: string;
}

const REGULAR: Vocabulario = {
  organizacao: "Escola",
  organizacoes: "Escolas",
  aOrganizacao: "a escola",
  responsavel: "Professor",
  responsaveis: "Professores",
  grupo: "Turma",
  grupos: "Turmas",
  participantes: "Estudantes",
  exemploDeNome: "E.M. Professora Maria da Silva",
  exemploDeGrupo: "7º ano A",
  niveis: ["Fundamental I", "Fundamental II", "Médio", "EJA"],
  nivelPadrao: "Fundamental II",
  rotuloAno: "Ano letivo",
  rotuloNivel: "Nível",
  rotuloAtendidos: "Estudantes participantes",
  temRedeDeEnsino: true,
  descricao:
    "Escola de ensino regular. As turmas saem a campo em expedições planejadas, com o professor.",
};

const SURF: Vocabulario = {
  organizacao: "Escola de surf",
  organizacoes: "Escolas de surf",
  aOrganizacao: "a escola de surf",
  responsavel: "Instrutor",
  responsaveis: "Instrutores",
  grupo: "Turma de aula",
  grupos: "Turmas de aula",
  participantes: "Alunos de surf",
  exemploDeNome: "Escola de Surf Maré Alta",
  exemploDeGrupo: "Turma das 7h",
  // Faixas de idade, e não de série: é como uma escola de surf divide
  // as próprias aulas. São rótulos de cadastro, sem peso no dado.
  niveis: ["Infantil", "Juvenil", "Adulto", "Misto"],
  nivelPadrao: "Misto",
  rotuloAno: "Ano",
  rotuloNivel: "Faixa",
  rotuloAtendidos: "Alunos atendidos",
  temRedeDeEnsino: false,
  descricao:
    "Programa Guardiões Ecosurf. O instrutor e os alunos monitoram a praia onde já estão quase todo dia.",
};

const POR_TIPO: Record<TipoOrganizacao, Vocabulario> = { regular: REGULAR, surf: SURF };

export function vocabulario(tipo: TipoOrganizacao | string | null | undefined): Vocabulario {
  return POR_TIPO[tipoDe(tipo)];
}

/** Para começar frase com um termo: "a escola de surf" → "A escola de surf". */
export function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * O nome curto que vai na etiqueta do pino, no mapa.
 *
 * A etiqueta só comporta umas três palavras. Para a escola regular isso
 * basta — "E.M. Mapa Verde" —, mas toda escola de surf se chama "Escola
 * de Surf Alguma Coisa", e as três primeiras palavras davam a mesma
 * etiqueta para todas. O pino já diz que é escola de surf; a etiqueta
 * fica com o que distingue uma da outra.
 */
export function rotuloDoPino(nome: string, tipo: TipoOrganizacao): string {
  const limpo = nome.trim();
  const semPrefixo = tipo === "surf" ? limpo.replace(/^escol(a|inha) de surfe?\s+/i, "") : limpo;
  const base = semPrefixo === "" ? limpo : semPrefixo;
  return base.split(/\s+/).slice(0, 3).join(" ");
}

/** O nome do programa a que cada tipo pertence, para selo e rodapé. */
export const PROGRAMA: Record<TipoOrganizacao, string> = {
  regular: "Oceano na Escola",
  surf: "Guardiões Ecosurf",
};

/**
 * Parâmetro de URL do mapa: `/?rede=surf` abre o mapa já recortado.
 * Valor desconhecido é ignorado em vez de virar filtro vazio — link
 * digitado errado mostra o mapa inteiro, não um mapa sem nada.
 */
export function redeDaUrl(valor: string | null | undefined): TipoOrganizacao | "" {
  return valor === "surf" || valor === "regular" ? valor : "";
}

/**
 * O tipo escolhido antes do cadastro, guardado no aparelho.
 *
 * Quem clica em "Cadastrar a minha escola de surf" na página dos
 * Guardiões ainda não tem conta: passa pela tela de entrada, confirma o
 * e-mail, e só então chega ao cadastro. Um parâmetro na URL não
 * sobrevive a esse caminho. É só uma sugestão — o cadastro mostra a
 * escolha e a pessoa troca se quiser —, por isso basta o localStorage.
 */
const CHAVE_TIPO = "oceano.cadastro.tipo";

export function lembrarTipo(tipo: TipoOrganizacao): void {
  try {
    window.localStorage.setItem(CHAVE_TIPO, tipo);
  } catch {
    // Navegação privada ou armazenamento bloqueado: o cadastro abre no
    // padrão, e a pessoa escolhe lá.
  }
}

export function tipoLembrado(): TipoOrganizacao | null {
  try {
    const v = window.localStorage.getItem(CHAVE_TIPO);
    return v === "surf" || v === "regular" ? v : null;
  } catch {
    return null;
  }
}

export function esquecerTipo(): void {
  try {
    window.localStorage.removeItem(CHAVE_TIPO);
  } catch {
    // Nada a desfazer.
  }
}

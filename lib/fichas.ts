/**
 * Fichas de campo para imprimir.
 *
 * O papel continua sendo onde o dado nasce. Uma turma de trinta alunos
 * na praia não tem trinta celulares, e os que existem ficam sem sinal,
 * sem bateria e com a tela ilegível no sol. A ficha impressa é o
 * instrumento; o celular entra só onde o papel não alcança — a
 * coordenada e a foto.
 *
 * Daí o problema central deste arquivo: **como uma linha escrita a
 * lápis se liga a uma foto com GPS que vira um pino no mapa.**
 *
 * A resposta é um código curto, impresso na ficha antes de a turma sair
 * e digitado no aplicativo na hora da foto. Não há mágica: o que faz a
 * ligação existir é uma pessoa escrever o mesmo código nos dois lugares.
 * Por isso o código é curto, legível em voz alta e difícil de confundir
 * — quem vai ditá-lo está com a mão suja de areia.
 */

import type { DefinicaoProtocolo, SecaoProtocolo } from "./transcricao";

/**
 * O código que liga o papel à foto: E2-03, equipe 2, ocorrência 3.
 *
 * Duas casas na sequência porque três seriam otimismo e uma quebraria
 * a ordenação alfabética na hora de conferir — E2-10 viria antes de
 * E2-2 numa lista ordenada como texto.
 */
export function codigoOcorrencia(equipe: number, sequencia: number): string {
  return `E${equipe}-${String(sequencia).padStart(2, "0")}`;
}

/** Reconhece um código escrito à mão, tolerando minúscula e espaço. */
export function lerCodigoOcorrencia(bruto: string): { equipe: number; sequencia: number } | null {
  const m = bruto.trim().toUpperCase().match(/^E\s*(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (!m) return null;
  const equipe = Number(m[1]);
  const sequencia = Number(m[2]);
  if (equipe < 1 || sequencia < 1) return null;
  return { equipe, sequencia };
}

// ── O que cada protocolo pede da ficha ────────────────────────────────

export interface GrupoDeItens {
  grupo: string;
  itens: { id: number; nome: string }[];
}

/**
 * Como a ficha desta equipe é montada.
 *
 * Os sete protocolos não têm a mesma forma: RES conta trinta itens num
 * trecho, MIC preenche uma grade de quadrats, e cinco deles não contam
 * nada — registram ocorrências pontuais. Uma ficha única para os três
 * casos seria uma folha cheia de campos riscados.
 */
export interface Composicao {
  /** Campos do esforço amostral, quando o protocolo tem essa seção. */
  esforco: SecaoProtocolo | null;
  /** Itens agrupados por material, para a tabela de contagem. */
  grupos: GrupoDeItens[];
  /** Colunas da grade de quadrats (microplásticos). */
  quadrat: SecaoProtocolo | null;
  /** Perguntas abertas do fim da ficha. */
  qualitativo: SecaoProtocolo | null;
  /** Campos extras da seção de registro pontual, como "origem provável". */
  pontual: SecaoProtocolo | null;
  /**
   * O protocolo se resolve por ocorrências, e não por contagem. Nesses,
   * a ficha dá mais linhas de ocorrência: elas são o dado, e não um
   * anexo do dado.
   */
  soOcorrencias: boolean;
}

function secao(def: DefinicaoProtocolo, codigo: string): SecaoProtocolo | null {
  return def.secoes.find((s) => s.codigo === codigo) ?? null;
}

export function comporFicha(def: DefinicaoProtocolo): Composicao {
  const grupos: GrupoDeItens[] = [];
  for (const item of [...def.itens].sort((a, b) => a.ordem - b.ordem)) {
    const nome = item.grupo || "Itens";
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.grupo === nome) ultimo.itens.push({ id: item.id, nome: item.nome });
    else grupos.push({ grupo: nome, itens: [{ id: item.id, nome: item.nome }] });
  }

  const quadrat = secao(def, "quadrat");

  return {
    esforco: secao(def, "esforco"),
    grupos,
    quadrat,
    qualitativo: secao(def, "qualitativo"),
    pontual: secao(def, "pontual"),
    soOcorrencias: grupos.length === 0 && quadrat === null,
  };
}

/**
 * Divide os grupos em colunas lado a lado, equilibrando a altura.
 *
 * Trinta itens em coluna única fazem a ficha de resíduos ocupar uma
 * folha e meia — medido: 1,64. A equipe fica virando papel na prancheta
 * com vento, e a segunda folha é meia folha em branco. Duas colunas é
 * como ficha de campo impressa sempre foi feita.
 *
 * O equilíbrio conta linhas, e não grupos: um grupo tem uma linha de
 * cabeçalho mais os itens dele, e dividir por número de grupos deixaria
 * "Plástico", com dezesseis itens, sozinho de um lado.
 */
export function dividirEmColunas(grupos: GrupoDeItens[], colunas = 2): GrupoDeItens[][] {
  if (colunas < 2 || grupos.length === 0) return [grupos];

  const altura = (g: GrupoDeItens) => g.itens.length + 1;
  const total = grupos.reduce((s, g) => s + altura(g), 0);
  const alvo = total / colunas;

  const saida: GrupoDeItens[][] = Array.from({ length: colunas }, () => []);
  let atual = 0;
  let acumulado = 0;

  for (const g of grupos) {
    // Só passa para a próxima coluna quando a atual já cruzou o alvo, e
    // nunca na última: o resto sempre cabe em algum lugar.
    if (atual < colunas - 1 && acumulado >= alvo * (atual + 1)) atual += 1;
    saida[atual].push(g);
    acumulado += altura(g);
  }

  return saida.filter((c) => c.length > 0);
}

/**
 * Quantas linhas de ocorrência a ficha imprime.
 *
 * Linha sobrando é papel gasto; linha faltando é dado perdido no verso
 * de um caderno, e esse não volta. Então sobra de propósito — e sobra
 * mais nos protocolos em que a ocorrência é o dado principal.
 */
export function linhasDeOcorrencia(c: Composicao, pedido?: number): number {
  if (pedido && pedido > 0) return Math.min(pedido, 30);
  return c.soOcorrencias ? 10 : 5;
}

/**
 * Quantas páginas A4 cada ficha ocupa.
 *
 * Medido gerando o PDF de verdade, e não estimado: a ficha da equipe
 * dá duas páginas quando há contagem ou grade de quadrats, e uma
 * quando o protocolo só registra ocorrências. A consolidação dá duas
 * sempre.
 *
 * Duas páginas é uma folha frente e verso, que é o formato normal de
 * ficha de campo — e é melhor que espremer trinta itens em meia folha
 * onde um aluno de doze anos não consegue escrever. O que não pode é a
 * tela prometer uma folha e a impressora cuspir duas: a escola carrega
 * a bandeja pelo que a tela disse.
 */
export const PAGINAS_DA_CONSOLIDACAO = 2;

export function paginasDaFicha(c: Composicao): number {
  return c.soOcorrencias ? 1 : 2;
}

/** O total do trabalho de impressão, para a tela dizer a verdade. */
export function totalDePaginas(c: Composicao, equipes: number): number {
  return PAGINAS_DA_CONSOLIDACAO + paginasDaFicha(c) * Math.max(0, equipes);
}

/**
 * As colunas da grade de quadrats, com o número de linhas a imprimir.
 *
 * A quantidade de quadrats é decidida em campo, não aqui: a ficha
 * imprime oito linhas porque é o que cabe na folha, e a equipe usa as
 * que precisar.
 */
export const LINHAS_DE_QUADRAT = 8;

/** Uma sequência 1..n, para repetir blocos na folha sem `Array.from` solto. */
export function serie(n: number): number[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => i + 1);
}

/**
 * A instrução que aparece na ficha, ao lado do bloco de ocorrências.
 *
 * Fica aqui, e não dentro do componente, porque é ela que descreve o
 * contrato entre o papel e o aplicativo — se o campo do aplicativo
 * mudar de nome, é este texto que precisa mudar junto.
 */
export const INSTRUCAO_DO_CODIGO =
  'Ao fotografar no aplicativo, comece a descrição pelo código desta linha (ex.: "E2-03 cano com água escura"). É por ele que o professor liga a foto a esta linha na hora de transcrever.';

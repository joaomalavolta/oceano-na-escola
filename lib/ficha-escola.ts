/**
 * Fundação e dias de aula: como a escola os escreve e como a página os lê.
 */

export const DIAS = [
  { id: "seg", curto: "Seg", nome: "segunda" },
  { id: "ter", curto: "Ter", nome: "terça" },
  { id: "qua", curto: "Qua", nome: "quarta" },
  { id: "qui", curto: "Qui", nome: "quinta" },
  { id: "sex", curto: "Sex", nome: "sexta" },
  { id: "sab", curto: "Sáb", nome: "sábado" },
  { id: "dom", curto: "Dom", nome: "domingo" },
] as const;

export type Dia = (typeof DIAS)[number]["id"];

const ORDEM: Record<string, number> = Object.fromEntries(DIAS.map((d, i) => [d.id, i]));
const NOME: Record<string, string> = Object.fromEntries(DIAS.map((d) => [d.id, d.nome]));

/** Só os dias conhecidos, sem repetição, na ordem da semana. */
export function normalizarDias(dias: readonly string[] | null | undefined): Dia[] {
  return [...new Set(dias ?? [])].filter((d) => d in ORDEM).sort((a, b) => ORDEM[a] - ORDEM[b]) as Dia[];
}

/**
 * "segunda a sexta", "segunda, quarta e sexta", "sábado e domingo".
 *
 * Três ou mais dias seguidos viram intervalo: "segunda, terça, quarta,
 * quinta e sexta" é uma frase que ninguém diz.
 */
export function diasLegiveis(dias: readonly string[] | null | undefined): string | null {
  const lista = normalizarDias(dias);
  if (lista.length === 0) return null;
  if (lista.length === 7) return "todos os dias";

  const blocos: string[] = [];
  let i = 0;
  while (i < lista.length) {
    let j = i;
    while (j + 1 < lista.length && ORDEM[lista[j + 1]] === ORDEM[lista[j]] + 1) j++;
    if (j - i >= 2) blocos.push(`${NOME[lista[i]]} a ${NOME[lista[j]]}`);
    else for (let k = i; k <= j; k++) blocos.push(NOME[lista[k]]);
    i = j + 1;
  }
  return blocos.length === 1 ? blocos[0] : `${blocos.slice(0, -1).join(", ")} e ${blocos[blocos.length - 1]}`;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * "2015-03-12" → "12 de março de 2015". Lido como texto: `new Date` de
 * uma data sem hora é meia-noite UTC, que aqui ainda é o dia anterior.
 */
export function fundacaoLegivel(data: string | null | undefined): string | null {
  if (!data) return null;
  const [a, m, d] = data.split("-").map(Number);
  if (!a || !m || !d) return null;
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

export function anoDe(data: string | null | undefined): number | null {
  if (!data) return null;
  const a = Number(data.slice(0, 4));
  return Number.isFinite(a) && a > 0 ? a : null;
}

/**
 * A data de fundação vale? O banco só confere a faixa larga (1900–2100);
 * "não pode ser no futuro" depende de hoje, e é conferido aqui.
 */
export function fundacaoValida(data: string | null, hoje: string): boolean {
  if (data === null) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  return data >= "1900-01-01" && data <= hoje;
}

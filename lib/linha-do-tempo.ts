/**
 * A linha do tempo da rede: as saídas de campo de todas as escolas, da
 * mais recente para a mais antiga, com as fotos que cada uma publicou.
 *
 * É como uma escola acompanha a outra. Não há nada aqui que já não fosse
 * público — `pub_expedicao` e `pub_galeria` são as mesmas views da
 * página de cada escola. O que muda é a ordem: em vez de escola por
 * escola, o tempo.
 *
 * Só lógica pura, para dar para testar sem banco nem tela.
 */

import type { TipoOrganizacao } from "./organizacao";

export interface ExpedicaoNaLinha {
  id: number;
  numero: number;
  titulo: string | null;
  /** "AAAA-MM-DD", como vem do banco. */
  data_campo: string;
  n_mapeadores: number | null;
  extensao_m: number | null;
  territorio: string | null;
  escola_slug: string;
  escola_nome: string;
}

export interface FotoNaLinha {
  id: number;
  storage_path: string;
  legenda: string | null;
  escola_slug: string;
  expedicao_numero: number | null;
  tipo: string;
}

export interface EscolaNaLinha {
  slug: string;
  nome: string;
  tipo: TipoOrganizacao;
  municipio: string;
}

export interface Marco {
  chave: string;
  data: string;
  expedicao: ExpedicaoNaLinha;
  /** Nula se a escola não estiver na lista — não deveria acontecer. */
  escola: EscolaNaLinha | null;
  fotos: FotoNaLinha[];
  /** Quantas fotos da saída ficaram fora do recorte exibido. */
  fotosAMais: number;
}

export interface MesNaLinha {
  /** "AAAA-MM" */
  mes: string;
  rotulo: string;
  marcos: Marco[];
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez",
];

/**
 * "2026-08" → "agosto de 2026".
 *
 * Lido como texto de propósito. `new Date("2026-08-01")` é meia-noite em
 * UTC, que no horário de Brasília ainda é 31 de julho — e a saída do dia
 * primeiro apareceria no mês anterior.
 */
export function rotuloDoMes(mes: string): string {
  const [ano, m] = mes.split("-");
  return `${MESES[Number(m) - 1] ?? m} de ${ano}`;
}

/** "2026-08-01" → "1 ago". Mesmo cuidado com o fuso. */
export function dataCurta(data: string): string {
  const [, m, d] = data.split("-");
  return `${Number(d)} ${MESES_CURTOS[Number(m) - 1] ?? m}`;
}

/**
 * Fotos que pertencem a uma saída. A capa é da escola, não de uma saída,
 * e foto de turma sem saída também não entra aqui.
 */
function ehFotoDeSaida(f: FotoNaLinha): boolean {
  return f.expedicao_numero !== null && f.tipo !== "capa_escola";
}

export function montarLinhaDoTempo(opts: {
  expedicoes: ExpedicaoNaLinha[];
  fotos: FotoNaLinha[];
  escolas: EscolaNaLinha[];
  rede?: TipoOrganizacao | "";
  escolaSlug?: string;
  fotosPorMarco?: number;
}): MesNaLinha[] {
  const { expedicoes, fotos, escolas, rede = "", escolaSlug, fotosPorMarco = 4 } = opts;
  const porSlug = new Map(escolas.map((e) => [e.slug, e]));

  // O número da expedição se repete entre escolas — a #1 de uma não é a
  // #1 da outra. A foto casa pelo par.
  const fotosPorSaida = new Map<string, FotoNaLinha[]>();
  for (const f of fotos) {
    if (!ehFotoDeSaida(f)) continue;
    const chave = `${f.escola_slug}#${f.expedicao_numero}`;
    const lista = fotosPorSaida.get(chave) ?? [];
    lista.push(f);
    fotosPorSaida.set(chave, lista);
  }

  const marcos: Marco[] = expedicoes
    .filter((x) => !escolaSlug || x.escola_slug === escolaSlug)
    .filter((x) => !rede || (porSlug.get(x.escola_slug)?.tipo ?? "regular") === rede)
    .map((x) => {
      const chave = `${x.escola_slug}#${x.numero}`;
      const todas = fotosPorSaida.get(chave) ?? [];
      return {
        chave,
        data: x.data_campo,
        expedicao: x,
        escola: porSlug.get(x.escola_slug) ?? null,
        fotos: todas.slice(0, fotosPorMarco),
        fotosAMais: Math.max(0, todas.length - fotosPorMarco),
      };
    })
    .sort((a, b) => {
      if (a.data !== b.data) return a.data < b.data ? 1 : -1;
      const na = a.escola?.nome ?? a.expedicao.escola_nome;
      const nb = b.escola?.nome ?? b.expedicao.escola_nome;
      if (na !== nb) return na.localeCompare(nb, "pt-BR");
      return b.expedicao.numero - a.expedicao.numero;
    });

  const meses: MesNaLinha[] = [];
  for (const m of marcos) {
    const mes = m.data.slice(0, 7);
    let atual = meses[meses.length - 1];
    if (!atual || atual.mes !== mes) {
      atual = { mes, rotulo: rotuloDoMes(mes), marcos: [] };
      meses.push(atual);
    }
    atual.marcos.push(m);
  }
  return meses;
}

/**
 * Saídas fictícias para o modo de demonstração, tiradas das ocorrências
 * fictícias do mapa: uma por escola e número. Assim a linha do tempo de
 * demonstração conta a mesma história que o mapa de demonstração, em vez
 * de inventar saídas que o mapa não tem.
 */
export function expedicoesDosPontuais(
  pontuais: { escola_slug: string; escola_nome: string; expedicao_numero: number; data_campo: string }[]
): ExpedicaoNaLinha[] {
  const vistas = new Map<string, ExpedicaoNaLinha>();
  for (const p of pontuais) {
    const chave = `${p.escola_slug}#${p.expedicao_numero}`;
    if (vistas.has(chave)) continue;
    vistas.set(chave, {
      id: vistas.size + 1,
      numero: p.expedicao_numero,
      titulo: null,
      data_campo: p.data_campo,
      n_mapeadores: null,
      extensao_m: null,
      territorio: null,
      escola_slug: p.escola_slug,
      escola_nome: p.escola_nome,
    });
  }
  return [...vistas.values()];
}

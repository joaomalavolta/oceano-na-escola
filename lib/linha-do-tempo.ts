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

/** Publicação do mural, como vem de `pub_mural`. */
export interface PublicacaoNaLinha {
  id: number;
  texto: string;
  /** ISO com hora. */
  publicada_em: string;
  escola_slug: string;
  escola_nome: string;
}

/** Foto ou vídeo de uma publicação, como vem de `pub_mural_midia`. */
export interface MidiaNaLinha {
  id: number;
  publicacao_id: number;
  storage_path: string;
  tipo: string;
  legenda: string | null;
}

interface MarcoBase {
  chave: string;
  /** "AAAA-MM-DD", no fuso de Brasília. */
  data: string;
  /** Nula se a escola não estiver na lista — não deveria acontecer. */
  escola: EscolaNaLinha | null;
}

export interface MarcoSaida extends MarcoBase {
  tipo: "saida";
  expedicao: ExpedicaoNaLinha;
  fotos: FotoNaLinha[];
  /** Quantas fotos da saída ficaram fora do recorte exibido. */
  fotosAMais: number;
}

export interface MarcoPublicacao extends MarcoBase {
  tipo: "publicacao";
  publicacao: PublicacaoNaLinha;
  midias: MidiaNaLinha[];
}

export type Marco = MarcoSaida | MarcoPublicacao;

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

const DIA_EM_BRASILIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * O dia de um instante, no fuso de Brasília.
 *
 * A saída de campo tem data; a publicação do mural tem instante. Uma
 * publicação feita às 22h do dia 1º é, em UTC, do dia 2 — e apareceria
 * no dia seguinte ao que a escola viveu. O formato "en-CA" é só o jeito
 * de o Intl devolver AAAA-MM-DD.
 */
export function diaEmBrasilia(iso: string): string {
  return DIA_EM_BRASILIA.format(new Date(iso));
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
  publicacoes?: PublicacaoNaLinha[];
  midias?: MidiaNaLinha[];
  rede?: TipoOrganizacao | "";
  escolaSlug?: string;
  fotosPorMarco?: number;
}): MesNaLinha[] {
  const {
    expedicoes,
    fotos,
    escolas,
    publicacoes = [],
    midias = [],
    rede = "",
    escolaSlug,
    fotosPorMarco = 4,
  } = opts;
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

  const entra = (slug: string) =>
    (!escolaSlug || slug === escolaSlug) &&
    (!rede || (porSlug.get(slug)?.tipo ?? "regular") === rede);

  const saidas: MarcoSaida[] = expedicoes
    .filter((x) => entra(x.escola_slug))
    .map((x) => {
      const chave = `${x.escola_slug}#${x.numero}`;
      const todas = fotosPorSaida.get(chave) ?? [];
      return {
        tipo: "saida",
        chave,
        data: x.data_campo,
        expedicao: x,
        escola: porSlug.get(x.escola_slug) ?? null,
        fotos: todas.slice(0, fotosPorMarco),
        fotosAMais: Math.max(0, todas.length - fotosPorMarco),
      };
    });

  const midiasPorPublicacao = new Map<number, MidiaNaLinha[]>();
  for (const m of midias) {
    const lista = midiasPorPublicacao.get(m.publicacao_id) ?? [];
    lista.push(m);
    midiasPorPublicacao.set(m.publicacao_id, lista);
  }

  const posts: MarcoPublicacao[] = publicacoes
    .filter((p) => entra(p.escola_slug))
    .map((p) => ({
      tipo: "publicacao",
      chave: `mural-${p.id}`,
      data: diaEmBrasilia(p.publicada_em),
      publicacao: p,
      escola: porSlug.get(p.escola_slug) ?? null,
      midias: (midiasPorPublicacao.get(p.id) ?? []).sort((a, b) => a.id - b.id),
    }));

  const nomeDe = (m: Marco) =>
    m.escola?.nome ?? (m.tipo === "saida" ? m.expedicao.escola_nome : m.publicacao.escola_nome);

  // No mesmo dia, a publicação vem antes da saída: ela costuma ser o
  // relato do que aconteceu, escrito depois. Entre publicações, a mais
  // recente primeiro; entre saídas, pela escola.
  const marcos: Marco[] = [...saidas, ...posts].sort((a, b) => {
    if (a.data !== b.data) return a.data < b.data ? 1 : -1;
    if (a.tipo !== b.tipo) return a.tipo === "publicacao" ? -1 : 1;
    if (a.tipo === "publicacao" && b.tipo === "publicacao") {
      return a.publicacao.publicada_em < b.publicacao.publicada_em ? 1 : -1;
    }
    const na = nomeDe(a);
    const nb = nomeDe(b);
    if (na !== nb) return na.localeCompare(nb, "pt-BR");
    return a.tipo === "saida" && b.tipo === "saida" ? b.expedicao.numero - a.expedicao.numero : 0;
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

/** Os primeiros `n` marcos, mantendo o agrupamento por mês. */
export function recortarLinha(meses: MesNaLinha[], n: number): MesNaLinha[] {
  const saida: MesNaLinha[] = [];
  let resta = n;
  for (const m of meses) {
    if (resta <= 0) break;
    const marcos = m.marcos.slice(0, resta);
    saida.push({ ...m, marcos });
    resta -= marcos.length;
  }
  return saida;
}

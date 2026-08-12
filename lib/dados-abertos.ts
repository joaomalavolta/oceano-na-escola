/**
 * Camada de dados abertos.
 *
 * Não abre nada novo: exporta exatamente o que o mapa público já
 * mostra — as views pub_*, com a grade agregada em células de 100 m a
 * partir de três unidades amostrais e só expedição publicada de escola
 * publicada. O CSV é o mesmo dado do mapa, em coluna.
 *
 * O §9 das premissas separa duas coisas que é fácil confundir:
 * indicador agregado por escola, município e rede é aberto a quem não
 * tem login; "tabelas, filtros avançados, exportação e download de
 * dados" são só com login. A página respeita a separação.
 *
 * Vale dizer com todas as letras o que essa trava é e o que não é: ela
 * fecha a porta do produto, não a do banco. As views pub_* seguem
 * legíveis pela chave anônima porque é delas que vive o mapa público, e
 * quem souber usar a API do PostgREST alcança o mesmo conteúdo. Fechar
 * de verdade significaria revogar o select do anon e derrubar o mapa
 * junto — a decisão de visibilidade do §9 já pesou isso ao publicar o
 * mapa agregado.
 */

import { supabase, supabaseConfigurado } from "./supabase";

export interface ConjuntoAberto {
  id: string;
  nome: string;
  descricao: string;
  view: string;
  colunas: string[];
}

export const CONJUNTOS: ConjuntoAberto[] = [
  {
    id: "grade",
    nome: "Grade de densidade",
    descricao:
      "Células de 100 m com contagem, área amostrada e densidade por protocolo e mês. Célula só existe a partir de 3 unidades amostrais.",
    view: "pub_observacao_grade",
    colunas: [
      "escola_slug", "protocolo", "mes", "unidades_amostrais",
      "total_itens", "area_amostrada_m2", "densidade_itens_m2", "celula_geojson",
    ],
  },
  {
    id: "ocorrencias",
    nome: "Ocorrências ambientais",
    descricao:
      "Registros pontuais em coordenada exata: descarte, esgoto, supressão de restinga, fauna. Apenas expedição publicada de escola publicada.",
    view: "pub_observacao_pontual",
    colunas: [
      "escola_slug", "protocolo", "item_codigo", "item_nome", "valor",
      "item_unidade", "descricao", "origem_provavel", "data_campo", "ponto_geojson",
    ],
  },
  {
    id: "escolas",
    nome: "Escolas da rede",
    descricao: "Escolas publicadas, com município e posição.",
    view: "pub_escola",
    colunas: ["slug", "nome", "municipio", "uf", "lat", "lng"],
  },
  {
    id: "indicadores",
    nome: "Indicadores por escola",
    descricao: "Expedições, extensão monitorada e itens catalogados por escola.",
    view: "pub_indicador_escola",
    colunas: ["escola_slug", "expedicoes", "extensao_total_m", "itens_catalogados", "registros_pontuais"],
  },
];

export interface IndicadorMunicipio {
  municipio: string;
  uf: string;
  escolas: number;
  expedicoes: number;
  extensaoM: number;
  itens: number;
  ocorrencias: number;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** O relatório por município: as escolas somadas, município a município. */
export async function indicadoresPorMunicipio(): Promise<IndicadorMunicipio[]> {
  if (!supabaseConfigurado) return [];
  const [escolasRes, indicadoresRes] = await Promise.all([
    supabase.from("pub_escola").select("slug, municipio, uf"),
    supabase
      .from("pub_indicador_escola")
      .select("escola_slug, expedicoes, extensao_total_m, itens_catalogados, registros_pontuais"),
  ]);
  if (escolasRes.error || indicadoresRes.error) return [];

  const indicadorPorSlug = new Map(
    (indicadoresRes.data ?? []).map((i) => [String(i.escola_slug), i])
  );

  const mapa = new Map<string, IndicadorMunicipio>();
  for (const e of escolasRes.data ?? []) {
    const chave = `${e.municipio}/${e.uf}`;
    const atual = mapa.get(chave) ?? {
      municipio: String(e.municipio),
      uf: String(e.uf),
      escolas: 0,
      expedicoes: 0,
      extensaoM: 0,
      itens: 0,
      ocorrencias: 0,
    };
    atual.escolas += 1;
    const ind = indicadorPorSlug.get(String(e.slug));
    if (ind) {
      atual.expedicoes += num(ind.expedicoes);
      atual.extensaoM += num(ind.extensao_total_m);
      atual.itens += num(ind.itens_catalogados);
      atual.ocorrencias += num(ind.registros_pontuais);
    }
    mapa.set(chave, atual);
  }
  return [...mapa.values()].sort((a, b) => b.itens - a.itens);
}

function escaparCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Baixa um conjunto como CSV.
 *
 * Separador ponto e vírgula e BOM no início: é o que faz o Excel em
 * português abrir as colunas certas sem assistente de importação.
 */
export async function baixarCsv(conjunto: ConjuntoAberto): Promise<{ erro: string | null }> {
  if (!supabaseConfigurado) {
    return { erro: "Ambiente sem as variáveis do Supabase. O export lê o banco de verdade." };
  }
  // O select vai literal. Montado por concatenação, o supabase-js perde
  // a inferência e devolve GenericStringError em vez das linhas — já
  // custou caro uma vez. As colunas declaradas mandam no CSV, abaixo.
  const { data, error } = await supabase.from(conjunto.view).select("*");
  if (error) return { erro: error.message };

  const linhas = [
    conjunto.colunas.join(";"),
    ...((data ?? []) as Record<string, unknown>[]).map((linha) =>
      conjunto.colunas.map((c) => escaparCsv(linha[c])).join(";")
    ),
  ];

  const blob = new Blob(["﻿" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `oceano-na-escola-${conjunto.id}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return { erro: null };
}

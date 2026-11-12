import { describe, it, expect } from "vitest";
import {
  montarLinhaDoTempo,
  rotuloDoMes,
  dataCurta,
  expedicoesDosPontuais,
  diaEmBrasilia,
  type ExpedicaoNaLinha,
  type FotoNaLinha,
  type EscolaNaLinha,
  type Marco,
  type MarcoSaida,
  type MesNaLinha,
} from "./linha-do-tempo";

/** Os marcos de saída, para os testes que só falam delas. */
function saidasDe(m: MesNaLinha | Marco[]): MarcoSaida[] {
  const lista = Array.isArray(m) ? m : m.marcos;
  return lista.filter((x): x is MarcoSaida => x.tipo === "saida");
}

const ESCOLAS: EscolaNaLinha[] = [
  { slug: "a", nome: "E.M. Alfa", tipo: "regular", municipio: "Cidade" },
  { slug: "b", nome: "E.M. Beta", tipo: "regular", municipio: "Cidade" },
  { slug: "s", nome: "Escola de Surf Onda", tipo: "surf", municipio: "Cidade" },
];

function exp(escola: string, numero: number, data: string): ExpedicaoNaLinha {
  return {
    id: numero * 100 + escola.charCodeAt(0),
    numero,
    titulo: `Saída ${numero}`,
    data_campo: data,
    n_mapeadores: 20,
    extensao_m: 200,
    territorio: null,
    escola_slug: escola,
    escola_nome: escola,
  };
}

function foto(id: number, escola: string, numero: number | null, tipo = "foto_campo"): FotoNaLinha {
  return { id, storage_path: `escola/${id}.jpg`, legenda: null, escola_slug: escola, expedicao_numero: numero, tipo };
}

describe("montarLinhaDoTempo", () => {
  it("mais recente primeiro, agrupado por mês", () => {
    const meses = montarLinhaDoTempo({
      expedicoes: [exp("a", 1, "2026-06-10"), exp("b", 1, "2026-08-02"), exp("a", 2, "2026-08-20")],
      fotos: [],
      escolas: ESCOLAS,
    });
    expect(meses.map((m) => m.mes)).toEqual(["2026-08", "2026-06"]);
    expect(meses[0].marcos.map((m) => m.data)).toEqual(["2026-08-20", "2026-08-02"]);
  });

  it("no mesmo dia, ordena pelo nome da escola", () => {
    const [mes] = montarLinhaDoTempo({
      expedicoes: [exp("b", 1, "2026-08-02"), exp("a", 1, "2026-08-02")],
      fotos: [],
      escolas: ESCOLAS,
    });
    expect(mes.marcos.map((m) => m.escola?.nome)).toEqual(["E.M. Alfa", "E.M. Beta"]);
  });

  it("cada saída leva as fotos dela, e só as dela", () => {
    // O número da expedição se repete entre escolas: a #1 da Alfa não é
    // a #1 da Beta. A foto casa pelo par escola + número.
    const [mes] = montarLinhaDoTempo({
      expedicoes: [exp("a", 1, "2026-08-02"), exp("b", 1, "2026-08-02")],
      fotos: [foto(1, "a", 1), foto(2, "b", 1), foto(3, "a", 1)],
      escolas: ESCOLAS,
    });
    const alfa = saidasDe(mes).find((m) => m.escola?.slug === "a")!;
    const beta = saidasDe(mes).find((m) => m.escola?.slug === "b")!;
    expect(alfa.fotos.map((f) => f.id)).toEqual([1, 3]);
    expect(beta.fotos.map((f) => f.id)).toEqual([2]);
  });

  it("capa e foto sem saída não entram como foto de saída", () => {
    const [mes] = montarLinhaDoTempo({
      expedicoes: [exp("a", 1, "2026-08-02")],
      fotos: [foto(1, "a", 1, "capa_escola"), foto(2, "a", null, "foto_turma"), foto(3, "a", 1)],
      escolas: ESCOLAS,
    });
    expect(saidasDe(mes)[0].fotos.map((f) => f.id)).toEqual([3]);
  });

  it("mostra poucas fotos e conta as que ficaram de fora", () => {
    const fotos = [1, 2, 3, 4, 5, 6].map((i) => foto(i, "a", 1));
    const [mes] = montarLinhaDoTempo({
      expedicoes: [exp("a", 1, "2026-08-02")],
      fotos,
      escolas: ESCOLAS,
      fotosPorMarco: 4,
    });
    expect(saidasDe(mes)[0].fotos).toHaveLength(4);
    expect(saidasDe(mes)[0].fotosAMais).toBe(2);
  });

  it("recorta pela rede", () => {
    const tudo = {
      expedicoes: [exp("a", 1, "2026-08-02"), exp("s", 1, "2026-08-03")],
      fotos: [],
      escolas: ESCOLAS,
    };
    const surf = montarLinhaDoTempo({ ...tudo, rede: "surf" });
    const regular = montarLinhaDoTempo({ ...tudo, rede: "regular" });
    expect(surf.flatMap((m) => m.marcos).map((m) => m.escola?.slug)).toEqual(["s"]);
    expect(regular.flatMap((m) => m.marcos).map((m) => m.escola?.slug)).toEqual(["a"]);
  });

  it("recorta por escola, para a página de cada uma", () => {
    const meses = montarLinhaDoTempo({
      expedicoes: [exp("a", 1, "2026-08-02"), exp("b", 1, "2026-08-03")],
      fotos: [],
      escolas: ESCOLAS,
      escolaSlug: "b",
    });
    expect(meses.flatMap((m) => m.marcos).map((m) => m.escola?.slug)).toEqual(["b"]);
  });

  it("sem saídas, devolve lista vazia e não um mês vazio", () => {
    expect(montarLinhaDoTempo({ expedicoes: [], fotos: [], escolas: ESCOLAS })).toEqual([]);
  });
});

describe("datas", () => {
  it("o mês sai por extenso, sem depender do fuso", () => {
    // `new Date("2026-08-01")` é meia-noite em UTC, que no Brasil ainda
    // é 31 de julho. Por isso a data é lida como texto, e não como Date.
    expect(rotuloDoMes("2026-08")).toBe("agosto de 2026");
    expect(rotuloDoMes("2026-01")).toBe("janeiro de 2026");
  });

  it("a data curta não volta um dia", () => {
    expect(dataCurta("2026-08-01")).toBe("1 ago");
    expect(dataCurta("2026-12-31")).toBe("31 dez");
  });
});

describe("demonstração sem banco", () => {
  it("tira uma saída por escola e número das ocorrências fictícias", () => {
    const saidas = expedicoesDosPontuais([
      { escola_slug: "a", escola_nome: "E.M. Alfa", expedicao_numero: 1, data_campo: "2026-06-10" },
      { escola_slug: "a", escola_nome: "E.M. Alfa", expedicao_numero: 1, data_campo: "2026-06-10" },
      { escola_slug: "b", escola_nome: "E.M. Beta", expedicao_numero: 1, data_campo: "2026-06-11" },
    ]);
    expect(saidas).toHaveLength(2);
    expect(saidas.map((s) => `${s.escola_slug}#${s.numero}`).sort()).toEqual(["a#1", "b#1"]);
  });
});

describe("publicações do mural na linha do tempo", () => {
  const post = (id: number, escola: string, iso: string) => ({
    id,
    texto: `Publicação ${id}`,
    publicada_em: iso,
    escola_slug: escola,
    escola_nome: escola,
  });

  it("entram na mesma linha das saídas, pela data", () => {
    const meses = montarLinhaDoTempo({
      expedicoes: [exp("a", 1, "2026-08-02"), exp("a", 2, "2026-08-20")],
      fotos: [],
      escolas: ESCOLAS,
      publicacoes: [post(1, "b", "2026-08-10T15:00:00Z")],
    });
    expect(meses[0].marcos.map((m) => m.tipo)).toEqual(["saida", "publicacao", "saida"]);
  });

  it("no mesmo dia, a publicação vem antes da saída", () => {
    const [mes] = montarLinhaDoTempo({
      expedicoes: [exp("a", 1, "2026-08-02")],
      fotos: [],
      escolas: ESCOLAS,
      publicacoes: [post(1, "a", "2026-08-02T20:00:00Z")],
    });
    expect(mes.marcos.map((m) => m.tipo)).toEqual(["publicacao", "saida"]);
  });

  it("a data da publicação é o dia em Brasília, não em UTC", () => {
    // 01h30 de 2 de agosto em UTC ainda é 22h30 de 1º de agosto aqui.
    expect(diaEmBrasilia("2026-08-02T01:30:00Z")).toBe("2026-08-01");
    const meses = montarLinhaDoTempo({
      expedicoes: [],
      fotos: [],
      escolas: ESCOLAS,
      publicacoes: [post(1, "a", "2026-09-01T02:00:00Z")],
    });
    expect(meses[0].mes).toBe("2026-08");
  });

  it("cada publicação leva a própria mídia", () => {
    const [mes] = montarLinhaDoTempo({
      expedicoes: [],
      fotos: [],
      escolas: ESCOLAS,
      publicacoes: [post(1, "a", "2026-08-02T15:00:00Z"), post(2, "b", "2026-08-02T16:00:00Z")],
      midias: [
        { id: 10, publicacao_id: 1, storage_path: "x", tipo: "foto_mural", legenda: null },
        { id: 11, publicacao_id: 2, storage_path: "y", tipo: "video_mural", legenda: null },
        { id: 12, publicacao_id: 1, storage_path: "z", tipo: "video_mural", legenda: null },
      ],
    });
    const porId = Object.fromEntries(
      mes.marcos.map((m) => (m.tipo === "publicacao" ? [m.publicacao.id, m.midias.map((x) => x.id)] : [0, []]))
    );
    expect(porId[1]).toEqual([10, 12]);
    expect(porId[2]).toEqual([11]);
  });

  it("obedecem ao recorte de rede e de escola", () => {
    const base = {
      expedicoes: [],
      fotos: [],
      escolas: ESCOLAS,
      publicacoes: [post(1, "a", "2026-08-02T15:00:00Z"), post(2, "s", "2026-08-03T15:00:00Z")],
    };
    const surf = montarLinhaDoTempo({ ...base, rede: "surf" }).flatMap((m) => m.marcos);
    const daA = montarLinhaDoTempo({ ...base, escolaSlug: "a" }).flatMap((m) => m.marcos);
    expect(surf.map((m) => m.escola?.slug)).toEqual(["s"]);
    expect(daA.map((m) => m.escola?.slug)).toEqual(["a"]);
  });
});

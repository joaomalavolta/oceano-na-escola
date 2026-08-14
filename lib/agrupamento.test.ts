import { describe, it, expect } from "vitest";
import { agruparPorProximidade, pontoDe } from "./agrupamento";
import { mockPontuais } from "./mapa-publico";

/**
 * O agrupamento é o que mantém o mapa legível: sete protocolos ligados
 * empilham meia dúzia de ocorrências no mesmo pedaço de praia. Um erro
 * aqui não quebra a tela — ele some com uma ocorrência, ou mostra a
 * mesma duas vezes, e ninguém percebe olhando.
 */

const coordenada = (o: { ponto_geojson: string }) => pontoDe(o.ponto_geojson);
const ZOOMS = [8, 10, 12, 13, 14, 15, 16, 17, 18, 20];

describe("agruparPorProximidade", () => {
  it("não perde nem duplica ocorrência em zoom nenhum", () => {
    for (const zoom of ZOOMS) {
      const grupos = agruparPorProximidade(mockPontuais, coordenada, zoom);
      const reunidos = grupos.flatMap((g) => g.itens);
      expect(reunidos, `zoom ${zoom}`).toHaveLength(mockPontuais.length);
      expect(new Set(reunidos.map((o) => o.id)).size, `zoom ${zoom}`).toBe(mockPontuais.length);
    }
  });

  it("dá a mesma chave para a mesma entrada, que é o que o React usa de key", () => {
    for (const zoom of ZOOMS) {
      const a = agruparPorProximidade(mockPontuais, coordenada, zoom).map((g) => g.chave);
      const b = agruparPorProximidade(mockPontuais, coordenada, zoom).map((g) => g.chave);
      expect(a).toEqual(b);
      expect(new Set(a).size, `chaves repetidas no zoom ${zoom}`).toBe(a.length);
    }
  });

  it("ignora ponto sem coordenada em vez de quebrar", () => {
    const itens = [...mockPontuais, { ...mockPontuais[0], id: -1, ponto_geojson: "nao e json" }];
    const grupos = agruparPorProximidade(itens, coordenada, 13);
    expect(grupos.flatMap((g) => g.itens)).toHaveLength(mockPontuais.length);
  });

  it("aproximar separa e afastar junta", () => {
    const perto = agruparPorProximidade(mockPontuais, coordenada, 20);
    const longe = agruparPorProximidade(mockPontuais, coordenada, 8);
    expect(perto.every((g) => g.itens.length === 1)).toBe(true);
    expect(longe.length).toBeLessThan(perto.length);
  });

  it("o número de grupos nunca cresce ao afastar", () => {
    const contagens = ZOOMS.map((z) => agruparPorProximidade(mockPontuais, coordenada, z).length);
    for (let i = 1; i < contagens.length; i++) {
      expect(contagens[i], `entre os zooms ${ZOOMS[i - 1]} e ${ZOOMS[i]}`).toBeGreaterThanOrEqual(
        contagens[i - 1]
      );
    }
  });

  it("põe o pino no centro dos pontos, e não no canto da célula", () => {
    const grupos = agruparPorProximidade(mockPontuais, coordenada, 13);
    for (const g of grupos) {
      const pontos = g.itens.map((o) => pontoDe(o.ponto_geojson)!);
      const mediaLng = pontos.reduce((s, p) => s + p[0], 0) / pontos.length;
      const mediaLat = pontos.reduce((s, p) => s + p[1], 0) / pontos.length;
      expect(g.lng).toBeCloseTo(mediaLng, 10);
      expect(g.lat).toBeCloseTo(mediaLat, 10);
    }
  });

  /**
   * A grade é em graus, e não em pixels de tela. Se fosse em pixels,
   * arrastar o mapa remontaria os grupos e os pinos ficariam piscando.
   * Em graus, a mesma entrada com o mesmo zoom dá o mesmo resultado
   * independentemente de onde a tela esteja — e é isso que se afirma
   * aqui, comparando duas chamadas separadas por um deslocamento que
   * só existiria se houvesse estado escondido.
   */
  it("não guarda estado entre chamadas", () => {
    const antes = agruparPorProximidade(mockPontuais, coordenada, 14);
    agruparPorProximidade(mockPontuais.slice(0, 3), coordenada, 19);
    const depois = agruparPorProximidade(mockPontuais, coordenada, 14);
    expect(depois.map((g) => [g.chave, g.itens.length])).toEqual(
      antes.map((g) => [g.chave, g.itens.length])
    );
  });
});

describe("pontoDe", () => {
  it("lê o par [lng, lat]", () => {
    expect(pontoDe('{"type":"Point","coordinates":[-46.79,-24.18]}')).toEqual([-46.79, -24.18]);
  });

  it("devolve null para texto inválido ou sem coordenada", () => {
    expect(pontoDe("{")).toBeNull();
    expect(pontoDe('{"type":"Point"}')).toBeNull();
  });
});

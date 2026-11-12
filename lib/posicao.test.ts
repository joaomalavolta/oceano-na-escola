import { describe, it, expect } from "vitest";
import {
  arredondar,
  posicaoValida,
  ehPosicaoPadraoAntiga,
  lerCoordenada,
  POSICAO_PADRAO_ANTIGA,
  CENTRO_INICIAL,
} from "./posicao";

describe("arredondar", () => {
  it("fica em seis casas", () => {
    expect(arredondar(-24.187512345678)).toBe(-24.187512);
    expect(arredondar(-46.80149999999)).toBe(-46.8015);
  });

  it("não mexe no que já está curto", () => {
    expect(arredondar(-24.18)).toBe(-24.18);
  });
});

describe("posicaoValida", () => {
  it("aceita um ponto do litoral", () => {
    expect(posicaoValida(-24.18, -46.79)).toBe(true);
  });

  it("recusa par incompleto", () => {
    expect(posicaoValida(null, -46.79)).toBe(false);
    expect(posicaoValida(-24.18, null)).toBe(false);
    expect(posicaoValida(undefined, undefined)).toBe(false);
  });

  it("recusa valor fora do globo", () => {
    // O mapa lança erro ao receber latitude acima de 90: a tela inteira
    // cairia por causa de um dígito a mais no campo.
    expect(posicaoValida(-241.8, -46.79)).toBe(false);
    expect(posicaoValida(-24.18, -467.9)).toBe(false);
    expect(posicaoValida(NaN, -46.79)).toBe(false);
  });

  it("aceita zero, que é coordenada de verdade", () => {
    expect(posicaoValida(0, 0)).toBe(true);
  });
});

describe("posição padrão do cadastro antigo", () => {
  it("reconhece o ponto exato", () => {
    expect(ehPosicaoPadraoAntiga(POSICAO_PADRAO_ANTIGA.lat, POSICAO_PADRAO_ANTIGA.lng)).toBe(true);
  });

  it("não acusa escola que só está perto", () => {
    // Dez metros ao lado já é posição marcada por alguém.
    expect(ehPosicaoPadraoAntiga(-24.1876, -46.8015)).toBe(false);
    expect(ehPosicaoPadraoAntiga(-24.1875, -46.8016)).toBe(false);
  });

  it("escola sem posição não é escola na posição padrão", () => {
    expect(ehPosicaoPadraoAntiga(null, null)).toBe(false);
  });

  it("o mapa não abre centrado no ponto antigo", () => {
    // Se abrisse, quem marcasse o ponto com um toque sem arrastar cairia
    // de novo no mesmo lugar, e o aviso da ficha acusaria uma posição
    // que a pessoa acabou de escolher.
    expect(ehPosicaoPadraoAntiga(CENTRO_INICIAL.lat, CENTRO_INICIAL.lng)).toBe(false);
  });
});

describe("lerCoordenada", () => {
  it("campo vazio é sem posição, e não zero", () => {
    expect(lerCoordenada("")).toBeNull();
    expect(lerCoordenada("   ")).toBeNull();
  });

  it("aceita ponto e vírgula decimal", () => {
    expect(lerCoordenada("-24.1875")).toBe(-24.1875);
    expect(lerCoordenada("-24,1875")).toBe(-24.1875);
  });

  it("o sinal sozinho, no meio da digitação, ainda não é número", () => {
    expect(lerCoordenada("-")).toBeNull();
  });

  it("texto que não é número não vira coordenada", () => {
    expect(lerCoordenada("abc")).toBeNull();
  });
});

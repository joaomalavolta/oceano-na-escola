import { describe, it, expect } from "vitest";
import { escalaDe, hexDensidade, faixasAutomaticas, PROTOCOLO_PADRAO } from "./mapa-publico";

/**
 * A escala de densidade é a única parte do mapa em que a cor É o dado:
 * o tom da célula afirma quanto resíduo há por metro quadrado. Um erro
 * aqui não parece erro — parece uma praia mais limpa do que é.
 *
 * A legenda que explicava os tons foi retirada da tela a pedido, o que
 * torna estes testes mais importantes, não menos: agora não há quadro
 * ao lado para alguém conferir a olho.
 */
describe("escalaDe", () => {
  it("devolve faixas em ordem crescente, sem buraco entre elas", () => {
    const escala = escalaDe(PROTOCOLO_PADRAO);
    expect(escala.length).toBeGreaterThan(1);
    for (let i = 1; i < escala.length; i++) {
      expect(escala[i].max).toBeGreaterThan(escala[i - 1].max);
    }
  });

  it("toda faixa tem cor válida", () => {
    for (const f of escalaDe(PROTOCOLO_PADRAO)) {
      expect(f.hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("protocolo sem escala curada deriva dos valores observados", () => {
    const escala = escalaDe("QUALQUER-COISA", "#2d7d72", [0.1, 0.4, 0.9, 1.6]);
    expect(escala.length).toBeGreaterThan(1);
    for (let i = 1; i < escala.length; i++) {
      expect(escala[i].max).toBeGreaterThan(escala[i - 1].max);
    }
  });

  it("protocolo desconhecido e sem valores ainda produz escala utilizável", () => {
    const escala = escalaDe("VAZIO", null, []);
    expect(escala.length).toBeGreaterThan(0);
    expect(escala[0].hex).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("hexDensidade", () => {
  const escala = escalaDe(PROTOCOLO_PADRAO);

  it("mais denso nunca recebe cor de faixa mais baixa", () => {
    const valores = [0, 0.05, 0.15, 0.25, 0.4, 0.8, 3];
    const indices = valores.map((v) =>
      escala.findIndex((f) => f.hex === hexDensidade(v, escala))
    );
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i], `densidade ${valores[i]}`).toBeGreaterThanOrEqual(indices[i - 1]);
    }
  });

  it("célula sem densidade usa a faixa mais baixa, e não uma cor de erro", () => {
    expect(hexDensidade(null, escala)).toBe(escala[0].hex);
    expect(hexDensidade(0, escala)).toBe(escala[0].hex);
  });

  it("valor acima do teto ainda cai na faixa mais alta", () => {
    expect(hexDensidade(9999, escala)).toBe(escala[escala.length - 1].hex);
  });

  it("sempre devolve hex, para o MapLibre nunca receber cor inválida", () => {
    for (const v of [null, -1, 0, 0.001, 1, 1e6]) {
      expect(hexDensidade(v, escala)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("faixasAutomaticas", () => {
  /**
   * A última faixa é aberta no topo — `max` vale Infinity de propósito,
   * porque `faixaDe` escolhe a primeira faixa em que `d < max` e é isso
   * que faz o topo capturar qualquer valor acima. As demais precisam ser
   * finitas e crescentes, senão a busca para na faixa errada.
   */
  const conferirContrato = (escala: ReturnType<typeof faixasAutomaticas>) => {
    expect(escala.length).toBeGreaterThan(0);
    expect(escala[escala.length - 1].max).toBe(Infinity);
    const anteriores = escala.slice(0, -1);
    expect(anteriores.every((f) => Number.isFinite(f.max))).toBe(true);
    for (let i = 1; i < escala.length; i++) {
      expect(escala[i].max).toBeGreaterThan(escala[i - 1].max);
    }
    expect(escala.every((f) => /^#[0-9a-f]{6}$/i.test(f.hex))).toBe(true);
  };

  it("aguenta lista vazia sem devolver escala quebrada", () => {
    conferirContrato(faixasAutomaticas([], "#2d7d72"));
  });

  it("aguenta todos os valores iguais, que zeraria a amplitude", () => {
    conferirContrato(faixasAutomaticas([0.3, 0.3, 0.3], "#2d7d72"));
  });

  it("ignora valor não finito vindo do banco em vez de contaminar a escala", () => {
    conferirContrato(faixasAutomaticas([0.2, NaN, Infinity, 0.6], "#2d7d72"));
  });

  it("todo valor observado encontra uma faixa", () => {
    const valores = [0, 0.01, 0.2, 0.5, 1.2];
    const escala = faixasAutomaticas(valores, "#2d7d72");
    for (const v of valores) {
      expect(hexDensidade(v, escala)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

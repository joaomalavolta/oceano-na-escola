import { describe, it, expect } from "vitest";
import { caminhoDaFoto } from "./fotos-da-escola";

/**
 * O caminho no Storage não é detalhe: a política do bucket lê o primeiro
 * segmento para decidir se quem envia responde pela escola. Caminho fora
 * da forma `escola-<id>/...` é recusado com um erro que não explica nada.
 */
describe("caminhoDaFoto", () => {
  const T = 1786000000000;

  it("todo caminho começa pela pasta da escola", () => {
    for (const destino of [
      { tipo: "capa_escola" as const },
      { tipo: "foto_turma" as const, turmaId: 7 },
      { tipo: "foto_turma" as const, turmaId: null },
      { tipo: "foto_campo" as const, expedicaoId: 15 },
    ]) {
      expect(caminhoDaFoto(42, destino, T)).toMatch(/^escola-42\//);
    }
  });

  it("cada tipo tem a sua pasta", () => {
    expect(caminhoDaFoto(1, { tipo: "capa_escola" }, T)).toBe(`escola-1/capa/${T}.jpg`);
    expect(caminhoDaFoto(1, { tipo: "foto_turma", turmaId: 3 }, T)).toBe(`escola-1/turma-3/${T}.jpg`);
    expect(caminhoDaFoto(1, { tipo: "foto_turma", turmaId: null }, T)).toBe(`escola-1/turma/${T}.jpg`);
    expect(caminhoDaFoto(1, { tipo: "foto_campo", expedicaoId: 9 }, T)).toBe(`escola-1/exp-9/${T}.jpg`);
  });

  it("a foto da saída usa a mesma pasta do registro de campo", () => {
    // O registro de ocorrência grava em escola-<id>/exp-<id>/. Fotos da
    // mesma saída, por qualquer porta, ficam juntas.
    expect(caminhoDaFoto(1, { tipo: "foto_campo", expedicaoId: 9 }, T).split("/")[1]).toBe("exp-9");
  });
});

import { describe, it, expect } from "vitest";
import { diasLegiveis, normalizarDias, fundacaoLegivel, anoDe, fundacaoValida } from "./ficha-escola";

describe("dias de aula", () => {
  it("dias soltos viram lista", () => {
    expect(diasLegiveis(["seg", "qua", "sex"])).toBe("segunda, quarta e sexta");
  });

  it("três ou mais seguidos viram intervalo", () => {
    expect(diasLegiveis(["seg", "ter", "qua", "qui", "sex"])).toBe("segunda a sexta");
    expect(diasLegiveis(["ter", "qua", "qui", "sab"])).toBe("terça a quinta e sábado");
  });

  it("dois seguidos não viram intervalo", () => {
    expect(diasLegiveis(["sab", "dom"])).toBe("sábado e domingo");
  });

  it("a semana inteira", () => {
    expect(diasLegiveis(["dom", "seg", "ter", "qua", "qui", "sex", "sab"])).toBe("todos os dias");
  });

  it("um dia só", () => {
    expect(diasLegiveis(["sab"])).toBe("sábado");
  });

  it("sem dias, sem frase", () => {
    expect(diasLegiveis([])).toBeNull();
    expect(diasLegiveis(null)).toBeNull();
  });

  it("ordena pela semana, tira repetidos e desconhecidos", () => {
    expect(normalizarDias(["sex", "seg", "seg", "feriado"])).toEqual(["seg", "sex"]);
  });
});

describe("fundação", () => {
  it("a data sai por extenso, sem voltar um dia", () => {
    expect(fundacaoLegivel("2015-03-01")).toBe("1 de março de 2015");
  });

  it("o ano", () => {
    expect(anoDe("2015-03-12")).toBe(2015);
    expect(anoDe(null)).toBeNull();
  });

  it("não aceita data no futuro, nem antes de 1900", () => {
    expect(fundacaoValida("2030-01-01", "2026-11-12")).toBe(false);
    expect(fundacaoValida("1899-12-31", "2026-11-12")).toBe(false);
    expect(fundacaoValida("2015-03-12", "2026-11-12")).toBe(true);
    expect(fundacaoValida("2026-11-12", "2026-11-12")).toBe(true);
    expect(fundacaoValida(null, "2026-11-12")).toBe(true);
  });
});

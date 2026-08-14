import { describe, it, expect } from "vitest";
import { esperaDesde } from "./administracao";

/**
 * A espera na fila de análise.
 *
 * O resto de `administracao.ts` conversa com o banco, e o que este
 * arquivo pode garantir sozinho é a conta do tempo — que é justamente
 * a parte que vira texto na tela do Ecosurf.
 */
describe("esperaDesde", () => {
  const AGORA = new Date("2026-08-14T15:00:00Z").getTime();
  const horas = (n: number) => new Date(AGORA - n * 3_600_000).toISOString();

  it("conta período de 24 horas, e não dia do calendário", () => {
    // Chegou ontem às 23h, mas faz menos de um dia. Dizer "chegou hoje"
    // seria falso, e é por isso que o texto fala em período e não em
    // data.
    expect(esperaDesde(horas(16), AGORA)).toBe("chegou há menos de um dia");
    expect(esperaDesde(horas(23.9), AGORA)).toBe("chegou há menos de um dia");
  });

  it("vira um dia ao completar as 24 horas", () => {
    expect(esperaDesde(horas(24), AGORA)).toBe("espera há 1 dia");
    expect(esperaDesde(horas(47.9), AGORA)).toBe("espera há 1 dia");
  });

  it("usa o plural a partir do segundo dia", () => {
    expect(esperaDesde(horas(48), AGORA)).toBe("espera há 2 dias");
    expect(esperaDesde(horas(24 * 30), AGORA)).toBe("espera há 30 dias");
  });

  it("não devolve espera negativa quando a data está no futuro", () => {
    // Relógio de máquina fora de hora não vira "espera há -3 dias" na
    // tela de quem está analisando a fila.
    expect(esperaDesde(horas(-72), AGORA)).toBe("chegou há menos de um dia");
  });

  it("não quebra com data inválida", () => {
    expect(esperaDesde("não é data", AGORA)).toBe("espera há um tempo indeterminado");
  });
});

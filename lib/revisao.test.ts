import { describe, it, expect } from "vitest";
import { custoDaCorrecao, ETAPAS, proximaEtapa, indiceDaEtapa } from "./revisao";

/**
 * O aviso que aparece antes de reabrir a ficha.
 *
 * Corrigir custa coisas diferentes em cada etapa, e o aviso genérico
 * seria pior que nenhum: quem está publicado precisa saber que o dado
 * sai do mapa, e quem está só "enviado" não pode ser assustado com um
 * texto que fala de mapa e de carimbo que ele não tem.
 */
describe("custoDaCorrecao", () => {
  it("não avisa nada em rascunho, onde a ficha já está aberta", () => {
    expect(custoDaCorrecao("rascunho")).toBeNull();
  });

  it("avisa que o dado sai do mapa quando está publicado", () => {
    const texto = custoDaCorrecao("publicado") ?? "";
    expect(texto).toContain("mapa");
    expect(texto).toContain("carimbo");
  });

  it("avisa do carimbo, e não do mapa, quando está apenas validado", () => {
    const texto = custoDaCorrecao("validado") ?? "";
    expect(texto).toContain("carimbo");
    expect(texto).not.toContain("mapa público");
  });

  it("dá um aviso curto nas etapas em que nada se perde", () => {
    for (const etapa of ["enviado", "revisado"]) {
      const texto = custoDaCorrecao(etapa) ?? "";
      expect(texto, etapa).not.toBe("");
      expect(texto, etapa).not.toContain("carimbo");
    }
  });

  it("toda etapa da régua tem um aviso, menos o rascunho", () => {
    // Etapa nova sem texto entraria em produção com aviso vazio.
    for (const etapa of ETAPAS) {
      if (etapa === "rascunho") continue;
      expect(custoDaCorrecao(etapa), etapa).toBeTruthy();
    }
  });
});

/**
 * A régua é a mesma do banco. Se alguém acrescentar uma etapa aqui e
 * esquecer o enum, a tela oferece um destino que o gatilho recusa.
 */
describe("régua das etapas", () => {
  it("vai do rascunho ao publicado, um degrau por vez", () => {
    expect(ETAPAS).toEqual(["rascunho", "enviado", "revisado", "validado", "publicado"]);
  });

  it("a última etapa não tem próxima", () => {
    expect(proximaEtapa("publicado")).toBeNull();
  });

  it("cada etapa aponta para a seguinte da lista", () => {
    ETAPAS.slice(0, -1).forEach((etapa, i) => {
      expect(proximaEtapa(etapa), etapa).toBe(ETAPAS[i + 1]);
    });
  });

  it("status desconhecido devolve -1, e os dois lados tratam isso", () => {
    // Não pode acontecer — o enum do banco constrange a coluna —, mas o
    // -1 é o que os chamadores recebem, e é ele que precisa não virar
    // índice fora do array. Para a frente, proximaEtapa devolve nulo;
    // para trás, a tela testa `> 0` antes de indexar ETAPAS[i - 1].
    const i = indiceDaEtapa("inexistente");
    expect(i).toBe(-1);
    expect(proximaEtapa("inexistente")).toBeNull();
    expect(i > 0).toBe(false);
  });
});

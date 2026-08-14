import { describe, it, expect } from "vitest";
import { ITENS_NAV, itensPara, estaAtivo } from "./itens";

/**
 * A regra da ordem existe para resolver um defeito visível: a sessão
 * chega depois da primeira pintura, então os itens privados sempre
 * entram com a página já na tela. Se algum deles vier antes de um
 * público, o menu se reorganiza na frente de quem está lendo.
 *
 * Isso foi medido uma vez no navegador, item por item, em pixels. Aqui
 * vira invariante: quem mexer na lista e quebrar a regra descobre no
 * teste, e não na tela de um professor.
 */
describe("ordem da navegação", () => {
  it("nenhum item público vem depois de um privado", () => {
    const primeiroPrivado = ITENS_NAV.findIndex((i) => i.privado);
    if (primeiroPrivado === -1) return;
    const depois = ITENS_NAV.slice(primeiroPrivado);
    expect(depois.every((i) => i.privado)).toBe(true);
  });

  it("cada item público mantém a posição quando a sessão chega", () => {
    const visitante = itensPara(false);
    const autenticado = itensPara(true);
    visitante.forEach((item, i) => {
      expect(autenticado[i]?.href, `o item "${item.label}" mudou de lugar`).toBe(item.href);
    });
  });

  it("o visitante vê só o que abre sem conta", () => {
    expect(itensPara(false).some((i) => i.privado)).toBe(false);
    expect(itensPara(true).length).toBeGreaterThan(itensPara(false).length);
  });

  it("não há href repetido", () => {
    const hrefs = ITENS_NAV.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("estaAtivo", () => {
  it("a raiz só acende nela mesma", () => {
    expect(estaAtivo("/", "/")).toBe(true);
    expect(estaAtivo("/", "/escolas")).toBe(false);
    expect(estaAtivo("/", "/dados")).toBe(false);
  });

  it("acende por prefixo de caminho", () => {
    expect(estaAtivo("/expedicoes", "/expedicoes")).toBe(true);
    expect(estaAtivo("/expedicoes", "/expedicoes/5/revisar")).toBe(true);
    expect(estaAtivo("/escola", "/escola/em-duna-alta")).toBe(true);
  });

  it("não acende por prefixo de palavra", () => {
    // "/escolas" não pode acender "/escola", que é outra rota.
    expect(estaAtivo("/escola", "/escolas")).toBe(false);
    expect(estaAtivo("/dados", "/dados-abertos")).toBe(false);
  });

  it("um caminho acende no máximo um item do menu", () => {
    for (const caminho of ["/", "/escolas", "/dados", "/painel", "/expedicoes/5/revisar"]) {
      const acesos = ITENS_NAV.filter((i) => estaAtivo(i.href, caminho));
      expect(acesos.length, `${caminho} acendeu ${acesos.length} itens`).toBeLessThanOrEqual(1);
    }
  });
});

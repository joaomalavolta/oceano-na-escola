import { describe, it, expect } from "vitest";
import { ITENS_NAV, itensPara, itensDoPolegar, estaAtivo } from "./itens";

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

/**
 * A barra do polegar é seleção, não recorte: ela deixa "Dados" de fora
 * para caber "Expedições", que é onde o professor trabalha. O que ela
 * não pode fazer é inventar ordem — se um item aparecer no celular
 * antes de outro que no desktop vem depois, a mão passa a ter dois
 * lugares para aprender.
 */
describe("barra do polegar", () => {
  const ehSubsequencia = (parte: string[], todo: string[]) => {
    let i = 0;
    for (const x of todo) if (x === parte[i]) i++;
    return i === parte.length;
  };

  it("é sempre uma subsequência do menu completo", () => {
    for (const autenticado of [false, true]) {
      const polegar = itensDoPolegar(autenticado).map((i) => i.href);
      const menu = itensPara(autenticado).map((i) => i.href);
      expect(ehSubsequencia(polegar, menu), autenticado ? "logado" : "visitante").toBe(true);
    }
  });

  it("cabe na barra: no máximo quatro", () => {
    expect(itensDoPolegar(false).length).toBeLessThanOrEqual(4);
    expect(itensDoPolegar(true).length).toBeLessThanOrEqual(4);
  });

  /**
   * A decisão, escrita: o professor alcança Expedições com o polegar, e
   * "Dados" — indicadores públicos — cede o lugar. Quem mudar isso muda
   * um acordo, não um detalhe, e o teste faz a mudança ser deliberada.
   */
  it("leva o professor às expedições, e não aos indicadores públicos", () => {
    const hrefs = itensDoPolegar(true).map((i) => i.href);
    expect(hrefs).toEqual(["/", "/escolas", "/painel", "/expedicoes"]);
    expect(hrefs).not.toContain("/dados");
  });

  it("para o visitante, os três públicos", () => {
    expect(itensDoPolegar(false).map((i) => i.href)).toEqual(["/", "/escolas", "/dados"]);
  });

  it("não mostra ao visitante o que exige conta", () => {
    expect(itensDoPolegar(false).some((i) => i.privado)).toBe(false);
  });

  it("só escolhe itens que existem no menu", () => {
    const hrefs = new Set(ITENS_NAV.map((i) => i.href));
    for (const autenticado of [false, true]) {
      for (const item of itensDoPolegar(autenticado)) {
        expect(hrefs.has(item.href), `${item.href} não está em ITENS_NAV`).toBe(true);
      }
    }
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

import { describe, it, expect } from "vitest";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DESTINOS } from "./voltar";
import { ITENS_NAV } from "./itens";

const RAIZ = join(process.cwd(), "app");

/** As rotas que existem no disco, lidas de app/ como o Next as lê. */
function rotasDoDisco(dir = RAIZ, prefixo = ""): string[] {
  const rotas: string[] = [];
  if (existsSync(join(dir, "page.tsx"))) rotas.push(prefixo === "" ? "/" : prefixo);
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (!entrada.isDirectory()) continue;
    // Segmento dinâmico não é destino fixo, e agrupamento não entra na URL.
    if (entrada.name.startsWith("[") || entrada.name.startsWith("(")) continue;
    if (entrada.name === "api") continue;
    rotas.push(...rotasDoDisco(join(dir, entrada.name), `${prefixo}/${entrada.name}`));
  }
  return rotas;
}

/**
 * Esta rota tem páginas filhas no disco?
 *
 * Olha o diretório, e não a lista de rotas fixas: o filho de
 * `/manuais` é `[slug]`, que a varredura de rotas pula de propósito
 * por não ser destino. Era esse o furo que fazia `/manuais` parecer
 * uma folha sem nada embaixo.
 */
function temSubpaginas(href: string): boolean {
  const dir = join(RAIZ, href === "/" ? "" : href.slice(1));
  if (!existsSync(dir)) return false;
  return readdirSync(dir, { withFileTypes: true }).some(
    (e) => e.isDirectory() && existsSync(join(dir, e.name, "page.tsx"))
  );
}

/**
 * O botão de voltar promete um lugar pelo nome.
 *
 * Um destino apontando para rota que não existe dá 404 — e dá 404 para
 * quem já estava perdido, que é justamente quem clicou. Como os
 * destinos são poucos e fixos, dá para conferir todos contra o disco.
 */
describe("destinos do botão de voltar", () => {
  const rotas = rotasDoDisco();

  it("encontra as rotas do projeto", () => {
    // Guarda contra o próprio teste: se a varredura devolvesse vazio,
    // as asserções abaixo passariam sem verificar nada.
    expect(rotas.length).toBeGreaterThan(5);
    expect(rotas).toContain("/painel");
  });

  it("todo destino aponta para uma página que existe", () => {
    for (const [chave, d] of Object.entries(DESTINOS)) {
      expect(rotas, `${chave} → ${d.href}`).toContain(d.href);
    }
  });

  it("todo destino diz para onde vai, e não só «voltar»", () => {
    for (const [chave, d] of Object.entries(DESTINOS)) {
      expect(d.texto, chave).toMatch(/^Voltar /);
      expect(d.texto.length, chave).toBeGreaterThan("Voltar".length + 2);
    }
  });

  it("não há dois destinos para o mesmo lugar com nomes diferentes", () => {
    const hrefs = Object.values(DESTINOS).map((d) => d.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  /**
   * O que é um destino, escrito como teste.
   *
   * A primeira versão desta regra dizia "todo destino está no menu de
   * cima" — e o teste reprovou `/manuais`, com razão. O menu não é o
   * critério: `/manuais` não está lá, é atalho do painel, e ainda assim
   * é para onde se volta do manual do aluno.
   *
   * O critério verdadeiro é ser um lugar de onde se sai para páginas
   * filhas: ou está no menu, ou tem subpáginas no disco. Página folha
   * não é destino de volta — voltar para ela seria voltar para outro
   * beco.
   */
  it("todo destino é um lugar do qual se desce para outras páginas", () => {
    const noMenu = new Set(ITENS_NAV.map((i) => i.href));

    for (const [chave, d] of Object.entries(DESTINOS)) {
      expect(
        noMenu.has(d.href) || temSubpaginas(d.href),
        `${chave} → ${d.href} não está no menu nem tem subpáginas`
      ).toBe(true);
    }
  });

  it("«manuais» é o caso que o menu sozinho não explicaria", () => {
    // O índice dos manuais não está no menu — é atalho do painel — e
    // mesmo assim é destino, porque tem as duas folhas embaixo dele.
    expect(ITENS_NAV.map((i) => i.href)).not.toContain(DESTINOS.manuais.href);
    expect(temSubpaginas(DESTINOS.manuais.href)).toBe(true);
  });
});

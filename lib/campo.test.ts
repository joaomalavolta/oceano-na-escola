import { describe, it, expect, beforeEach } from "vitest";
import { guardarCatalogo, catalogoGuardado } from "./campo";

/**
 * O catálogo guardado é o que faz o modo offline existir: sem ele, a
 * página de campo abre sem expedições nem protocolos, o formulário não
 * aparece e a fila fica inalcançável justamente na praia.
 *
 * Como ele vive em localStorage, o modo anônimo do navegador e a cota
 * cheia são cenários reais — e o dado guardado pode estar corrompido de
 * uma versão anterior do app. Nenhum deles pode derrubar a página.
 */
const CHAVE = "oceano.campo.catalogo";

const expedicao = {
  id: 7,
  numero: 3,
  titulo: "Saída de teste",
  data_campo: "2026-08-13",
  escola_id: 1,
  escola_nome: "E.M. Duna Alta",
};

const protocolo = {
  versao_id: 2,
  codigo: "ESG",
  nome: "Esgoto e drenagem",
  cor: "#8a5a2b",
  icone: null,
  metodo: null,
  itens: [{ id: 9, codigo: "PLD", nome: "Ponto de lançamento", icone: null, unidade: "pontos" }],
};

describe("catálogo de campo guardado no aparelho", () => {
  beforeEach(() => window.localStorage.clear());

  it("volta igual ao que entrou", () => {
    guardarCatalogo([expedicao], [protocolo]);
    const memo = catalogoGuardado();
    expect(memo?.expedicoes).toEqual([expedicao]);
    expect(memo?.protocolos).toEqual([protocolo]);
  });

  it("registra quando foi guardado, que é o que a tela mostra ao professor", () => {
    guardarCatalogo([expedicao], [protocolo]);
    const em = catalogoGuardado()?.em;
    expect(em).toBeTruthy();
    expect(Number.isNaN(new Date(em!).getTime())).toBe(false);
  });

  it("sem nada guardado, devolve null em vez de um catálogo vazio", () => {
    expect(catalogoGuardado()).toBeNull();
  });

  it("dado corrompido devolve null em vez de derrubar a página", () => {
    window.localStorage.setItem(CHAVE, "{isto nao e json");
    expect(catalogoGuardado()).toBeNull();
  });

  it("formato de outra versão do app devolve null", () => {
    window.localStorage.setItem(CHAVE, JSON.stringify({ expedicoes: "nao e lista" }));
    expect(catalogoGuardado()).toBeNull();
  });

  it("lista vazia é guardada como tal — 'nenhuma saída aberta' também é resposta", () => {
    guardarCatalogo([], []);
    expect(catalogoGuardado()?.expedicoes).toEqual([]);
  });

  it("a última gravação manda", () => {
    guardarCatalogo([expedicao], [protocolo]);
    guardarCatalogo([], [protocolo]);
    expect(catalogoGuardado()?.expedicoes).toHaveLength(0);
  });
});

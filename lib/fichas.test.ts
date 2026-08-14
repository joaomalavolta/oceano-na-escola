import { describe, it, expect } from "vitest";
import {
  dividirEmColunas,
  paginasDaFicha,
  totalDePaginas,
  PAGINAS_DA_CONSOLIDACAO,
  codigoOcorrencia,
  lerCodigoOcorrencia,
  comporFicha,
  linhasDeOcorrencia,
  serie,
} from "./fichas";
import type { DefinicaoProtocolo, SecaoProtocolo } from "./transcricao";

function secao(codigo: string, nome: string, campos: string[] = []): SecaoProtocolo {
  return {
    id: codigo.length,
    codigo,
    nome,
    ordem: 1,
    campos: campos.map((rotulo, i) => ({
      id: i + 1,
      codigo: `c${i}`,
      rotulo,
      tipo: "numero",
      unidade: null,
      obrigatorio: false,
      opcoes: null,
      ordem: i,
    })),
  };
}

function def(p: Partial<DefinicaoProtocolo> = {}): DefinicaoProtocolo {
  return {
    versao_id: 1,
    codigo: "RES",
    nome: "Resíduos",
    versao: "1.0",
    secoes: [],
    itens: [],
    ...p,
  };
}

/**
 * O código é a única coisa que liga uma linha escrita a lápis a uma
 * foto com GPS. Se ele sair errado da ficha impressa, a ligação some —
 * e some depois da saída de campo, quando não há como refazer.
 */
describe("código da ocorrência", () => {
  it("junta equipe e sequência num rótulo curto", () => {
    expect(codigoOcorrencia(2, 3)).toBe("E2-03");
    expect(codigoOcorrencia(1, 1)).toBe("E1-01");
  });

  it("mantém duas casas para a ordenação por texto não mentir", () => {
    // Sem o zero à esquerda, "E2-10" viria antes de "E2-2" numa lista
    // ordenada como texto — e a conferência do professor sai fora de
    // ordem justamente onde ela precisa bater linha a linha.
    const ordenado = [1, 2, 10, 11].map((n) => codigoOcorrencia(2, n)).sort();
    expect(ordenado).toEqual(["E2-01", "E2-02", "E2-10", "E2-11"]);
  });

  it("volta a ler o que escreveu", () => {
    for (const [e, s] of [
      [1, 1],
      [3, 7],
      [12, 30],
    ] as const) {
      expect(lerCodigoOcorrencia(codigoOcorrencia(e, s))).toEqual({ equipe: e, sequencia: s });
    }
  });

  it("tolera como uma pessoa realmente digita", () => {
    // O código é digitado no celular, no sol, com a mão suja de areia.
    for (const bruto of [" e2-03 ", "E2 - 03", "e2-3", "E2-3"]) {
      expect(lerCodigoOcorrencia(bruto), bruto).toEqual({ equipe: 2, sequencia: 3 });
    }
  });

  it("recusa o que não é código", () => {
    for (const bruto of ["", "E2", "2-03", "EA-03", "E2-03 cano", "E0-01", "E2-00"]) {
      expect(lerCodigoOcorrencia(bruto), bruto).toBeNull();
    }
  });
});

describe("composição da ficha por protocolo", () => {
  it("agrupa os itens preservando a ordem do protocolo", () => {
    const c = comporFicha(
      def({
        itens: [
          { id: 1, codigo: "a", nome: "Bituca", grupo: "Plástico", ordem: 1 },
          { id: 2, codigo: "b", nome: "Sacola", grupo: "Plástico", ordem: 2 },
          { id: 3, codigo: "c", nome: "Lata", grupo: "Metal", ordem: 3 },
        ],
      })
    );
    expect(c.grupos.map((g) => g.grupo)).toEqual(["Plástico", "Metal"]);
    expect(c.grupos[0].itens.map((i) => i.nome)).toEqual(["Bituca", "Sacola"]);
    expect(c.soOcorrencias).toBe(false);
  });

  it("um grupo que volta a aparecer não se funde com o anterior", () => {
    // Fundir mudaria a ordem impressa em relação à tela de transcrição,
    // e a equipe passaria a riscar numa linha que não é a mesma.
    const c = comporFicha(
      def({
        itens: [
          { id: 1, codigo: "a", nome: "Bituca", grupo: "Plástico", ordem: 1 },
          { id: 2, codigo: "b", nome: "Lata", grupo: "Metal", ordem: 2 },
          { id: 3, codigo: "c", nome: "Canudo", grupo: "Plástico", ordem: 3 },
        ],
      })
    );
    expect(c.grupos.map((g) => g.grupo)).toEqual(["Plástico", "Metal", "Plástico"]);
  });

  it("item sem grupo não deixa a faixa em branco na ficha", () => {
    const c = comporFicha(
      def({ itens: [{ id: 1, codigo: "a", nome: "Algo", grupo: "", ordem: 1 }] })
    );
    expect(c.grupos[0].grupo).toBe("Itens");
  });

  it("reconhece o protocolo que só registra ocorrências", () => {
    // AGU, AVI, DES, ESG e RST não contam nada: a ocorrência é o dado.
    const c = comporFicha(def({ codigo: "ESG", secoes: [secao("qualitativo", "Observações")] }));
    expect(c.soOcorrencias).toBe(true);
    expect(c.grupos).toHaveLength(0);
  });

  it("a grade de quadrats não conta como protocolo de ocorrência", () => {
    const c = comporFicha(
      def({ codigo: "MIC", secoes: [secao("quadrat", "Contagem por quadrat", ["Pellet"])] })
    );
    expect(c.soOcorrencias).toBe(false);
    expect(c.quadrat?.campos).toHaveLength(1);
  });

  it("encontra cada seção pelo código, sem depender da ordem", () => {
    const c = comporFicha(
      def({
        secoes: [
          secao("qualitativo", "Observações"),
          secao("esforco", "Esforço", ["Comprimento"]),
          secao("pontual", "Registro pontual", ["Origem provável"]),
        ],
      })
    );
    expect(c.esforco?.nome).toBe("Esforço");
    expect(c.pontual?.campos[0].rotulo).toBe("Origem provável");
    expect(c.qualitativo?.nome).toBe("Observações");
  });
});

describe("quantas linhas de ocorrência a ficha imprime", () => {
  const contagem = comporFicha(
    def({ itens: [{ id: 1, codigo: "a", nome: "Bituca", grupo: "Plástico", ordem: 1 }] })
  );
  const ocorrencia = comporFicha(def({ secoes: [secao("qualitativo", "Obs")] }));

  it("dá mais linhas onde a ocorrência é o dado principal", () => {
    expect(linhasDeOcorrencia(ocorrencia)).toBeGreaterThan(linhasDeOcorrencia(contagem));
  });

  it("o professor pode pedir outro número", () => {
    expect(linhasDeOcorrencia(contagem, 12)).toBe(12);
  });

  it("um pedido absurdo não estoura a folha", () => {
    expect(linhasDeOcorrencia(contagem, 999)).toBe(30);
  });

  it("pedido vazio ou zero cai no padrão", () => {
    expect(linhasDeOcorrencia(contagem, 0)).toBe(linhasDeOcorrencia(contagem));
    expect(linhasDeOcorrencia(contagem, undefined)).toBe(linhasDeOcorrencia(contagem));
  });
});

describe("serie", () => {
  it("numera a partir de 1, que é como a equipe se chama", () => {
    expect(serie(3)).toEqual([1, 2, 3]);
  });

  it("não quebra com zero nem com negativo", () => {
    expect(serie(0)).toEqual([]);
    expect(serie(-2)).toEqual([]);
  });
});

/**
 * O número de páginas que a tela promete.
 *
 * Medido gerando o PDF A4 de cada protocolo, não estimado. A escola
 * carrega a bandeja pelo que a tela disse — prometer sete folhas e a
 * impressora cuspir catorze é o tipo de erro que só aparece na véspera
 * da saída de campo.
 */
describe("quantas páginas o trabalho de impressão tem", () => {
  const comContagem = comporFicha(
    def({ itens: [{ id: 1, codigo: "a", nome: "Bituca", grupo: "Plástico", ordem: 1 }] })
  );
  const soOcorrencia = comporFicha(def({ secoes: [secao("qualitativo", "Obs")] }));

  it("a ficha com contagem ocupa frente e verso", () => {
    expect(paginasDaFicha(comContagem)).toBe(2);
  });

  it("a ficha só de ocorrências cabe numa página", () => {
    expect(paginasDaFicha(soOcorrencia)).toBe(1);
  });

  it("o total soma a consolidação uma vez e a ficha por equipe", () => {
    expect(totalDePaginas(comContagem, 4)).toBe(PAGINAS_DA_CONSOLIDACAO + 8);
    expect(totalDePaginas(soOcorrencia, 6)).toBe(PAGINAS_DA_CONSOLIDACAO + 6);
  });

  it("sem equipe nenhuma, ainda sai a consolidação", () => {
    expect(totalDePaginas(comContagem, 0)).toBe(PAGINAS_DA_CONSOLIDACAO);
    expect(totalDePaginas(comContagem, -3)).toBe(PAGINAS_DA_CONSOLIDACAO);
  });
});

describe("dividirEmColunas", () => {
  const grupo = (nome: string, n: number) => ({
    grupo: nome,
    itens: Array.from({ length: n }, (_, i) => ({ id: i, nome: `${nome} ${i}` })),
  });

  it("equilibra por número de linhas, e não por número de grupos", () => {
    // "Plástico" tem dezesseis itens e os outros têm um: dividir por
    // grupos deixaria a primeira coluna com o triplo da altura.
    const colunas = dividirEmColunas([
      grupo("Plástico", 16),
      grupo("Metal", 1),
      grupo("Vidro", 1),
      grupo("Papel", 1),
    ]);
    const altura = (c: typeof colunas[number]) =>
      c.reduce((s, g) => s + g.itens.length + 1, 0);
    expect(colunas).toHaveLength(2);
    expect(Math.abs(altura(colunas[0]) - altura(colunas[1]))).toBeLessThan(altura(colunas[0]));
  });

  it("não perde nem duplica grupo nenhum", () => {
    const entrada = [grupo("A", 3), grupo("B", 2), grupo("C", 5), grupo("D", 1)];
    const saida = dividirEmColunas(entrada).flat();
    expect(saida.map((g) => g.grupo).sort()).toEqual(["A", "B", "C", "D"]);
  });

  it("preserva a ordem dentro de cada coluna", () => {
    const entrada = [grupo("A", 2), grupo("B", 2), grupo("C", 2), grupo("D", 2)];
    for (const coluna of dividirEmColunas(entrada)) {
      const nomes = coluna.map((g) => g.grupo);
      expect([...nomes].sort()).toEqual(nomes);
    }
  });

  it("um grupo só não vira duas colunas com uma vazia", () => {
    expect(dividirEmColunas([grupo("A", 4)]).filter((c) => c.length > 0)).toHaveLength(1);
  });

  it("lista vazia devolve estrutura utilizável", () => {
    expect(dividirEmColunas([])).toEqual([[]]);
  });
});

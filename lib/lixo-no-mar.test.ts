import { describe, it, expect } from "vitest";
import {
  LIXO_VAZIO,
  MATERIAIS,
  chaveDaMarca,
  juntarMarcas,
  problemasDoLixo,
  quantidadeDoPonto,
  resumoDoLixo,
  temAlgumDado,
  volumeLegivel,
} from "./lixo-no-mar";

describe("chave da marca", () => {
  it("é a mesma para grafias que diferem só em caixa, acento e espaço", () => {
    expect(chaveDaMarca("Marca Fictícia")).toBe("marca ficticia");
    expect(chaveDaMarca("  MARCA   ficticia ")).toBe("marca ficticia");
    expect(chaveDaMarca("Ção Ñu")).toBe("cao nu");
  });
});

describe("marcas de um ponto", () => {
  it("junta repetidas somando e descarta vazias", () => {
    expect(
      juntarMarcas([
        { marca: "Marca A", quantidade: 3 },
        { marca: "marca á", quantidade: 2 },
        { marca: "  ", quantidade: 4 },
        { marca: "Marca B", quantidade: 0 },
      ])
    ).toEqual([{ marca: "Marca A", quantidade: 5 }]);
  });
});

describe("quantidade do ponto", () => {
  it("vale a estimativa quando existe", () => {
    expect(quantidadeDoPonto({ ...LIXO_VAZIO, quantidadeEstimada: 40, itens: { 3: 10 } })).toBe(40);
  });
  it("sem estimativa, soma a contagem por tipo", () => {
    expect(quantidadeDoPonto({ ...LIXO_VAZIO, itens: { 3: 10, 6: 5 } })).toBe(15);
  });
  it("sem nada, é presença", () => {
    expect(quantidadeDoPonto(LIXO_VAZIO)).toBeNull();
    expect(temAlgumDado(LIXO_VAZIO)).toBe(false);
  });
});

describe("conferência", () => {
  it("litros sem sacos não passa, como no banco", () => {
    expect(problemasDoLixo({ ...LIXO_VAZIO, litrosPorSaco: 100 })).toHaveLength(1);
  });
  it("quantidade fracionada não passa", () => {
    expect(problemasDoLixo({ ...LIXO_VAZIO, quantidadeEstimada: 2.5 })).toHaveLength(1);
  });
  it("um ponto completo passa", () => {
    expect(
      problemasDoLixo({ quantidadeEstimada: 40, sacos: 2, litrosPorSaco: 100, material: "plastico", itens: { 3: 12 }, marcas: [{ marca: "X", quantidade: 1 }] })
    ).toEqual([]);
  });
});

describe("textos", () => {
  it("volume com e sem tamanho do saco", () => {
    expect(volumeLegivel(2, 100)).toBe("2 sacos de 100 L");
    expect(volumeLegivel(1, null)).toBe("1 saco");
    expect(volumeLegivel(null, null)).toBeNull();
  });
  it("resumo de uma linha", () => {
    expect(resumoDoLixo({ quantidade_estimada: 40, sacos: 2, litros_por_saco: 100, material: "plastico", marcas: [{ marca: "X", quantidade: 1 }] })).toBe(
      "~40 itens · 2 sacos de 100 L · Plástico · 1 marca(s)"
    );
  });
  it("materiais batem com o check do banco", () => {
    expect(MATERIAIS.map((m) => m.id)).toEqual([
      "plastico", "isopor", "metal", "vidro", "papel", "borracha", "tecido", "madeira", "saude", "outros", "misto",
    ]);
  });
});

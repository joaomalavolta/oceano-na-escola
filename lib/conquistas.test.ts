import { describe, it, expect } from "vitest";
import { calcularConquistas } from "./conquistas";
import type { PubIndicadorEscola } from "./database.types";

/**
 * As conquistas são lidas por estudantes, e por isso erram feio quando
 * erram: uma escola que não fez nada aparecendo premiada, ou uma escola
 * que monitorou o ano inteiro aparecendo zerada.
 *
 * Duas regras vêm do documento de concepção e não são detalhe de código:
 * nada de ranking entre escolas — cada uma mede contra o próprio
 * percurso — e nada é gravado, tudo se deriva do que já está publicado.
 */
const indicador = (campos: Partial<PubIndicadorEscola>): PubIndicadorEscola =>
  ({
    escola_id: 1,
    escola_nome: "E.M. Duna Alta",
    escola_slug: "em-duna-alta",
    municipio: "Itanhaém",
    expedicoes: 0,
    extensao_total_m: 0,
    itens_catalogados: 0,
    ...campos,
  }) as PubIndicadorEscola;

describe("calcularConquistas", () => {
  it("escola sem nada não recebe conquista nenhuma", () => {
    const cs = calcularConquistas(indicador({}), [], [], 0);
    expect(cs.length).toBeGreaterThan(0);
    expect(cs.every((c) => !c.conquistada)).toBe(true);
    expect(cs.every((c) => c.atual === 0)).toBe(true);
  });

  it("sem indicador nenhum ainda devolve a lista, em vez de quebrar a página", () => {
    const cs = calcularConquistas(null, [], [], 0);
    expect(cs.length).toBeGreaterThan(0);
  });

  it("o progresso nunca passa da meta nem fica negativo", () => {
    for (const n of [0, 1, 3, 12, 400, 99999]) {
      const cs = calcularConquistas(
        indicador({ expedicoes: n, extensao_total_m: n * 500, itens_catalogados: n * 90 }),
        [],
        [],
        n
      );
      for (const c of cs) {
        expect(c.atual, `${c.id} com n=${n}`).toBeGreaterThanOrEqual(0);
        expect(c.meta, `${c.id} com n=${n}`).toBeGreaterThan(0);
      }
    }
  });

  /**
   * A conquista tem degraus: `conquistada` marca ter alcançado o
   * primeiro, e `meta` passa a apontar o degrau seguinte. Por isso
   * `atual` pode ser menor que `meta` numa conquista já conquistada —
   * não é incoerência, é o próximo alvo. O que não pode acontecer é
   * desconquistar, nem a meta andar para trás.
   */
  it("uma vez conquistada, não se perde ao subir o valor", () => {
    const serie = [0, 1, 2, 5, 10, 50, 500].map((n) =>
      calcularConquistas(indicador({ expedicoes: n }), [], [], 0)
    );
    const ids = serie[0].map((c) => c.id);
    for (const id of ids) {
      const conquistas = serie.map((cs) => cs.find((c) => c.id === id)!);
      for (let i = 1; i < conquistas.length; i++) {
        if (conquistas[i - 1].conquistada) {
          expect(conquistas[i].conquistada, `${id} desconquistou`).toBe(true);
        }
        expect(conquistas[i].meta, `${id}: a meta andou para trás`).toBeGreaterThanOrEqual(
          conquistas[i - 1].meta
        );
      }
    }
  });

  it("escola zerada não tem conquista alguma marcada", () => {
    const cs = calcularConquistas(indicador({}), [], [], 0);
    expect(cs.some((c) => c.conquistada)).toBe(false);
  });

  it("mais dado nunca reduz o que já foi conquistado", () => {
    const conta = (n: number) =>
      calcularConquistas(
        indicador({ expedicoes: n, extensao_total_m: n * 500, itens_catalogados: n * 90 }),
        [],
        [],
        n
      ).filter((c) => c.conquistada).length;

    let anterior = 0;
    for (const n of [0, 1, 2, 4, 8, 16, 32, 64]) {
      const agora = conta(n);
      expect(agora, `caiu ao passar para ${n}`).toBeGreaterThanOrEqual(anterior);
      anterior = agora;
    }
  });

  it("cada conquista tem id único e texto para o estudante ler", () => {
    const cs = calcularConquistas(indicador({ expedicoes: 3 }), [], [], 2);
    expect(new Set(cs.map((c) => c.id)).size).toBe(cs.length);
    for (const c of cs) {
      expect(c.nome.trim()).not.toBe("");
      expect(c.descricao.trim()).not.toBe("");
      expect(c.progresso.trim()).not.toBe("");
      expect(c.cor).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("não compara a escola com nenhuma outra", () => {
    const cs = calcularConquistas(indicador({ expedicoes: 3 }), [], [], 0);
    const texto = cs.map((c) => `${c.nome} ${c.descricao} ${c.progresso}`).join(" ").toLowerCase();
    for (const palavra of ["ranking", "posição", "lugar", "melhor escola", "1º", "top "]) {
      expect(texto, `apareceu "${palavra}"`).not.toContain(palavra);
    }
  });
});

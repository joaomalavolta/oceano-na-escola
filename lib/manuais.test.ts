import { describe, it, expect } from "vitest";
import { MANUAIS, manualPorSlug, type Bloco } from "./manuais";

const blocos = (m: (typeof MANUAIS)[number]): Bloco[] => m.secoes.flatMap((s) => s.blocos);

describe("estrutura dos manuais", () => {
  it("todo manual é alcançável pelo slug da URL", () => {
    for (const m of MANUAIS) expect(manualPorSlug(m.slug)?.titulo).toBe(m.titulo);
    expect(manualPorSlug("inexistente")).toBeNull();
  });

  it("os ids de seção não se repetem dentro do mesmo manual", () => {
    // Id repetido quebraria a chave do React e, um dia, a âncora de link.
    for (const m of MANUAIS) {
      const ids = m.secoes.map((s) => s.id);
      expect(new Set(ids).size, m.slug).toBe(ids.length);
    }
  });

  it("nenhuma seção fica vazia", () => {
    for (const m of MANUAIS) {
      for (const s of m.secoes) {
        expect(s.blocos.length, `${m.slug}/${s.id}`).toBeGreaterThan(0);
        expect(s.titulo.trim(), `${m.slug}/${s.id}`).not.toBe("");
      }
    }
  });

  it("nenhum texto entra em branco", () => {
    for (const b of MANUAIS.flatMap(blocos)) {
      if (b.tipo === "paragrafo") expect(b.texto.trim()).not.toBe("");
      if (b.tipo === "aviso") {
        expect(b.titulo.trim()).not.toBe("");
        expect(b.texto.trim()).not.toBe("");
      }
      if (b.tipo === "lista") {
        expect(b.itens.length).toBeGreaterThan(0);
        for (const i of b.itens) expect(i.trim()).not.toBe("");
      }
      if (b.tipo === "passos") {
        expect(b.itens.length).toBeGreaterThan(0);
        for (const p of b.itens) {
          expect(p.titulo.trim()).not.toBe("");
          expect(p.texto.trim()).not.toBe("");
        }
      }
    }
  });

  /**
   * Uma linha com menos células que o cabeçalho não dá erro: ela
   * renderiza torta, com a última coluna vazia, e ninguém percebe até
   * o manual estar impresso e distribuído.
   */
  it("toda linha de tabela tem tantas células quanto o cabeçalho", () => {
    for (const m of MANUAIS) {
      for (const s of m.secoes) {
        for (const b of s.blocos) {
          if (b.tipo !== "tabela") continue;
          expect(b.cabecalho.length, `${m.slug}/${s.id}`).toBeGreaterThan(0);
          for (const [i, linha] of b.linhas.entries()) {
            expect(linha.length, `${m.slug}/${s.id} linha ${i}`).toBe(b.cabecalho.length);
          }
        }
      }
    }
  });
});

/**
 * O manual do aluno vai para as mãos de crianças numa praia onde a
 * ficha de contagem inclui seringa, agulha e caco de vidro. Estas
 * asserções não são sobre formatação: elas impedem que uma reescrita
 * futura remova, sem perceber, os avisos que justificam entregar esse
 * papel a um aluno.
 */
describe("o manual do aluno protege quem o lê", () => {
  const aluno = manualPorSlug("aluno")!;
  const texto = JSON.stringify(aluno).toLowerCase();

  it("existe e vem antes de qualquer instrução de contagem", () => {
    const ids = aluno.secoes.map((s) => s.id);
    expect(ids).toContain("seguranca");
    expect(ids.indexOf("seguranca")).toBeLessThan(ids.indexOf("contar"));
  });

  it("diz para não pegar material perfurocortante com a mão", () => {
    expect(texto).toContain("seringa");
    expect(texto).toContain("nunca pegue com a mão");
  });

  it("proíbe fotografar rosto, que é o que vai para o mapa público", () => {
    expect(texto).toContain("nunca fotografe o rosto");
  });

  it("traz pelo menos dois avisos de perigo", () => {
    const perigos = blocos(aluno).filter((b) => b.tipo === "aviso" && b.nivel === "perigo");
    expect(perigos.length).toBeGreaterThanOrEqual(2);
  });

  it("manda medir o trecho antes de contar", () => {
    // É o passo que todo mundo esquece, e sem ele a contagem não vira
    // densidade — o dado da turma inteira deixa de servir para comparar.
    const ids = aluno.secoes.map((s) => s.id);
    expect(ids.indexOf("medir")).toBeLessThan(ids.indexOf("contar"));
  });
});

describe("o manual do professor cobre o que a plataforma exige", () => {
  const professor = manualPorSlug("professor")!;
  const texto = JSON.stringify(professor).toLowerCase();

  it("lista os sete protocolos pelo código", () => {
    for (const codigo of ["RES", "MIC", "AGU", "ESG", "DES", "RST", "AVI"]) {
      expect(JSON.stringify(professor), codigo).toContain(`"${codigo}"`);
    }
  });

  it("explica as três condições que decidem se o dado aparece", () => {
    expect(texto).toContain("três unidades");
    expect(texto).toContain("aprovada");
    expect(texto).toContain("esforço amostral");
  });

  it("diz como corrigir uma expedição já publicada", () => {
    expect(texto).toContain("corrigir a ficha");
  });

  it("declara que o método ainda precisa de revisão do Ecosurf", () => {
    // Enquanto for verdade, o manual tem de dizer. Quando deixar de
    // ser, este teste é o lembrete de apagar o aviso.
    expect(texto).toContain("revisão");
  });
});

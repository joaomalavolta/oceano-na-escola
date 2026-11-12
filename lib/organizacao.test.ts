import { describe, it, expect, beforeEach } from "vitest";
import {
  TIPOS,
  PROGRAMA,
  tipoDe,
  vocabulario,
  redeDaUrl,
  lembrarTipo,
  tipoLembrado,
  esquecerTipo,
  rotuloDoPino,
} from "./organizacao";

describe("tipo de organização", () => {
  it("o que não for surf é regular", () => {
    // Mock, view antiga sem a coluna, valor nulo: a plataforma nasceu só
    // com escola regular, e é para lá que o desconhecido cai.
    for (const bruto of [undefined, null, "", "regular", "outra", 3]) {
      expect(tipoDe(bruto), String(bruto)).toBe("regular");
    }
    expect(tipoDe("surf")).toBe("surf");
  });
});

/**
 * As telas montam frases com estes termos. Um termo em branco não dá
 * erro: dá um rótulo vazio no cadastro ou uma frase com buraco, e só
 * aparece para quem escolheu aquele tipo.
 */
describe("vocabulário", () => {
  it("todo tipo tem todos os termos preenchidos", () => {
    for (const tipo of TIPOS) {
      const v = vocabulario(tipo);
      for (const [chave, valor] of Object.entries(v)) {
        if (typeof valor === "string") expect(valor.trim(), `${tipo}.${chave}`).not.toBe("");
      }
      expect(v.niveis.length, tipo).toBeGreaterThan(1);
      expect(PROGRAMA[tipo].trim(), tipo).not.toBe("");
    }
  });

  it("o nível padrão é um dos níveis oferecidos", () => {
    for (const tipo of TIPOS) {
      const v = vocabulario(tipo);
      expect(v.niveis, tipo).toContain(v.nivelPadrao);
    }
  });

  it("a escola de surf não herda o vocabulário da regular", () => {
    const r = vocabulario("regular");
    const s = vocabulario("surf");
    expect(s.responsavel).not.toBe(r.responsavel);
    expect(s.grupo).not.toBe(r.grupo);
    expect(s.organizacao).not.toBe(r.organizacao);
  });

  it("só a escola regular tem rede de ensino", () => {
    expect(vocabulario("regular").temRedeDeEnsino).toBe(true);
    expect(vocabulario("surf").temRedeDeEnsino).toBe(false);
  });

  it("nenhuma faixa da escola de surf fala em série escolar", () => {
    for (const nivel of vocabulario("surf").niveis) {
      expect(nivel).not.toMatch(/Fundamental|Médio|EJA|ano/i);
    }
  });

  it("valor desconhecido devolve o vocabulário da escola regular", () => {
    expect(vocabulario(undefined)).toBe(vocabulario("regular"));
    expect(vocabulario("qualquer")).toBe(vocabulario("regular"));
  });
});

describe("recorte do mapa pela URL", () => {
  it("aceita os dois tipos", () => {
    expect(redeDaUrl("surf")).toBe("surf");
    expect(redeDaUrl("regular")).toBe("regular");
  });

  it("ignora valor desconhecido em vez de filtrar por ele", () => {
    // Link digitado errado mostra o mapa inteiro, não um mapa vazio.
    for (const v of [null, undefined, "", "SURF", "surfe", "todas"]) {
      expect(redeDaUrl(v), String(v)).toBe("");
    }
  });
});

describe("tipo lembrado entre a página dos Guardiões e o cadastro", () => {
  beforeEach(() => window.localStorage.clear());

  it("sem nada guardado, não sugere tipo nenhum", () => {
    expect(tipoLembrado()).toBeNull();
  });

  it("guarda e devolve a escolha", () => {
    lembrarTipo("surf");
    expect(tipoLembrado()).toBe("surf");
  });

  it("esquece depois do cadastro", () => {
    lembrarTipo("surf");
    esquecerTipo();
    expect(tipoLembrado()).toBeNull();
  });

  it("valor adulterado no aparelho não vira tipo", () => {
    window.localStorage.setItem("oceano.cadastro.tipo", "admin");
    expect(tipoLembrado()).toBeNull();
  });
});

describe("etiqueta do pino no mapa", () => {
  it("escola regular fica com as três primeiras palavras", () => {
    expect(rotuloDoPino("E.M. Professora Maria da Silva", "regular")).toBe("E.M. Professora Maria");
  });

  it("escola de surf perde o prefixo que todas têm em comum", () => {
    expect(rotuloDoPino("Escola de Surf Arrebentação", "surf")).toBe("Arrebentação");
    expect(rotuloDoPino("Escolinha de Surfe Maré Alta", "surf")).toBe("Maré Alta");
  });

  it("escola regular chamada «Escola de Surf…» não perde nada", () => {
    // O prefixo só é redundante quando o pino já é o da escola de surf.
    expect(rotuloDoPino("Escola de Surf Municipal", "regular")).toBe("Escola de Surf");
  });

  it("nome que é só o prefixo não vira etiqueta vazia", () => {
    expect(rotuloDoPino("Escola de Surf", "surf")).toBe("Escola de Surf");
    expect(rotuloDoPino("  Escola de Surf  ", "surf")).toBe("Escola de Surf");
  });
});

import { describe, it, expect } from "vitest";
import { composicaoDoGrupo, resumoDoGrupo } from "./pino-agrupado";

/**
 * O anel do pino de grupo mostra de que protocolos ele é feito. Duas
 * coisas podem dar errado sem aparecer: as fatias não somarem o grupo
 * inteiro — e aí o anel mente sobre a proporção — ou a ordem mudar
 * entre renders, o que faria o anel girar sozinho quando o React
 * reaproveita o marcador.
 */
const oco = (nome: string | null, cor: string | null = "#2d7d72") => ({
  protocolo_nome: nome,
  protocolo_cor: cor,
});

describe("composicaoDoGrupo", () => {
  it("as fatias somam o total de ocorrências do grupo", () => {
    const itens = [
      oco("Resíduos"),
      oco("Resíduos"),
      oco("Esgoto", "#8a5a2b"),
      oco("Avifauna", "#2f6f9f"),
      oco("Resíduos"),
    ];
    const fatias = composicaoDoGrupo(itens);
    expect(fatias.reduce((s, f) => s + f.quantidade, 0)).toBe(itens.length);
  });

  it("junta o mesmo protocolo numa fatia só", () => {
    const fatias = composicaoDoGrupo([oco("Resíduos"), oco("Resíduos"), oco("Resíduos")]);
    expect(fatias).toHaveLength(1);
    expect(fatias[0].quantidade).toBe(3);
  });

  it("ordena da maior fatia para a menor", () => {
    const fatias = composicaoDoGrupo([
      oco("Esgoto", "#8a5a2b"),
      oco("Resíduos"),
      oco("Resíduos"),
      oco("Resíduos"),
    ]);
    expect(fatias.map((f) => f.quantidade)).toEqual([3, 1]);
  });

  it("desempata sempre do mesmo jeito, para o anel não girar entre renders", () => {
    const itens = [oco("Zeta", "#111111"), oco("Alfa", "#222222")];
    const uma = composicaoDoGrupo(itens);
    const outra = composicaoDoGrupo([...itens].reverse());
    expect(uma.map((f) => f.nome)).toEqual(outra.map((f) => f.nome));
    expect(uma[0].nome).toBe("Alfa");
  });

  it("protocolo sem cor cai na cor padrão em vez de sumir do anel", () => {
    const fatias = composicaoDoGrupo([oco("Sem cor", null)]);
    expect(fatias).toHaveLength(1);
    expect(fatias[0].cor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("protocolo sem nome não vira fatia anônima", () => {
    const fatias = composicaoDoGrupo([oco(null)]);
    expect(fatias[0].nome.trim()).not.toBe("");
  });
});

describe("resumoDoGrupo", () => {
  it("segue a mesma ordem do anel — é a versão em texto dele", () => {
    const fatias = composicaoDoGrupo([
      oco("Resíduos"),
      oco("Resíduos"),
      oco("Esgoto", "#8a5a2b"),
    ]);
    expect(resumoDoGrupo(fatias)).toBe("Resíduos (2), Esgoto");
  });

  it("omite a contagem quando é uma só, que é como se fala", () => {
    expect(resumoDoGrupo(composicaoDoGrupo([oco("Esgoto")]))).toBe("Esgoto");
  });
});

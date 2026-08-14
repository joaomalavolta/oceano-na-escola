import { describe, it, expect } from "vitest";
import {
  FAMILIAS,
  OFICINA,
  familia,
  todosOsSlugs,
  minutosTotais,
  etapasAntesDoCampo,
} from "./cartografia";
import { temGlifo } from "@/components/mapa/icones";
import { temSimboloSocial } from "@/components/cartografia/simbolos";

describe("as duas famílias de símbolos", () => {
  it("existem as duas, e cada uma diz para que serve", () => {
    expect(FAMILIAS.map((f) => f.id)).toEqual(["protocolo", "social"]);
    for (const f of FAMILIAS) {
      expect(f.titulo.trim(), f.id).not.toBe("");
      expect(f.descricao.trim(), f.id).not.toBe("");
      expect(f.simbolos.length, f.id).toBeGreaterThan(0);
    }
  });

  it("nenhum slug se repete entre as famílias", () => {
    // Slug repetido faria a legenda impressa mostrar dois desenhos
    // diferentes com o mesmo nome, e a turma não saberia qual usar.
    const slugs = todosOsSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  /**
   * O ponto de toda a construção: o símbolo que a turma desenha na
   * cartolina é o mesmo que aparece no mapa público depois. Um slug de
   * protocolo sem glifo correspondente quebra essa correspondência — e
   * a criança deixa de reconhecer o próprio trabalho no mapa da rede.
   */
  it("todo símbolo de protocolo tem desenho no dicionário do mapa", () => {
    for (const s of familia("protocolo").simbolos) {
      expect(temGlifo(s.slug), `${s.slug} não existe em icones.tsx`).toBe(true);
    }
  });

  it("todo símbolo social tem desenho próprio", () => {
    for (const s of familia("social").simbolos) {
      expect(temSimboloSocial(s.slug), `${s.slug} não tem traço`).toBe(true);
    }
  });

  it("os símbolos sociais não invadem o dicionário do mapa", () => {
    // Se um deles virar glifo de protocolo, passa a parecer que o banco
    // guarda memória e afeto — e ele não guarda, de propósito.
    for (const s of familia("social").simbolos) {
      expect(temGlifo(s.slug), `${s.slug} vazou para icones.tsx`).toBe(false);
    }
  });

  it("cada símbolo traz a pergunta que faz a turma lembrar dele", () => {
    // "Lugar de memória" não diz nada a uma criança; "o que já existiu
    // aqui e não existe mais?" faz a sala inteira falar ao mesmo tempo.
    for (const f of FAMILIAS) {
      for (const s of f.simbolos) {
        expect(s.nome.trim(), s.slug).not.toBe("");
        expect(s.pergunta.trim(), s.slug).not.toBe("");
        expect(s.pergunta, s.slug).toContain("?");
      }
    }
  });

  it("família desconhecida falha alto, e não em silêncio", () => {
    // @ts-expect-error — é justamente o caso de quem digitou errado.
    expect(() => familia("inexistente")).toThrow();
  });
});

describe("roteiro da oficina", () => {
  it("os ids não se repetem", () => {
    const ids = OFICINA.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("toda etapa diz quem conduz, quanto dura e o que fica pronto", () => {
    for (const e of OFICINA) {
      expect(["professor", "facilitador", "turma"], e.id).toContain(e.conduz);
      expect(e.minutos, e.id).toBeGreaterThan(0);
      expect(e.objetivo.trim(), e.id).not.toBe("");
      expect(e.produz.trim(), e.id).not.toBe("");
      expect(e.comoFazer.length, e.id).toBeGreaterThan(1);
    }
  });

  /**
   * A ordem é o método. Desenhar de memória tem de vir antes da imagem
   * de satélite: depois da foto na parede ninguém mais se lembra de
   * nada que a foto não mostre, e a oficina vira aula de leitura de
   * imagem — que é outra coisa, e não precisa da turma.
   */
  it("desenhar de memória vem antes de ver o satélite", () => {
    const ids = OFICINA.map((e) => e.id);
    expect(ids.indexOf("memoria")).toBeLessThan(ids.indexOf("confronto"));
  });

  it("escolher onde amostrar vem depois de comparar com o satélite", () => {
    const ids = OFICINA.map((e) => e.id);
    expect(ids.indexOf("confronto")).toBeLessThan(ids.indexOf("hipoteses"));
  });

  it("o fechamento é a última etapa, e é a única depois do campo", () => {
    expect(OFICINA[OFICINA.length - 1].id).toBe("depois");
    expect(etapasAntesDoCampo().map((e) => e.id)).not.toContain("depois");
    expect(etapasAntesDoCampo()).toHaveLength(OFICINA.length - 1);
  });

  it("o que vai antes da saída cabe em duas aulas de 50 minutos", () => {
    // É o que uma escola consegue reservar. Passar disso significa que
    // a oficina não acontece, por mais bem escrita que esteja.
    expect(minutosTotais(etapasAntesDoCampo())).toBeLessThanOrEqual(100);
  });

  it("a equipe Ecosurf conduz pelo menos uma etapa", () => {
    // A oficina é facilitada em conjunto; sem etapa do facilitador ela
    // vira material que o professor recebe e aplica sozinho.
    expect(OFICINA.some((e) => e.conduz === "facilitador")).toBe(true);
  });
});

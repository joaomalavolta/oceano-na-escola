import { describe, it, expect } from "vitest";
import {
  caminhoDaFotoDoCoordenador,
  normalizarCoordenador,
  problemasDoCoordenador,
  type DadosDoCoordenador,
} from "./coordenacao";

const BASE: DadosDoCoordenador = {
  nome: "Pessoa Coordenadora",
  funcao: null,
  email: null,
  telefone: null,
  telefone_whatsapp: false,
  instagram: null,
  autorizado: false,
};

describe("coordenador", () => {
  it("nome é obrigatório", () => {
    expect(problemasDoCoordenador(normalizarCoordenador({ ...BASE, nome: "   " }))).toContain("Falta o nome.");
  });

  it("só o nome já basta", () => {
    expect(problemasDoCoordenador(normalizarCoordenador(BASE))).toEqual([]);
  });

  it("normaliza o que se digita", () => {
    const c = normalizarCoordenador({
      ...BASE,
      email: " Pessoa@Escola.ORG ",
      instagram: "https://instagram.com/pessoa.surf/",
      funcao: "  ",
    });
    expect(c.email).toBe("pessoa@escola.org");
    expect(c.instagram).toBe("pessoa.surf");
    expect(c.funcao).toBeNull();
  });

  it("WhatsApp sem telefone não fica marcado", () => {
    expect(normalizarCoordenador({ ...BASE, telefone_whatsapp: true }).telefone_whatsapp).toBe(false);
  });

  it("aponta contato errado", () => {
    const p = problemasDoCoordenador(normalizarCoordenador({ ...BASE, email: "sem-arroba", telefone: "abc" }));
    expect(p).toHaveLength(2);
  });

  it("a foto mora na pasta da escola, que é o que o banco e o Storage conferem", () => {
    expect(caminhoDaFotoDoCoordenador(5, 12, 1786000000000)).toBe("escola-5/coordenacao/12-1786000000000.jpg");
  });
});

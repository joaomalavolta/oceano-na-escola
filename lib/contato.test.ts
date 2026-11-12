import { describe, it, expect } from "vitest";
import {
  CONTATO_VAZIO,
  normalizarInstagram,
  normalizarUrl,
  normalizarContato,
  problemasDoContato,
  linkDoWhatsapp,
  urlValida,
} from "./contato";

describe("instagram", () => {
  it("aceita o nome de usuário escrito de qualquer jeito", () => {
    for (const v of ["escola.surf", "@escola.surf", "instagram.com/escola.surf", "https://www.instagram.com/escola.surf/", "https://instagram.com/escola.surf?hl=pt"]) {
      expect(normalizarInstagram(v), v).toBe("escola.surf");
    }
  });

  it("vazio é nulo", () => {
    expect(normalizarInstagram("  ")).toBeNull();
    expect(normalizarInstagram("@")).toBeNull();
  });
});

describe("endereços", () => {
  it("sem esquema ganha https", () => {
    expect(normalizarUrl("ecosurf.org.br")).toBe("https://ecosurf.org.br");
  });

  it("javascript: não vira https://javascript: — fica e é recusado", () => {
    // O valor vira `href` na página pública. Prefixar com https esconderia
    // a tentativa em vez de recusá-la.
    const v = normalizarUrl("javascript:alert(1)");
    expect(v).toBe("javascript:alert(1)");
    expect(urlValida(v)).toBe(false);
  });

  it("http e https passam", () => {
    expect(urlValida("https://exemplo.org/a?b=1")).toBe(true);
    expect(urlValida("http://exemplo.org")).toBe(true);
  });

  it("aspas e sinais de tag não passam", () => {
    expect(urlValida('https://x.org/"onmouseover=')).toBe(false);
    expect(urlValida("https://x.org/<script>")).toBe(false);
  });
});

describe("whatsapp", () => {
  it("número brasileiro com DDD ganha o 55", () => {
    expect(linkDoWhatsapp("(13) 99999-0000")).toBe("https://wa.me/5513999990000");
    expect(linkDoWhatsapp("13 3333-0000")).toBe("https://wa.me/551333330000");
  });

  it("com código do país, fica como está", () => {
    expect(linkDoWhatsapp("+55 13 99999-0000")).toBe("https://wa.me/5513999990000");
  });

  it("número curto demais não vira link", () => {
    expect(linkDoWhatsapp("9999-0000")).toBeNull();
    expect(linkDoWhatsapp(null)).toBeNull();
  });
});

describe("normalizarContato e problemasDoContato", () => {
  it("campos em branco viram nulos, e nulo não é problema", () => {
    const c = normalizarContato({ ...CONTATO_VAZIO, responsavel_nome: "  ", contato_email: "" });
    expect(c.responsavel_nome).toBeNull();
    expect(c.contato_email).toBeNull();
    expect(problemasDoContato(c)).toEqual({});
  });

  it("marca de WhatsApp sem telefone é desligada", () => {
    expect(normalizarContato({ ...CONTATO_VAZIO, contato_telefone_whatsapp: true }).contato_telefone_whatsapp).toBe(false);
  });

  it("aponta cada campo errado", () => {
    const p = problemasDoContato(
      normalizarContato({
        ...CONTATO_VAZIO,
        contato_email: "sem-arroba",
        contato_telefone: "abc",
        contato_site: "javascript:alert(1)",
        participantes_atendidos: -3,
      })
    );
    expect(Object.keys(p).sort()).toEqual(
      ["contato_email", "contato_site", "contato_telefone", "participantes_atendidos"].sort()
    );
  });

  it("um contato completo e correto passa", () => {
    const c = normalizarContato({
      responsavel_nome: "Coordenação pedagógica",
      responsavel_funcao: "Coordenador",
      contato_email: "Contato@Escola.org",
      contato_telefone: "(13) 99999-0000",
      contato_telefone_whatsapp: true,
      contato_site: "escola.org",
      contato_instagram: "@escola",
      contato_facebook: "facebook.com/escola",
      contato_youtube: "https://youtube.com/@escola",
      participantes_atendidos: 45,
    });
    expect(problemasDoContato(c)).toEqual({});
    expect(c.contato_email).toBe("contato@escola.org");
    expect(c.contato_site).toBe("https://escola.org");
    expect(c.contato_instagram).toBe("escola");
  });
});

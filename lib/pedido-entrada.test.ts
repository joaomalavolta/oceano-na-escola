import { describe, it, expect } from "vitest";
import {
  PEDIDO_VAZIO,
  PAPEIS_NO_PEDIDO,
  avisoDoPedido,
  normalizarPedido,
  problemasDoPedido,
  tipoParaOBanco,
  type DadosDoPedido,
} from "./pedido-entrada";

const BOM: DadosDoPedido = {
  ...PEDIDO_VAZIO,
  nome: "Pessoa Interessada",
  email: " Pessoa@Escola.ORG ",
  tipo: "surf",
  organizacao: "Escola de Surf Fictícia",
  consentimento: true,
};

describe("pedido de entrada", () => {
  it("um pedido completo passa", () => {
    expect(problemasDoPedido(BOM)).toEqual({});
  });

  it("e-mail é normalizado: é por ele que o convite chega", () => {
    expect(normalizarPedido(BOM).email).toBe("pessoa@escola.org");
  });

  it("sem autorização de uso dos dados, não envia", () => {
    expect(problemasDoPedido({ ...BOM, consentimento: false }).consentimento).toBeTruthy();
  });

  it("aponta nome, e-mail e organização em branco", () => {
    const p = problemasDoPedido({ ...PEDIDO_VAZIO, consentimento: true });
    expect(Object.keys(p).sort()).toEqual(["email", "nome", "organizacao"]);
  });

  it("administração não se pede", () => {
    expect(PAPEIS_NO_PEDIDO.map((x) => x.id)).not.toContain("admin_ecosurf");
    const forjado = { ...BOM, papel: "admin_ecosurf" } as unknown as DadosDoPedido;
    expect(problemasDoPedido(forjado).papel).toBeTruthy();
  });

  it("'outra organização' vai ao banco como tipo nulo", () => {
    expect(tipoParaOBanco("outra")).toBeNull();
    expect(tipoParaOBanco("surf")).toBe("surf");
  });

  it("mensagem longa demais não passa", () => {
    expect(problemasDoPedido({ ...BOM, mensagem: "x".repeat(1501) }).mensagem).toBeTruthy();
  });
});

describe("aviso ao Ecosurf", () => {
  it("o que veio do formulário entra no HTML só como texto", () => {
    const { html } = avisoDoPedido(
      { ...BOM, nome: '<script>alert("x")</script>', mensagem: "<img src=x onerror=y>" },
      "https://exemplo.invalid/admin"
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("traz o link da Administração e os dados principais", () => {
    const { texto, assunto } = avisoDoPedido(BOM, "https://exemplo.invalid/admin");
    expect(assunto).toContain("Escola de Surf Fictícia");
    expect(texto).toContain("pessoa@escola.org");
    expect(texto).toContain("Escola de surf");
    expect(texto).toContain("https://exemplo.invalid/admin");
  });
});

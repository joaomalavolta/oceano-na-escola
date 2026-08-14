import { describe, it, expect } from "vitest";
import {
  assuntoDoConvite,
  htmlDoConvite,
  textoDoConvite,
  escaparHtml,
  type DadosDoConvite,
} from "./email-convite";

function dados(p: Partial<DadosDoConvite> = {}): DadosDoConvite {
  return {
    para: "professora@escola.sp.gov.br",
    papel: "professor",
    escolaNome: null,
    mensagem: null,
    link: "https://oceanonaescola.org/convite/abc123",
    expiraEm: "2026-08-28T12:00:00Z",
    convidadoPor: "Instituto Ecosurf",
    ...p,
  };
}

/**
 * Quem recebe este e-mail não pediu nada.
 *
 * Chega um link de remetente desconhecido pedindo para criar uma senha,
 * que é a forma exata de um golpe. O que separa um do outro é o texto
 * dizer quem manda, para quê, para qual endereço vale e até quando — e
 * não pedir nada além de abrir o link. Estas asserções existem para que
 * alguém que reescreva o e-mail não apague sem querer o que o torna
 * confiável.
 */
describe("o e-mail do convite se apresenta", () => {
  it("diz quem está convidando, nas duas versões", () => {
    const d = dados();
    expect(textoDoConvite(d)).toContain("Instituto Ecosurf");
    expect(htmlDoConvite(d)).toContain("Instituto Ecosurf");
  });

  it("mostra o endereço para o qual o convite vale", () => {
    const d = dados();
    expect(textoDoConvite(d)).toContain("professora@escola.sp.gov.br");
    expect(htmlDoConvite(d)).toContain("professora@escola.sp.gov.br");
  });

  it("avisa que nunca pedimos senha por e-mail", () => {
    expect(textoDoConvite(dados()).toLowerCase()).toContain("nunca pedimos senha");
    expect(htmlDoConvite(dados()).toLowerCase()).toContain("nunca pede senha");
  });

  it("diz que dá para ignorar sem consequência", () => {
    // Sem distinguir maiúscula: no texto a frase vem no meio de outra
    // ("você pode ignorar") e no HTML ela começa o parágrafo. O que
    // precisa existir é a promessa, não a caixa da primeira letra.
    expect(textoDoConvite(dados()).toLowerCase()).toContain("pode ignorar este e-mail");
    expect(htmlDoConvite(dados()).toLowerCase()).toContain("pode ignorar este e-mail");
  });

  it("leva o link inteiro, e não só o botão", () => {
    // Cliente de e-mail corporativo desarma botão com frequência, e aí
    // o endereço em texto é o único caminho que sobra.
    const html = htmlDoConvite(dados());
    expect(html).toContain('href="https://oceanonaescola.org/convite/abc123"');
    expect(html.split("https://oceanonaescola.org/convite/abc123").length - 1).toBeGreaterThan(1);
  });

  it("traz a data de validade por extenso, e não o ISO cru", () => {
    const texto = textoDoConvite(dados());
    expect(texto).toContain("agosto");
    expect(texto).not.toContain("2026-08-28T12:00:00Z");
  });
});

describe("o que o convite promete muda com o papel e a escola", () => {
  it("com escola, diz por qual a pessoa responde", () => {
    const d = dados({ escolaNome: "E.M. Duna Alta" });
    expect(textoDoConvite(d)).toContain("E.M. Duna Alta");
    expect(assuntoDoConvite("E.M. Duna Alta")).toContain("E.M. Duna Alta");
  });

  it("sem escola, o assunto não fica com sobra pendurada", () => {
    expect(assuntoDoConvite(null)).toBe("Convite para o Oceano na Escola");
  });

  /**
   * O que precisa nunca vazar é a forma crua do enum, reconhecível pelo
   * sublinhado — "coordenacao_escolar" na cara de quem foi convidado.
   *
   * Não dá para exigir que o rótulo não contenha o nome do enum:
   * "pesquisador" está dentro de "pesquisador(a)", e a asserção
   * ingênua reprova o texto certo. O sublinhado é o sinal honesto.
   */
  it("o papel aparece por extenso, e nunca na forma crua do enum", () => {
    const papeis = [
      "professor",
      "coordenacao_escolar",
      "coordenacao_municipal",
      "pesquisador",
      "admin_ecosurf",
    ] as const;

    for (const papel of papeis) {
      const texto = textoDoConvite(dados({ papel }));
      const html = htmlDoConvite(dados({ papel }));
      expect(texto, papel).not.toMatch(/[a-z]+_[a-z]+/);
      expect(html, papel).not.toMatch(/>\s*[a-z]+_[a-z]+\s*</);
    }

    expect(textoDoConvite(dados({ papel: "pesquisador" }))).toContain("consulta e exportação");
    expect(textoDoConvite(dados({ papel: "coordenacao_municipal" }))).toContain(
      "coordenação municipal"
    );
  });

  it("o recado do Ecosurf entra quando existe, e não deixa aspas vazias quando não", () => {
    expect(textoDoConvite(dados({ mensagem: "Vamos começar em março." }))).toContain(
      "Vamos começar em março."
    );
    expect(textoDoConvite(dados({ mensagem: null }))).not.toContain('""');
  });
});

/**
 * O recado é texto que uma pessoa digita num formulário e que vai parar
 * dentro de HTML. Sem escapar, um apóstrofo já basta para quebrar o
 * e-mail, e uma tag fechada na hora certa faria coisa pior.
 */
describe("o recado não escapa para dentro do HTML", () => {
  it("escapa os cinco sinais que importam", () => {
    expect(escaparHtml(`<b>&"'`)).toBe("&lt;b&gt;&amp;&quot;&#39;");
  });

  it("recado com marcação chega como texto, não como marcação", () => {
    const html = htmlDoConvite(dados({ mensagem: '</blockquote><script>alert(1)</script>' }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("nome de escola com & não quebra o HTML", () => {
    const html = htmlDoConvite(dados({ escolaNome: "E.M. Céu & Mar" }));
    expect(html).toContain("E.M. Céu &amp; Mar");
  });

  it("o link também é escapado", () => {
    const html = htmlDoConvite(dados({ link: 'https://x.org/convite/a"onmouseover="1' }));
    expect(html).not.toContain('"onmouseover="');
  });
});

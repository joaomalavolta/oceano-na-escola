import { describe, it, expect, beforeEach } from "vitest";
import {
  situacaoDoConvite,
  falhaDefinitiva,
  guardarConvite,
  conviteGuardado,
  esquecerConvite,
  CHAVE_CONVITE,
  type Convite,
} from "./convites";

const AGORA = new Date("2026-08-14T12:00:00Z").getTime();
const dias = (n: number) => new Date(AGORA + n * 86_400_000).toISOString();

function convite(p: Partial<Convite> = {}): Convite {
  return {
    id: 1,
    email: "professora@escola.sp.gov.br",
    papel: "professor",
    escola_id: null,
    escola_nome: null,
    token: "abc",
    mensagem: null,
    criado_em: dias(-1),
    expira_em: dias(13),
    resgatado_em: null,
    revogado_em: null,
    ...p,
  };
}

describe("situacaoDoConvite", () => {
  it("está aberto enquanto não venceu", () => {
    expect(situacaoDoConvite(convite(), AGORA)).toBe("aberto");
  });

  it("vence sozinho, sem ninguém mexer na linha", () => {
    expect(situacaoDoConvite(convite({ expira_em: dias(-1) }), AGORA)).toBe("expirado");
  });

  /**
   * A ordem das três checagens é uma decisão, não acidente. Um convite
   * aceito e depois vencido continua aceito: a data de validade não
   * desfaz o que já aconteceu, e mostrá-lo como "expirado" faria o
   * Ecosurf procurar uma pessoa que já está dentro.
   */
  it("aceito e depois vencido continua aceito", () => {
    const c = convite({ resgatado_em: dias(-2), expira_em: dias(-1) });
    expect(situacaoDoConvite(c, AGORA)).toBe("resgatado");
  });

  it("cancelado vence tudo", () => {
    const c = convite({ revogado_em: dias(-1), resgatado_em: dias(-2), expira_em: dias(-3) });
    expect(situacaoDoConvite(c, AGORA)).toBe("revogado");
  });

  it("o vencimento é no instante, e não no dia", () => {
    const umMinutoAtras = new Date(AGORA - 60_000).toISOString();
    const daquiUmMinuto = new Date(AGORA + 60_000).toISOString();
    expect(situacaoDoConvite(convite({ expira_em: umMinutoAtras }), AGORA)).toBe("expirado");
    expect(situacaoDoConvite(convite({ expira_em: daquiUmMinuto }), AGORA)).toBe("aberto");
  });
});

/**
 * O que decide se o token continua guardado esperando outra sessão.
 *
 * Errar para o lado de apagar deixaria alguém convidado sem papel e sem
 * explicação; errar para o lado de manter faria o mesmo erro se repetir
 * a cada carregamento de página. Por isso a lista é fechada: só o que é
 * mesmo irreversível apaga o token.
 */
describe("falhaDefinitiva", () => {
  it("apaga o token quando não há mais o que resgatar", () => {
    for (const msg of [
      "Este convite foi cancelado pelo Instituto Ecosurf.",
      "Este convite expirou. Peça um novo ao Instituto Ecosurf.",
      "Este convite já foi usado.",
      "Convite não encontrado. Confira o link.",
    ]) {
      expect(falhaDefinitiva(msg), msg).toBe(true);
    }
  });

  it("mantém o token quando basta entrar com o e-mail certo", () => {
    const msg =
      "Este convite foi feito para outro e-mail. Entre com o endereço que recebeu o convite.";
    expect(falhaDefinitiva(msg)).toBe(false);
  });

  it("mantém o token diante de falha de rede, que não diz nada sobre o convite", () => {
    expect(falhaDefinitiva("TypeError: Failed to fetch")).toBe(false);
    expect(falhaDefinitiva("")).toBe(false);
  });
});

describe("o token entre uma tela e outra", () => {
  beforeEach(() => localStorage.clear());

  it("guarda, lê e esquece", () => {
    expect(conviteGuardado()).toBeNull();
    guardarConvite("t0ken");
    expect(conviteGuardado()).toBe("t0ken");
    expect(localStorage.getItem(CHAVE_CONVITE)).toBe("t0ken");
    esquecerConvite();
    expect(conviteGuardado()).toBeNull();
  });

  it("o convite mais recente substitui o anterior", () => {
    // Duas pessoas na mesma máquina, ou um convite novo depois de o
    // primeiro vencer: vale o link que acabou de ser aberto.
    guardarConvite("primeiro");
    guardarConvite("segundo");
    expect(conviteGuardado()).toBe("segundo");
  });
});

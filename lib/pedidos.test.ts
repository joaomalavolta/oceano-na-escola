import { describe, it, expect } from "vitest";
import { ordenarPedidos, type PedidoDeEntrada } from "./pedidos";
import { cadastroNaoConcluido } from "./administracao";

const base: PedidoDeEntrada = {
  id: 1,
  nome: "Pessoa",
  email: "pessoa@exemplo.invalid",
  tipo: "regular",
  papel_pretendido: "professor",
  organizacao: "Escola Fictícia",
  municipio: null,
  funcao: null,
  mensagem: null,
  situacao: "pendente",
  criado_em: "2026-11-01T10:00:00Z",
  analisado_em: null,
  motivo_recusa: null,
};

describe("ordem dos pedidos na Administração", () => {
  it("pendentes primeiro, mesmo que mais antigos", () => {
    const lista = ordenarPedidos([
      { ...base, id: 1, situacao: "convidado", criado_em: "2026-11-10T00:00:00Z" },
      { ...base, id: 2, situacao: "pendente", criado_em: "2026-10-01T00:00:00Z" },
      { ...base, id: 3, situacao: "pendente", criado_em: "2026-11-05T00:00:00Z" },
      { ...base, id: 4, situacao: "recusado", criado_em: "2026-11-11T00:00:00Z" },
    ]);
    expect(lista.map((p) => p.id)).toEqual([3, 2, 4, 1]);
  });
});

describe("cadastro não concluído", () => {
  it("professor ou coordenação escolar sem escola", () => {
    expect(cadastroNaoConcluido({ papel: "professor", escolas: [] })).toBe(true);
    expect(cadastroNaoConcluido({ papel: "coordenacao_escolar", escolas: [] })).toBe(true);
    expect(cadastroNaoConcluido({ papel: "professor", escolas: [{ id: 1, nome: "E" }] })).toBe(false);
  });

  it("quem trabalha sem escola não é marcado", () => {
    for (const papel of ["coordenacao_municipal", "pesquisador", "admin_ecosurf"] as const) {
      expect(cadastroNaoConcluido({ papel, escolas: [] })).toBe(false);
    }
  });
});

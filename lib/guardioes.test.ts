import { describe, it, expect } from "vitest";
import { FRENTES, PASSOS, ROTULO_DA_SITUACAO } from "./guardioes";
import { PROTOCOLOS_INICIAIS } from "./dados-publicos";
import { temGlifo } from "@/components/mapa/icones";

/**
 * A página dos Guardiões diz a uma escola de surf o que ela vai poder
 * registrar. Estes testes existem para que ela não diga mais do que a
 * plataforma faz.
 */
describe("frentes de observação dos Guardiões", () => {
  const codigos = new Set(PROTOCOLOS_INICIAIS.map((p) => p.codigo));

  it("frente anunciada como disponível aponta protocolo que existe", () => {
    for (const f of FRENTES.filter((f) => f.situacao === "disponivel")) {
      expect(f.protocolos.length, f.id).toBeGreaterThan(0);
      for (const c of f.protocolos) {
        expect(codigos.has(c), `${f.id} → ${c}`).toBe(true);
      }
    }
  });

  it("frente em definição não aponta protocolo nenhum", () => {
    // Apontar um protocolo ali seria dizer, pelo selo ao lado, que dá
    // para registrar hoje o que ainda não tem método.
    for (const f of FRENTES.filter((f) => f.situacao === "em_definicao")) {
      expect(f.protocolos, f.id).toEqual([]);
    }
  });

  it("as duas frentes sem método definido continuam marcadas assim", () => {
    // Jundu preservado e rios dependem de decisão do Ecosurf. Se um dia
    // virarem "disponível", este teste falha de propósito: é o lembrete
    // de que antes precisa existir o item de protocolo no banco.
    const pendentes = FRENTES.filter((f) => f.situacao === "em_definicao").map((f) => f.id);
    expect(pendentes.sort()).toEqual(["jundu-preservado", "rios"]);
  });

  it("toda frente tem título, texto e um glifo que existe", () => {
    for (const f of FRENTES) {
      expect(f.titulo.trim(), f.id).not.toBe("");
      expect(f.texto.trim().length, f.id).toBeGreaterThan(40);
      expect(temGlifo(f.icone), `${f.id} → ${f.icone}`).toBe(true);
      expect(ROTULO_DA_SITUACAO[f.situacao], f.id).toBeTruthy();
    }
  });

  it("não há duas frentes com o mesmo id", () => {
    const ids = FRENTES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("passos do Guardião", () => {
  it("vêm numerados em sequência", () => {
    expect(PASSOS.map((p) => p.n)).toEqual(PASSOS.map((_, i) => String(i + 1)));
  });

  it("não prometem o registro de sessão, que ainda não existe na tela", () => {
    // A função `publicar_sessao` existe no banco, mas não há tela que a
    // chame. Enquanto for assim, os passos descrevem só o que funciona.
    for (const p of PASSOS) {
      expect(`${p.titulo} ${p.texto}`, p.n).not.toMatch(/sess[ãa]o/i);
    }
  });
});

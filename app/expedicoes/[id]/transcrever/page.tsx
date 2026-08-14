"use client";

import React, { useState, useEffect, useRef, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileEdit, Save, Send, AlertTriangle, Info, Users } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import { listarProtocolos, type ProtocoloDisponivel } from "@/lib/cadastro-expedicao";
import {
  carregarExpedicaoFicha,
  carregarDefinicaoProtocolo,
  carregarUnidadesExistentes,
  calcularArea,
  salvarFicha,
  enviarParaRevisao,
  type ExpedicaoFicha,
  type DefinicaoProtocolo,
  type UnidadeFicha,
} from "@/lib/transcricao";
import { reabrirParaCorrecao, custoDaCorrecao } from "@/lib/revisao";
import { Voltar } from "@/components/navegacao/voltar";

/** Seções que a grade de contagem consome; as demais viram formulário. */
const SECOES_DE_CONTAGEM = ["quadrat", "contagem"];

function TranscreverConteudo({ id }: { id: number }) {
  const router = useRouter();

  const [expedicao, setExpedicao] = useState<ExpedicaoFicha | null>(null);
  const [protocolos, setProtocolos] = useState<ProtocoloDisponivel[]>([]);
  const [versaoId, setVersaoId] = useState<number | null>(null);
  const [definicao, setDefinicao] = useState<DefinicaoProtocolo | null>(null);
  const [unidades, setUnidades] = useState<UnidadeFicha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);
  const [confirmandoCorrecao, setConfirmandoCorrecao] = useState(false);

  const inputsRef = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    let ativo = true;
    Promise.all([carregarExpedicaoFicha(id), listarProtocolos()]).then(([exp, protos]) => {
      if (!ativo) return;
      setExpedicao(exp);
      setProtocolos(protos);
      if (protos.length > 0) setVersaoId(protos[0].versao_id);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  // Ao trocar de protocolo, a ficha muda inteira: definição nova e as
  // unidades já gravadas para aquele protocolo, se houver.
  useEffect(() => {
    if (!versaoId || !expedicao) return;
    let ativo = true;
    Promise.all([
      carregarDefinicaoProtocolo(versaoId),
      carregarUnidadesExistentes(expedicao.id, versaoId),
    ]).then(([def, existentes]) => {
      if (!ativo) return;
      setDefinicao(def);
      setUnidades(
        expedicao.equipes.map((eq) => {
          const gravada = existentes.find((u) => u.equipe_id === eq.id);
          return (
            gravada ?? { id: null, equipe_id: eq.id, esforco: {}, porItem: {}, porCampo: {} }
          );
        })
      );
    });
    return () => {
      ativo = false;
    };
  }, [versaoId, expedicao]);

  const secaoEsforco = definicao?.secoes.find((s) => s.codigo === "esforco") ?? null;
  const secoesOutras =
    definicao?.secoes.filter(
      (s) => s.codigo !== "esforco" && !SECOES_DE_CONTAGEM.includes(s.codigo)
    ) ?? [];

  // As linhas da grade: itens de lista, ou campos de contagem quando o
  // protocolo conta por campo de ficha, como o de microplásticos.
  const linhas = useMemo(() => {
    if (!definicao) return [] as { chave: string; id: number; rotulo: string; grupo: string; porCampo: boolean }[];
    if (definicao.itens.length > 0) {
      return definicao.itens.map((i) => ({
        chave: `item-${i.id}`,
        id: i.id,
        rotulo: `${i.codigo} · ${i.nome}`,
        grupo: i.grupo,
        porCampo: false,
      }));
    }
    // Protocolo sem lista de itens conta por campo de ficha, como o de
    // microplasticos. O filtro fica aqui dentro: fora, seria um array
    // novo a cada render e o useMemo nao memorizaria nada.
    return definicao.secoes
      .filter((s) => SECOES_DE_CONTAGEM.includes(s.codigo))
      .flatMap((s) =>
        s.campos.map((c) => ({
          chave: `campo-${c.id}`,
          id: c.id,
          rotulo: c.rotulo,
          grupo: s.nome,
          porCampo: true,
        }))
      );
  }, [definicao]);

  const somenteLeitura = expedicao !== null && expedicao.status !== "rascunho";

  /* Destrava a ficha sem sair da página: a expedição volta a rascunho e
     esta mesma tela deixa de ser leitura. Recarregar o cabeçalho basta —
     as contagens já estão carregadas e não mudaram. */
  const corrigir = async () => {
    setSalvando(true);
    setMensagem(null);
    const { erro } = await reabrirParaCorrecao(id);
    if (erro) {
      setSalvando(false);
      setConfirmandoCorrecao(false);
      setMensagem({ tipo: "erro", texto: erro });
      return;
    }
    setExpedicao(await carregarExpedicaoFicha(id));
    setSalvando(false);
    setConfirmandoCorrecao(false);
    setMensagem({ tipo: "ok", texto: "Ficha aberta para correção." });
  };

  const alterarEsforco = (equipeId: number, codigo: string, valor: string) =>
    setUnidades((prev) =>
      prev.map((u) =>
        u.equipe_id === equipeId ? { ...u, esforco: { ...u.esforco, [codigo]: valor } } : u
      )
    );

  const alterarContagem = (equipeId: number, linhaId: number, porCampo: boolean, bruto: string) => {
    // Só dígitos, sem teto: a contagem de uma praia suja passa de mil
    // com facilidade, e o limite do banco é 2.147.483.647.
    const limpo = bruto.replace(/\D/g, "");
    const valor = limpo === "" ? 0 : parseInt(limpo, 10);
    setUnidades((prev) =>
      prev.map((u) => {
        if (u.equipe_id !== equipeId) return u;
        const alvo = porCampo ? "porCampo" : "porItem";
        return { ...u, [alvo]: { ...u[alvo], [linhaId]: valor } };
      })
    );
  };

  const navegar = (
    e: React.KeyboardEvent<HTMLInputElement>,
    equipeIdx: number,
    linhaIdx: number
  ) => {
    if (!expedicao) return;
    const nEquipes = expedicao.equipes.length;
    let eq = equipeIdx;
    let li = linhaIdx;

    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      li = (linhaIdx + 1) % linhas.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      li = (linhaIdx - 1 + linhas.length) % linhas.length;
    } else if (e.key === "ArrowRight" && equipeIdx + 1 < nEquipes) {
      e.preventDefault();
      eq = equipeIdx + 1;
    } else if (e.key === "ArrowLeft" && equipeIdx - 1 >= 0) {
      e.preventDefault();
      eq = equipeIdx - 1;
    } else return;

    const alvo = inputsRef.current.get(`eq${eq}_li${li}`);
    alvo?.focus();
    alvo?.select();
  };

  const handleSalvar = async (enviar: boolean) => {
    if (!expedicao || !definicao) return;
    setSalvando(true);
    setMensagem(null);

    const tipo = definicao.itens.length > 0 ? "trecho" : "quadrat";
    const { erro } = await salvarFicha(expedicao.id, definicao.versao_id, tipo, unidades);

    if (erro) {
      setSalvando(false);
      setMensagem({ tipo: "erro", texto: erro });
      return;
    }

    if (enviar) {
      const { erro: erroEnvio } = await enviarParaRevisao(expedicao.id);
      setSalvando(false);
      if (erroEnvio) return setMensagem({ tipo: "erro", texto: erroEnvio });
      router.push(`/expedicoes/${expedicao.id}/revisar`);
      return;
    }

    setSalvando(false);
    setMensagem({ tipo: "ok", texto: "Ficha salva." });
  };

  if (carregando) {
    return (
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  if (!expedicao) {
    return (
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer
          estado="erro"
          mensagemErro="Expedição não encontrada, ou fora do alcance da sua escola."
        />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-5">
      <Voltar para="expedicoes" />
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-primary" />
            Transcrever ficha
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-mono">#{expedicao.numero}</span>{" "}
            {expedicao.titulo ?? "Sem título"} · {expedicao.escola_nome} ·{" "}
            {new Date(expedicao.data_campo + "T00:00:00").toLocaleDateString("pt-BR")}
          </p>
          {expedicao.turmas.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Users className="w-3 h-3" /> {expedicao.turmas.join(" · ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={versaoId ?? ""}
            onChange={(e) => setVersaoId(Number(e.target.value))}
            className="px-3 py-2 text-xs bg-background border border-input rounded-sm"
          >
            {protocolos.map((p) => (
              <option key={p.versao_id} value={p.versao_id}>
                {p.codigo} — {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Antes esta caixa era um beco: dizia que a ficha está em leitura
          e não dizia como sair disso. Quem chegava aqui para corrigir um
          número tinha de descobrir sozinho que o caminho era voltar
          etapa por etapa, do outro lado, na tela de revisão. */}
      {somenteLeitura && (
        <div className="p-3 rounded-sm text-xs bg-secondary border border-border space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
            <span>
              Esta expedição já saiu do rascunho e está em{" "}
              <strong>{expedicao.status}</strong>. A ficha fica em leitura até voltar ao
              rascunho.
            </span>
          </div>

          {confirmandoCorrecao ? (
            <div className="space-y-2 md:pl-6">
              <p className="leading-relaxed">{custoDaCorrecao(expedicao.status)}</p>
              <div className="flex flex-col md:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmandoCorrecao(false)}
                  disabled={salvando}
                  className="flex-1 py-2 text-xs font-semibold border border-border bg-background rounded-sm hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  Agora não
                </button>
                <button
                  type="button"
                  onClick={corrigir}
                  disabled={salvando}
                  className="flex-1 py-2 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileEdit className="w-4 h-4" />
                  {salvando ? "Abrindo…" : "Abrir para corrigir"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoCorrecao(true)}
              disabled={salvando}
              className="md:ml-6 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border bg-background rounded-sm hover:bg-background/70 transition-colors disabled:opacity-50"
            >
              <FileEdit className="w-3.5 h-3.5" />
              Corrigir a ficha
            </button>
          )}
        </div>
      )}

      {!definicao ? (
        <EstadoContainer estado="carregando" />
      ) : (
        <>
          {/* Esforço amostral, por equipe */}
          {secaoEsforco && (
            <section className="bg-card border border-border rounded-md p-4 space-y-3 shadow-2xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
                {secaoEsforco.nome}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Sem o esforço amostral, a contagem não vira densidade e o dado não compara
                praia nem ano.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 font-semibold">Campo</th>
                      {expedicao.equipes.map((eq) => (
                        <th key={eq.id} className="py-2 px-2 font-semibold min-w-[110px]">
                          {eq.identificacao}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {secaoEsforco.campos
                      .filter((c) => c.codigo !== "equipe")
                      .map((campo) => (
                        <tr key={campo.id} className="border-b border-border/50">
                          <td className="py-1.5 pr-3 text-muted-foreground">
                            {campo.rotulo}
                            {campo.unidade && (
                              <span className="ml-1 text-[10px]">({campo.unidade})</span>
                            )}
                          </td>
                          {expedicao.equipes.map((eq) => {
                            const u = unidades.find((x) => x.equipe_id === eq.id);
                            return (
                              <td key={eq.id} className="py-1 px-1">
                                <input
                                  type="text"
                                  inputMode={
                                    campo.tipo === "inteiro" || campo.tipo === "decimal"
                                      ? "decimal"
                                      : "text"
                                  }
                                  disabled={somenteLeitura}
                                  value={u?.esforco[campo.codigo] ?? ""}
                                  onChange={(e) =>
                                    alterarEsforco(eq.id, campo.codigo, e.target.value)
                                  }
                                  className="w-full text-center py-1 px-1 text-xs tabular-nums bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-75"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                    <tr className="border-t border-border font-semibold">
                      <td className="py-2 pr-3">Área amostrada (m²)</td>
                      {expedicao.equipes.map((eq) => {
                        const u = unidades.find((x) => x.equipe_id === eq.id);
                        const area = u ? calcularArea(u.esforco) : null;
                        return (
                          <td
                            key={eq.id}
                            className={`py-2 px-2 text-center tabular-nums ${
                              area === null ? "text-muted-foreground" : "text-acento-texto"
                            }`}
                          >
                            {area === null ? "—" : area.toLocaleString("pt-BR")}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Grade de contagem */}
          <section className="bg-card border border-border rounded-md shadow-2xs overflow-hidden">
            <div className="p-3 bg-muted/60 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contagem · {definicao.codigo} {definicao.nome}
              </span>
              <span className="text-[11px] text-muted-foreground hidden md:inline">
                Setas e Enter navegam entre as células
              </span>
            </div>

            {linhas.length === 0 ? (
              <p className="p-6 text-xs text-muted-foreground">
                Este protocolo não tem lista de contagem. O registro se faz por ocorrência,
                no mapa.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-secondary/40">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold w-[45%]">Item</th>
                      {expedicao.equipes.map((eq) => (
                        <th
                          key={eq.id}
                          className="py-2 px-1 text-xs font-semibold border-l border-border min-w-[80px]"
                        >
                          {eq.identificacao}
                        </th>
                      ))}
                      <th className="py-2 px-3 text-xs font-semibold border-l border-border min-w-[80px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((linha, linhaIdx) => {
                      const soma = expedicao.equipes.reduce((s, eq) => {
                        const u = unidades.find((x) => x.equipe_id === eq.id);
                        const mapa = linha.porCampo ? u?.porCampo : u?.porItem;
                        return s + (mapa?.[linha.id] ?? 0);
                      }, 0);

                      return (
                        <tr key={linha.chave} className="border-b border-border/50">
                          <td className="py-1.5 px-3">
                            <span className="text-xs">{linha.rotulo}</span>
                            <span className="block text-[10px] text-muted-foreground">
                              {linha.grupo}
                            </span>
                          </td>
                          {expedicao.equipes.map((eq, eqIdx) => {
                            const u = unidades.find((x) => x.equipe_id === eq.id);
                            const mapa = linha.porCampo ? u?.porCampo : u?.porItem;
                            const valor = mapa?.[linha.id] ?? 0;
                            return (
                              <td key={eq.id} className="py-1 px-1 border-l border-border">
                                <input
                                  ref={(el) => {
                                    const k = `eq${eqIdx}_li${linhaIdx}`;
                                    if (el) inputsRef.current.set(k, el);
                                    else inputsRef.current.delete(k);
                                  }}
                                  type="text"
                                  inputMode="numeric"
                                  disabled={somenteLeitura}
                                  value={valor === 0 ? "" : valor}
                                  placeholder="0"
                                  onChange={(e) =>
                                    alterarContagem(eq.id, linha.id, linha.porCampo, e.target.value)
                                  }
                                  onKeyDown={(e) => navegar(e, eqIdx, linhaIdx)}
                                  className="w-full text-center py-1 px-1 text-sm font-semibold tabular-nums bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring focus:bg-accent/20 disabled:opacity-75"
                                />
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-3 text-center border-l border-border font-bold tabular-nums bg-secondary/20">
                            {soma.toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Demais seções da ficha */}
          {secoesOutras.map((secao) => (
            <section
              key={secao.id}
              className="bg-card border border-border rounded-md p-4 space-y-3 shadow-2xs"
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
                {secao.nome}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {secao.campos.map((campo) => (
                  <div key={campo.id}>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      {campo.rotulo}
                      {campo.unidade && <span className="ml-1">({campo.unidade})</span>}
                    </label>
                    <input
                      type="text"
                      disabled={somenteLeitura}
                      value={unidades[0]?.esforco[campo.codigo] ?? ""}
                      onChange={(e) =>
                        expedicao.equipes.forEach((eq) =>
                          alterarEsforco(eq.id, campo.codigo, e.target.value)
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-75"
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          {mensagem && (
            <div
              className={`p-3 rounded-sm text-xs flex items-start gap-2 border ${
                mensagem.tipo === "erro"
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{mensagem.texto}</span>
            </div>
          )}

          {!somenteLeitura && (
            <div className="flex flex-col md:flex-row gap-2">
              <button
                onClick={() => handleSalvar(false)}
                disabled={salvando}
                className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {salvando ? "Salvando…" : "Salvar rascunho"}
              </button>
              <button
                onClick={() => handleSalvar(true)}
                disabled={salvando}
                className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Salvar e enviar para revisão
              </button>
            </div>
          )}

          <Link
            href="/expedicoes"
            className="block text-center text-xs text-primary hover:underline"
          >
            Voltar para as expedições
          </Link>
        </>
      )}
    </main>
  );
}

export default function TranscreverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <TranscreverConteudo id={Number(id)} />
      </RotaProtegida>
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileEdit,
  Globe,
  Grid3x3,
  Info,
  MapPin,
  Printer,
  RotateCcw,
  Ruler,
  Users,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import {
  carregarRevisao,
  moverStatus,
  publicarEscola,
  proximaEtapa,
  indiceDaEtapa,
  ETAPAS,
  type Revisao,
  type Etapa,
} from "@/lib/revisao";

/** Como cada etapa se chama na tela, e o verbo que leva até ela. */
const ETAPA_ROTULO: Record<Etapa, { nome: string; verbo: string; Icone: typeof Eye }> = {
  rascunho: { nome: "Rascunho", verbo: "Voltar para rascunho", Icone: FileEdit },
  enviado: { nome: "Enviada", verbo: "Enviar para revisão", Icone: ArrowRight },
  revisado: { nome: "Revisada", verbo: "Marcar como revisada", Icone: Eye },
  validado: { nome: "Validada", verbo: "Validar", Icone: CheckCircle2 },
  publicado: { nome: "Publicada", verbo: "Publicar no mapa", Icone: Globe },
};

function formatarData(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatarMes(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function numero(v: number, casas = 0): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** A régua das cinco etapas, com a atual em destaque. */
function Regua({ status }: { status: string }) {
  const atual = indiceDaEtapa(status);
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1">
      {ETAPAS.map((etapa, i) => {
        const passou = i <= atual;
        return (
          <li key={etapa} className="flex items-center gap-1 shrink-0">
            <span
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-sm border ${
                i === atual
                  ? "bg-primary text-primary-foreground border-primary"
                  : passou
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {ETAPA_ROTULO[etapa].nome}
            </span>
            {i < ETAPAS.length - 1 && (
              <span className={`w-4 h-px ${passou ? "bg-primary/40" : "bg-border"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function RevisarConteudo({ id }: { id: number }) {
  const [revisao, setRevisao] = useState<Revisao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [confirmandoPublicacao, setConfirmandoPublicacao] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarRevisao(id).then(({ revisao: r, erro: e }) => {
      if (!ativo) return;
      setRevisao(r);
      setErro(e);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  // Depois de mover o status, a tela relê tudo: os alertas e a prévia da
  // grade mudam com a etapa, e recalcular no cliente seria adivinhar.
  const recarregar = useCallback(async () => {
    const { revisao: r, erro: e } = await carregarRevisao(id);
    setRevisao(r);
    setErro(e);
  }, [id]);

  const mover = async (destino: string) => {
    setProcessando(true);
    setAviso(null);
    const { erro: falha } = await moverStatus(id, destino);
    if (falha) {
      setProcessando(false);
      setConfirmandoPublicacao(false);
      setAviso({ tipo: "erro", texto: falha });
      return;
    }
    await recarregar();
    setProcessando(false);
    setConfirmandoPublicacao(false);
    setAviso({
      tipo: "ok",
      texto:
        destino === "publicado"
          ? "Expedição publicada. O que passou do piso de três unidades já está no mapa."
          : `Expedição agora está em ${ETAPA_ROTULO[destino as Etapa]?.nome ?? destino}.`,
    });
  };

  const publicarAEscola = async () => {
    if (!revisao) return;
    setProcessando(true);
    setAviso(null);
    const { erro: falha } = await publicarEscola(revisao.cabecalho.escola.id);
    if (falha) {
      setProcessando(false);
      setAviso({ tipo: "erro", texto: falha });
      return;
    }
    await recarregar();
    setProcessando(false);
    setAviso({ tipo: "ok", texto: "Escola publicada." });
  };

  if (carregando) {
    return (
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  if (erro || !revisao) {
    return (
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer
          estado="erro"
          mensagemErro={erro ?? "Expedição não encontrada, ou fora do alcance da sua escola."}
          onTentarNovamente={() => window.location.reload()}
        />
      </main>
    );
  }

  const { cabecalho, blocos, ocorrencias, celulas, alertas, totalItens } = revisao;
  const proxima = proximaEtapa(cabecalho.status);
  const anterior =
    indiceDaEtapa(cabecalho.status) > 0 ? ETAPAS[indiceDaEtapa(cabecalho.status) - 1] : null;
  const impedimentos = alertas.filter((a) => a.nivel === "impede");

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-5">
      {/* Cabeçalho */}
      <div className="border-b border-border pb-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Revisar expedição
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-mono">#{cabecalho.numero}</span>{" "}
              {cabecalho.titulo ?? "Sem título"} · {cabecalho.escola.nome} ·{" "}
              {formatarData(cabecalho.data_campo)}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
              {cabecalho.territorio && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {cabecalho.territorio}
                </span>
              )}
              {cabecalho.turmas.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {cabecalho.turmas.join(" · ")}
                  {cabecalho.n_mapeadores !== null && ` (${cabecalho.n_mapeadores} mapeadores)`}
                </span>
              )}
              {cabecalho.extensao_m !== null && (
                <span className="flex items-center gap-1">
                  <Ruler className="w-3 h-3" /> {numero(cabecalho.extensao_m)} m percorridos
                </span>
              )}
              <span className="tabular-nums">{numero(totalItens)} itens contados</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <Link
              href={`/expedicoes/${cabecalho.id}/relatorio`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Relatório
            </Link>
            {cabecalho.status === "publicado" && cabecalho.escola.publicada && (
              <Link
                href={`/escola/${cabecalho.escola.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver na página pública
              </Link>
            )}
          </div>
        </div>

        <Regua status={cabecalho.status} />
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <section className="space-y-2">
          {alertas.map((a, i) => (
            <div
              key={i}
              className={`p-3 rounded-sm text-xs flex items-start gap-2 border ${
                a.nivel === "impede"
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
              }`}
            >
              {a.nivel === "impede" ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{a.texto}</span>
            </div>
          ))}

          {!cabecalho.escola.publicada && (
            <button
              onClick={publicarAEscola}
              disabled={processando}
              className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
            >
              Publicar a escola agora
            </button>
          )}
        </section>
      )}

      {/* Um bloco por protocolo aplicado */}
      {blocos.map((bloco) => (
        <section
          key={bloco.codigo}
          className="bg-card border border-border rounded-md shadow-2xs overflow-hidden"
        >
          <div className="p-3 bg-muted/60 border-b border-border flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: bloco.cor ?? "var(--color-primary)" }}
              />
              {bloco.codigo} · {bloco.nome}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {numero(bloco.totalItens)} itens em {numero(bloco.areaM2, 2)} m² ·{" "}
              {bloco.densidade === null ? (
                <em className="not-italic text-destructive">sem densidade</em>
              ) : (
                <strong className="text-foreground">{numero(bloco.densidade, 3)} itens/m²</strong>
              )}
            </span>
          </div>

          <div className="overflow-x-auto border-b border-border">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-secondary/40">
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold">Unidade</th>
                  <th className="text-left py-2 px-3 font-semibold">Equipe</th>
                  <th className="text-left py-2 px-3 font-semibold">Tipo</th>
                  <th className="text-right py-2 px-3 font-semibold">Área (m²)</th>
                  <th className="text-right py-2 px-3 font-semibold">Itens</th>
                  <th className="text-left py-2 px-3 font-semibold">Coordenada</th>
                </tr>
              </thead>
              <tbody>
                {bloco.unidades.map((u) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-1.5 px-3 font-mono text-muted-foreground">#{u.id}</td>
                    <td className="py-1.5 px-3">{u.equipe}</td>
                    <td className="py-1.5 px-3 text-muted-foreground">{u.tipo}</td>
                    <td
                      className={`py-1.5 px-3 text-right tabular-nums ${
                        u.areaM2 === null || u.areaM2 <= 0 ? "text-destructive" : ""
                      }`}
                    >
                      {u.areaM2 === null || u.areaM2 <= 0 ? "—" : numero(u.areaM2, 2)}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums font-semibold">
                      {numero(u.itens)}
                    </td>
                    <td className="py-1.5 px-3">
                      {u.temGeometria ? (
                        <span className="text-muted-foreground">registrada</span>
                      ) : (
                        <span className="text-destructive font-semibold">ausente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bloco.linhas.length > 0 && (
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-secondary/40 sticky top-0">
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-semibold">Item contado</th>
                    <th className="text-left py-2 px-3 font-semibold">Grupo</th>
                    <th className="text-right py-2 px-3 font-semibold">Total</th>
                    <th className="text-right py-2 px-3 font-semibold w-20">%</th>
                  </tr>
                </thead>
                <tbody>
                  {bloco.linhas.map((l) => (
                    <tr key={l.rotulo} className="border-b border-border/50">
                      <td className="py-1.5 px-3">{l.rotulo}</td>
                      <td className="py-1.5 px-3 text-muted-foreground">{l.grupo}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums font-semibold">
                        {numero(l.quantidade)}
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-muted-foreground">
                        {bloco.totalItens > 0
                          ? `${((l.quantidade / bloco.totalItens) * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      {/* Ocorrências pontuais */}
      {ocorrencias.length > 0 && (
        <section className="bg-card border border-border rounded-md shadow-2xs overflow-hidden">
          <div className="p-3 bg-muted/60 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Ocorrências georreferenciadas · {ocorrencias.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-secondary/40">
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold">Protocolo</th>
                  <th className="text-left py-2 px-3 font-semibold">Ocorrência</th>
                  <th className="text-right py-2 px-3 font-semibold">Magnitude</th>
                  <th className="text-left py-2 px-3 font-semibold">Origem provável</th>
                  <th className="text-right py-2 px-3 font-semibold">Fotos</th>
                </tr>
              </thead>
              <tbody>
                {ocorrencias.map((o) => (
                  <tr key={o.id} className="border-b border-border/50">
                    <td className="py-1.5 px-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: o.cor ?? "var(--color-primary)" }}
                        />
                        <span className="font-mono">{o.protocolo}</span>
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      {o.item ?? o.descricao}
                      {o.item && (
                        <span className="block text-[10px] text-muted-foreground">
                          {o.descricao}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {o.valor === null ? "—" : `${numero(o.valor)} ${o.unidade ?? ""}`.trim()}
                    </td>
                    <td className="py-1.5 px-3 text-muted-foreground">{o.origem ?? "—"}</td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {o.fotos === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={
                            o.fotosPublicadas === 0 ? "text-amber-600 dark:text-amber-400" : ""
                          }
                        >
                          {o.fotosPublicadas}/{o.fotos}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* O que vai aparecer no mapa */}
      {celulas.length > 0 && (
        <section className="bg-card border border-border rounded-md shadow-2xs overflow-hidden">
          <div className="p-3 bg-muted/60 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Grid3x3 className="w-3.5 h-3.5 text-primary" />
              Células da grade
            </span>
          </div>
          <p className="px-3 pt-3 text-[11px] text-muted-foreground">
            O mapa público não mostra o trecho exato onde a turma andou: mostra células de 100 m
            com o dado somado, e só a partir de três unidades amostrais. É o que protege a
            identificação de quem foi a campo.
          </p>
          <div className="overflow-x-auto p-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-semibold">Protocolo</th>
                  <th className="text-left py-2 px-2 font-semibold">Mês</th>
                  <th className="text-right py-2 px-2 font-semibold">Desta expedição</th>
                  <th className="text-right py-2 px-2 font-semibold">Na célula</th>
                  <th className="text-left py-2 px-2 font-semibold">No mapa</th>
                </tr>
              </thead>
              <tbody>
                {celulas.map((c, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-mono">{c.protocolo}</td>
                    <td className="py-1.5 px-2 text-muted-foreground">{formatarMes(c.mes)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{c.unidadesDesta}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{c.unidadesNaCelula}</td>
                    <td className="py-1.5 px-2">
                      {c.entraNoMapa ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          aparece
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400">
                          faltam {3 - c.unidadesNaCelula}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {cabecalho.observacoes && (
        <section className="bg-card border border-border rounded-md p-4 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Observações de campo
          </h2>
          <p className="text-xs whitespace-pre-wrap">{cabecalho.observacoes}</p>
        </section>
      )}

      {aviso && (
        <div
          className={`p-3 rounded-sm text-xs flex items-start gap-2 border ${
            aviso.tipo === "erro"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {aviso.tipo === "erro" ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{aviso.texto}</span>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-col md:flex-row gap-2">
        {cabecalho.status === "rascunho" ? (
          <Link
            href={`/expedicoes/${cabecalho.id}/transcrever`}
            className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            <FileEdit className="w-4 h-4" />
            Voltar para a transcrição
          </Link>
        ) : (
          anterior && (
            <button
              onClick={() => mover(anterior)}
              disabled={processando}
              className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {ETAPA_ROTULO[anterior].verbo}
            </button>
          )
        )}

        {proxima &&
          (proxima !== "publicado" ? (
            <button
              onClick={() => mover(proxima)}
              disabled={processando}
              className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {React.createElement(ETAPA_ROTULO[proxima].Icone, { className: "w-4 h-4" })}
              {processando ? "Salvando…" : ETAPA_ROTULO[proxima].verbo}
            </button>
          ) : !confirmandoPublicacao ? (
            <button
              onClick={() => setConfirmandoPublicacao(true)}
              disabled={processando || impedimentos.length > 0}
              title={
                impedimentos.length > 0
                  ? "Resolva os impedimentos acima antes de publicar."
                  : undefined
              }
              className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Publicar no mapa
            </button>
          ) : (
            <div className="flex-1 flex flex-col gap-2 p-3 border border-primary/40 bg-primary/5 rounded-sm">
              <p className="text-xs">
                Publicar torna este dado visível para qualquer visitante do mapa, sem login.
                Confere?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmandoPublicacao(false)}
                  disabled={processando}
                  className="flex-1 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  Agora não
                </button>
                <button
                  onClick={() => mover("publicado")}
                  disabled={processando}
                  className="flex-1 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  {processando ? "Publicando…" : "Confirmar publicação"}
                </button>
              </div>
            </div>
          ))}
      </div>

      <Link href="/expedicoes" className="block text-center text-xs text-primary hover:underline">
        Voltar para as expedições
      </Link>
    </main>
  );
}

export default function RevisarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <RevisarConteudo id={Number(id)} />
      </RotaProtegida>
    </div>
  );
}

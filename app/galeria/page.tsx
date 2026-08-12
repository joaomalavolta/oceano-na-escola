"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  EyeOff,
  Globe,
  ImageIcon,
  Loader2,
  Lock,
  Save,
  Trash2,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import {
  listarEvidencias,
  listarPedidosRemocao,
  curarEvidencia,
  salvarLegenda,
  removerEvidencia,
  registrarTermos,
  marcarAtendido,
  type EvidenciaCurada,
  type PedidoRemocao,
} from "@/lib/galeria";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

/** Horas que faltam para o prazo de 72 horas do termo de parceria. */
function horasRestantes(prazo: string): number {
  return Math.round((new Date(prazo).getTime() - Date.now()) / 3_600_000);
}

function GaleriaConteudo() {
  const [evidencias, setEvidencias] = useState<EvidenciaCurada[] | null>(null);
  const [pedidos, setPedidos] = useState<PedidoRemocao[]>([]);
  const [legendas, setLegendas] = useState<Record<number, string>>({});
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const recarregar = async () => {
    const [evs, peds] = await Promise.all([listarEvidencias(), listarPedidosRemocao()]);
    setEvidencias(evs);
    setPedidos(peds);
  };

  useEffect(() => {
    let ativo = true;
    Promise.all([listarEvidencias(), listarPedidosRemocao()]).then(([evs, peds]) => {
      if (!ativo) return;
      setEvidencias(evs);
      setPedidos(peds);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const agir = async (id: number, acao: () => Promise<{ erro: string | null }>, sucesso: string) => {
    setOcupado(id);
    setAviso(null);
    const { erro } = await acao();
    if (erro) {
      setOcupado(null);
      setAviso({ tipo: "erro", texto: erro });
      return;
    }
    await recarregar();
    setOcupado(null);
    setAviso({ tipo: "ok", texto: sucesso });
  };

  const pedidosAbertos = pedidos.filter((p) => p.atendida_em === null);

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 space-y-5">
      <header className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Curadoria da galeria
        </h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
          Foto de campo entra sempre despublicada. Ela só vai para a página pública com a sua
          curadoria e com o termo de uso de imagem registrado pela escola — as duas coisas, e
          nunca com rosto identificável de estudante.
        </p>
      </header>

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

      {/* Pedidos de remoção — sempre no topo, com o relógio correndo */}
      {pedidosAbertos.length > 0 && (
        <section className="border border-destructive/40 bg-destructive/5 rounded-md p-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {pedidosAbertos.length} pedido(s) de remoção em aberto
          </h2>
          <p className="text-[11px] text-muted-foreground">
            A imagem já saiu do ar no momento do pedido. O prazo de 72 horas do termo de parceria
            é para a exclusão definitiva do arquivo.
          </p>

          {pedidosAbertos.map((p) => {
            const horas = horasRestantes(p.prazo_em);
            return (
              <div
                key={p.id}
                className="bg-card border border-border rounded-sm p-3 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">
                    {p.solicitante_nome}{" "}
                    <span className="font-normal text-muted-foreground">· {p.escola_nome}</span>
                  </span>
                  <span
                    className={`tabular-nums font-semibold ${
                      horas < 0
                        ? "text-destructive"
                        : horas < 24
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {horas < 0 ? `prazo vencido há ${-horas} h` : `${horas} h restantes`}
                  </span>
                </div>
                <p className="text-muted-foreground">Contato: {p.solicitante_contato}</p>
                {p.motivo && <p className="whitespace-pre-wrap">{p.motivo}</p>}

                <div className="flex flex-col md:flex-row gap-2 pt-1">
                  {p.storage_path && (
                    <button
                      onClick={() =>
                        agir(
                          -p.id,
                          async () => {
                            const r = await removerEvidencia(p.evidencia_id, p.storage_path!);
                            if (r.erro) return r;
                            return marcarAtendido(p.id);
                          },
                          "Imagem apagada e pedido atendido."
                        )
                      }
                      disabled={ocupado !== null}
                      className="flex-1 py-2 text-xs font-semibold uppercase tracking-wider bg-destructive text-white rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {ocupado === -p.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Apagar a imagem em definitivo
                    </button>
                  )}
                  <button
                    onClick={() =>
                      agir(-p.id, () => marcarAtendido(p.id), "Pedido marcado como atendido.")
                    }
                    disabled={ocupado !== null}
                    className="flex-1 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary disabled:opacity-50"
                  >
                    Marcar atendido sem apagar
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Grade de evidências */}
      {evidencias === null ? (
        <EstadoContainer estado="carregando" />
      ) : evidencias.length === 0 ? (
        <EstadoContainer
          estado="vazio"
          mensagemVazia="Nenhuma foto ainda. Elas chegam pelo registro em campo."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evidencias.map((e) => {
            const publicada = e.status === "publicada";
            const travada = !e.escola_termos_ok;
            return (
              <figure
                key={e.id}
                className="bg-card border border-border rounded-md overflow-hidden shadow-2xs flex flex-col"
              >
                <FotoEvidencia
                  storagePath={e.storage_path}
                  alt={e.legenda ?? e.ocorrencia ?? "Foto de campo"}
                  className="w-full h-44 object-cover"
                />

                <figcaption className="p-3 space-y-2 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                        publicada
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {publicada ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {publicada ? "Na galeria pública" : "Fora do ar"}
                    </span>
                    {e.remocoesAbertas > 0 && (
                      <span className="text-[10px] font-semibold text-destructive">
                        pedido de remoção
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {e.escola_nome}
                    {e.expedicao_numero !== null && ` · Expedição #${e.expedicao_numero}`} ·{" "}
                    {formatarData(e.criado_em)}
                  </p>
                  {e.ocorrencia && <p className="text-xs">{e.ocorrencia}</p>}

                  <input
                    type="text"
                    value={legendas[e.id] ?? e.legenda ?? ""}
                    onChange={(ev) =>
                      setLegendas((prev) => ({ ...prev, [e.id]: ev.target.value }))
                    }
                    placeholder="Legenda pública da foto"
                    className="w-full px-2 py-1.5 text-xs bg-background border border-input rounded-sm"
                  />

                  {travada && (
                    <p className="text-[11px] flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                      <Lock className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>
                        {e.escola_nome} ainda não registrou o termo de uso de imagem.{" "}
                        <button
                          onClick={() =>
                            agir(
                              e.id,
                              () => registrarTermos(e.escola_id),
                              "Termo de uso de imagem registrado."
                            )
                          }
                          className="underline font-semibold"
                        >
                          Registrar agora
                        </button>
                      </span>
                    </p>
                  )}

                  <div className="flex gap-2 mt-auto pt-1">
                    <button
                      onClick={() =>
                        agir(
                          e.id,
                          () => salvarLegenda(e.id, legendas[e.id] ?? e.legenda ?? ""),
                          "Legenda guardada."
                        )
                      }
                      disabled={ocupado !== null}
                      className="px-2.5 py-1.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Legenda
                    </button>
                    <button
                      onClick={() =>
                        agir(
                          e.id,
                          () => curarEvidencia(e.id, !publicada),
                          publicada ? "Foto retirada da galeria." : "Foto publicada na galeria."
                        )
                      }
                      disabled={ocupado !== null || (travada && !publicada)}
                      title={
                        travada && !publicada
                          ? "Registre o termo de uso de imagem antes de publicar."
                          : undefined
                      }
                      className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                        publicada
                          ? "border border-border hover:bg-secondary"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {ocupado === e.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : publicada ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Globe className="w-3.5 h-3.5" />
                      )}
                      {publicada ? "Retirar" : "Publicar"}
                    </button>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}

      <Link href="/painel" className="block text-center text-xs text-primary hover:underline">
        Voltar ao painel
      </Link>
    </main>
  );
}

export default function GaleriaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <GaleriaConteudo />
      </RotaProtegida>
    </div>
  );
}

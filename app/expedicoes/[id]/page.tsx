"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Compass,
  Eye,
  FileEdit,
  MapPin,
  RotateCcw,
  Send,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import { Voltar, VoltarRodape } from "@/components/navegacao/voltar";
import { ReguaDeEtapas, NOME_DA_ETAPA } from "@/components/expedicoes/regua-de-etapas";
import { carregarRevisao, custoDaCorrecao, reabrirParaCorrecao, type Etapa, type Revisao } from "@/lib/revisao";
import { enviarParaRevisao } from "@/lib/transcricao";
import { saidaTemDado } from "@/lib/saida-de-campo";

function formatarData(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

/**
 * A saída de campo.
 *
 * É para onde se vai depois de abrir a saída. Antes, abrir levava direto
 * à ficha de papel — que se preenche depois do campo — e o botão em
 * destaque ali era "Salvar e enviar para revisão". Quem ia sair a campo
 * clicava achando que guardava a saída, e com isso a encerrava: o
 * registro em campo só aceita saída em rascunho.
 *
 * Aqui a ordem é a da vida real: registrar em campo durante, transcrever
 * a ficha depois, e só então dizer "terminei".
 */
function SaidaConteudo({ id }: { id: number }) {
  const router = useRouter();
  const [revisao, setRevisao] = useState<Revisao | null>(null);
  const [temDado, setTemDado] = useState<boolean | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<"encerrar" | "reabrir" | null>(null);
  const [processando, setProcessando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const [{ revisao: r, erro: e }, dado] = await Promise.all([carregarRevisao(id), saidaTemDado(id)]);
    return { r, e, dado };
  }, [id]);

  useEffect(() => {
    let ativo = true;
    carregar().then(({ r, e, dado }) => {
      if (!ativo) return;
      setRevisao(r);
      setErro(e);
      setTemDado(dado);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [carregar]);

  const encerrar = async () => {
    setProcessando(true);
    setAviso(null);
    const { erro: falha } = await enviarParaRevisao(id);
    if (falha) {
      setProcessando(false);
      setConfirmando(null);
      setAviso(falha);
      return;
    }
    router.push(`/expedicoes/${id}/revisar`);
  };

  const reabrir = async () => {
    setProcessando(true);
    setAviso(null);
    const { erro: falha } = await reabrirParaCorrecao(id);
    const { r, e, dado } = await carregar();
    setRevisao(r);
    setErro(e);
    setTemDado(dado);
    setProcessando(false);
    setConfirmando(null);
    if (falha) setAviso(falha);
  };

  if (carregando) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  if (erro || !revisao) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer
          estado="erro"
          mensagemErro={erro ?? "Saída não encontrada, ou fora do alcance da sua escola."}
          onTentarNovamente={() => window.location.reload()}
        />
      </main>
    );
  }

  const { cabecalho, ocorrencias, totalItens } = revisao;
  const aberta = cabecalho.status === "rascunho";
  const fotos = ocorrencias.reduce((s, o) => s + o.fotos, 0);

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6 space-y-5">
      <Voltar para="expedicoes" />

      <header className="space-y-2 border-b border-border pb-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Saída de campo <span className="font-mono">#{cabecalho.numero}</span> · {cabecalho.escola.nome}
        </p>
        <h1 className="text-xl font-bold tracking-tight">{cabecalho.titulo ?? "Sem título"}</h1>
        <p className="text-xs text-muted-foreground">
          {formatarData(cabecalho.data_campo)}
          {cabecalho.territorio && ` · ${cabecalho.territorio}`}
          {cabecalho.turmas.length > 0 && ` · ${cabecalho.turmas.join(", ")}`}
        </p>
        <ReguaDeEtapas status={cabecalho.status} />
      </header>

      {aviso && (
        <p className="p-3 rounded-sm text-xs flex items-start gap-2 border bg-destructive/10 border-destructive/30 text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {aviso}
        </p>
      )}

      {aberta ? (
        <>
          <p className="text-sm flex items-start gap-2 p-3 rounded-sm border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            A saída está aberta. Registre em campo durante a saída e transcreva a ficha de papel
            depois. Quando terminar tudo, envie para revisão.
          </p>

          <ol className="space-y-3">
            <Passo
              n={1}
              titulo="Registrar em campo"
              texto="No celular, durante a saída: GPS ou ponto no mapa, a ocorrência e a foto."
              contagem={`${ocorrencias.length} ocorrência(s) · ${fotos} foto(s)`}
              href={`/campo?expedicao=${cabecalho.id}`}
              rotulo="Registrar em campo"
              Icone={MapPin}
              destaque
            />
            <Passo
              n={2}
              titulo="Transcrever a ficha de papel"
              texto="Depois da saída: as contagens de cada equipe, por trecho ou quadrado."
              contagem={`${totalItens.toLocaleString("pt-BR")} item(ns) contado(s)`}
              href={`/expedicoes/${cabecalho.id}/transcrever`}
              rotulo="Transcrever a ficha"
              Icone={ClipboardList}
            />
            <Passo
              n={3}
              titulo="Diário e fotos da saída"
              texto="O que a turma viveu, e as fotos da saída que não são de uma ocorrência."
              href={`/expedicoes/${cabecalho.id}/diario`}
              rotulo="Abrir o diário"
              Icone={BookOpen}
            />
          </ol>

          <section className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Terminei a saída
            </h2>
            {temDado === false ? (
              <p className="text-xs text-muted-foreground">
                Esta saída ainda não tem registro nenhum — nem ocorrência, nem contagem, nem trecho
                medido. Registre em campo ou transcreva a ficha primeiro; uma saída vazia não pode
                ser enviada para revisão.
              </p>
            ) : confirmando === "encerrar" ? (
              <div className="space-y-2">
                <p className="text-xs">
                  Enviar para revisão <strong>encerra o registro em campo</strong> desta saída. Se
                  depois faltar algum ponto, dá para reabrir, mas a saída refaz as etapas. Enviar
                  agora?
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setConfirmando(null)}
                    disabled={processando}
                    className="flex-1 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary"
                  >
                    Ainda não
                  </button>
                  <button
                    onClick={encerrar}
                    disabled={processando}
                    className="flex-1 py-2 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {processando ? "Enviando…" : "Enviar para revisão"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Quando os registros de campo e a ficha estiverem completos, envie para revisão. É
                  na revisão que a saída é conferida e publicada no mapa.
                </p>
                <button
                  onClick={() => setConfirmando("encerrar")}
                  className="px-4 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Terminei: enviar para revisão
                </button>
              </>
            )}
          </section>
        </>
      ) : (
        <>
          <p className="text-sm p-3 rounded-sm border border-border bg-muted/40">
            A saída está <strong>{NOME_DA_ETAPA[cabecalho.status as Etapa] ?? cabecalho.status}</strong>.
            O registro em campo e a ficha ficam fechados nesta etapa.
            {temDado === false && " E ela não tem registro nenhum ainda."}
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href={`/expedicoes/${cabecalho.id}/revisar`}
              className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {cabecalho.status === "publicado" ? "Ver a revisão" : "Continuar a revisão"}
            </Link>
            <Link
              href={`/expedicoes/${cabecalho.id}/diario`}
              className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Diário e fotos
            </Link>
          </div>

          <section className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-2">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-primary" />
              Faltou registrar alguma coisa?
            </h2>
            {confirmando === "reabrir" ? (
              <>
                <p className="text-xs leading-relaxed">{custoDaCorrecao(cabecalho.status)}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setConfirmando(null)}
                    disabled={processando}
                    className="flex-1 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary"
                  >
                    Agora não
                  </button>
                  <button
                    onClick={reabrir}
                    disabled={processando}
                    className="flex-1 py-2 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FileEdit className="w-4 h-4" />
                    {processando ? "Reabrindo…" : "Reabrir a saída"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Reabrir devolve a saída a rascunho: o registro em campo e a ficha voltam a aceitar
                  dados, e a saída refaz as etapas da revisão.
                </p>
                <button
                  onClick={() => setConfirmando("reabrir")}
                  className="px-4 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reabrir a saída
                </button>
              </>
            )}
          </section>
        </>
      )}

      <VoltarRodape para="expedicoes" />
    </main>
  );
}

function Passo({
  n,
  titulo,
  texto,
  contagem,
  href,
  rotulo,
  Icone,
  destaque = false,
}: {
  n: number;
  titulo: string;
  texto: string;
  contagem?: string;
  href: string;
  rotulo: string;
  Icone: typeof Compass;
  destaque?: boolean;
}) {
  return (
    <li className={`bg-card border rounded-md p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-3 ${destaque ? "border-primary/50" : "border-border"}`}>
      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${destaque ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
        {n}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{titulo}</p>
        <p className="text-xs text-muted-foreground">{texto}</p>
        {contagem && <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">{contagem}</p>}
      </div>
      <Link
        href={href}
        className={`shrink-0 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm inline-flex items-center justify-center gap-2 ${
          destaque ? "bg-accent text-accent-foreground hover:opacity-90" : "border border-border hover:bg-secondary"
        }`}
      >
        <Icone className="w-4 h-4" />
        {rotulo}
      </Link>
    </li>
  );
}

export default function SaidaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <SaidaConteudo id={Number(id)} />
      </RotaProtegida>
    </div>
  );
}

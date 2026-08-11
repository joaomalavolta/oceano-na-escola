"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import {
  Compass,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Users,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
  FileEdit,
  ChevronRight,
  Eye,
  Globe,
} from "lucide-react";

import { carregarPainel, type PainelEscola, type ExpedicaoResumo } from "@/lib/dados-escola";

/**
 * Estados do dado, conforme o enum status_dado do banco:
 * rascunho → enviado → revisado → validado → publicado.
 *
 * A maquete usava um 'devolvido' que nunca existiu no schema. Um filtro
 * por ele não retornaria nada, para sempre.
 */
const STATUS = [
  { valor: "rascunho", rotulo: "Rascunho", Icone: FileEdit, classe: "bg-secondary text-muted-foreground border-border" },
  { valor: "enviado", rotulo: "Enviada", Icone: Clock, classe: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { valor: "revisado", rotulo: "Revisada", Icone: Eye, classe: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30" },
  { valor: "validado", rotulo: "Validada", Icone: CheckCircle2, classe: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { valor: "publicado", rotulo: "Publicada", Icone: Globe, classe: "bg-primary/10 text-primary border-primary/30" },
] as const;

function Badge({ status }: { status: string }) {
  const def = STATUS.find((s) => s.valor === status);
  if (!def) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-secondary text-muted-foreground border border-border rounded-sm">
        {status}
      </span>
    );
  }
  const { Icone, rotulo, classe } = def;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold border rounded-sm ${classe}`}>
      <Icone className="w-3 h-3" /> {rotulo}
    </span>
  );
}

function formatarData(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

/** Rascunho se transcreve; do enviado em diante, se revisa. */
function emEdicao(exp: ExpedicaoResumo): boolean {
  return exp.status === "rascunho";
}

function ExpedicoesConteudo() {
  const [dados, setDados] = useState<PainelEscola | null>(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    let ativo = true;
    carregarPainel().then((d) => ativo && setDados(d));
    return () => {
      ativo = false;
    };
  }, []);

  const filtradas = useMemo(() => {
    if (!dados) return [];
    const termo = busca.trim().toLowerCase();
    return dados.expedicoes.filter((exp) => {
      if (filtroStatus !== "todos" && exp.status !== filtroStatus) return false;
      if (!termo) return true;
      return [exp.titulo, exp.territorio, exp.escola_nome, exp.turma]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termo));
    });
  }, [dados, filtroStatus, busca]);

  const estado = !dados
    ? "carregando"
    : dados.erro
    ? "erro"
    : filtradas.length === 0
    ? "vazio"
    : "pronto";

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <span>Expedições de Campo</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Transcreva as fichas físicas das saídas de monitoramento costeiro.
          </p>
        </div>

        <Link
          href="/expedicoes/nova"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground hover:opacity-90 rounded-sm transition-opacity self-start md:self-auto shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nova Expedição</span>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-md p-4 mb-6 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por território, título, escola ou turma…"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full md:w-auto px-3 py-1.5 text-xs bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="todos">Todos os status</option>
            {STATUS.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <EstadoContainer
        estado={estado}
        mensagemErro={dados?.erro ?? "Não foi possível carregar as expedições."}
        mensagemVazia={
          dados && dados.expedicoes.length === 0
            ? "Nenhuma expedição registrada ainda. Comece cadastrando uma saída de campo."
            : "Nenhuma expedição encontrada para os filtros selecionados."
        }
        onTentarNovamente={() => window.location.reload()}
      >
        <div className="space-y-3">
          {filtradas.map((exp) => (
            <div
              key={exp.id}
              className="bg-card border border-border rounded-md p-4 hover:border-primary/50 transition-colors shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    #{exp.numero}
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">
                    {exp.titulo ?? "Sem título"}
                  </h2>
                  <Badge status={exp.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Campo em{" "}
                      <strong className="text-foreground">{formatarData(exp.data_campo)}</strong>
                    </span>
                  </div>

                  {exp.territorio && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{exp.territorio}</span>
                    </div>
                  )}

                  {exp.turma && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {exp.turma}
                        {exp.n_mapeadores !== null && ` (${exp.n_mapeadores} mapeadores)`}
                      </span>
                    </div>
                  )}

                  {exp.protocolos.length > 0 && (
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{exp.protocolos.join(" · ")}</span>
                    </div>
                  )}

                  <span className="tabular-nums">
                    {exp.total_itens.toLocaleString("pt-BR")} itens
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-border">
                {emEdicao(exp) ? (
                  <Link
                    href={`/expedicoes/${exp.id}/transcrever`}
                    className="w-full md:w-auto px-3 py-1.5 text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 rounded-sm transition-opacity flex items-center justify-center gap-1"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Transcrever</span>
                  </Link>
                ) : (
                  <Link
                    href={`/expedicoes/${exp.id}/revisar`}
                    className="w-full md:w-auto px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 rounded-sm transition-opacity flex items-center justify-center gap-1"
                  >
                    <span>Ver ficha</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </EstadoContainer>
    </main>
  );
}

export default function ExpedicoesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <ExpedicoesConteudo />
      </RotaProtegida>
    </div>
  );
}

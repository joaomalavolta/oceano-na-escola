"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
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
  AlertCircle,
  FileEdit,
  ChevronRight
} from "lucide-react";
import { 
  getLocalStorageData, 
  MOCK_EXPEDICOES, 
  ExpedicaoDetalhada 
} from "@/lib/dados-mock";

export default function ExpedicoesPage() {
  const [expedicoes, setExpedicoes] = useState<ExpedicaoDetalhada[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    const dados = getLocalStorageData<ExpedicaoDetalhada[]>("expedicoes", MOCK_EXPEDICOES);
    setExpedicoes(dados);
    setCarregando(false);
  }, []);

  const expedicoesFiltradas = expedicoes.filter((exp) => {
    const atendeStatus = filtroStatus === "todos" || exp.status === filtroStatus;
    const termo = busca.toLowerCase();
    const atendeBusca =
      !busca ||
      exp.titulo.toLowerCase().includes(termo) ||
      exp.praia.toLowerCase().includes(termo) ||
      exp.escola_nome.toLowerCase().includes(termo) ||
      exp.turma_nome.toLowerCase().includes(termo);
    return atendeStatus && atendeBusca;
  });

  const getBadgeStatus = (status: ExpedicaoDetalhada["status"]) => {
    switch (status) {
      case "validado":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-sm">
            <CheckCircle2 className="w-3 h-3" /> Validada & Publicada
          </span>
        );
      case "enviado":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-sm">
            <Clock className="w-3 h-3" /> Em Revisão
          </span>
        );
      case "devolvido":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/30 rounded-sm">
            <AlertCircle className="w-3 h-3" /> Devolvida p/ Correção
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-secondary text-muted-foreground border border-border rounded-sm">
            <FileEdit className="w-3 h-3" /> Rascunho
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <span>Expedições de Campo</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Gerencie e transcreva as fichas físicas das saídas de monitoramento costeiro.
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

        {/* Filtros e Busca */}
        <div className="bg-card border border-border rounded-md p-4 mb-6 shadow-2xs flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por praia, título, escola ou turma..."
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
              <option value="todos">Todos os Status</option>
              <option value="rascunho">Rascunho</option>
              <option value="enviado">Em Revisão</option>
              <option value="validado">Validada & Publicada</option>
              <option value="devolvido">Devolvida</option>
            </select>
          </div>
        </div>

        {/* Conteúdo de Lista com Estados */}
        <EstadoContainer
          estado={
            carregando
              ? "carregando"
              : expedicoesFiltradas.length === 0
              ? "vazio"
              : "pronto"
          }
          mensagemVazia="Nenhuma expedição encontrada para os filtros selecionados."
        >
          <div className="space-y-3">
            {expedicoesFiltradas.map((exp) => (
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
                      {exp.titulo}
                    </h2>
                    {getBadgeStatus(exp.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Data de campo: <strong className="text-foreground">{exp.data_campo}</strong></span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{exp.praia}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{exp.turma_nome} ({exp.n_mapeadores} alunos)</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Protocolo: {exp.protocolo_codigo}</span>
                    </div>
                  </div>
                </div>

                {/* Ações por Status */}
                <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-border">
                  {exp.status === "rascunho" || exp.status === "devolvido" ? (
                    <Link
                      href={`/expedicoes/${exp.id}/transcrever`}
                      className="w-full md:w-auto px-3 py-1.5 text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 rounded-sm transition-opacity flex items-center justify-center gap-1"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Transcrever / Editar</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/expedicoes/${exp.id}/revisar`}
                      className="w-full md:w-auto px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 rounded-sm transition-opacity flex items-center justify-center gap-1"
                    >
                      <span>Ver Ficha / Revisar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </EstadoContainer>
      </main>
    </div>
  );
}

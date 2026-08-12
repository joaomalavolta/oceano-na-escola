"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookText, Globe, Loader2, Plus, Trash2 } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import {
  listarHistoriasDaEscola,
  criarHistoria,
  apagarHistoria,
  type Historia,
} from "@/lib/historias";
import { listarEscolasDoProfessor, type EscolaDoProfessor } from "@/lib/cadastro-expedicao";

function HistoriasConteudo() {
  const [historias, setHistorias] = useState<Historia[] | null>(null);
  const [escolas, setEscolas] = useState<EscolaDoProfessor[]>([]);
  const [escolaId, setEscolaId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([listarHistoriasDaEscola(), listarEscolasDoProfessor()]).then(([hs, es]) => {
      if (!ativo) return;
      setHistorias(hs);
      setEscolas(es);
      if (es.length === 1) setEscolaId(es[0].id);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const criar = async () => {
    if (escolaId === null || titulo.trim() === "") return;
    setCriando(true);
    setErro(null);
    const { id, erro: falha } = await criarHistoria(escolaId, titulo);
    setCriando(false);
    if (falha || id === null) {
      setErro(falha ?? "Não foi possível criar a história.");
      return;
    }
    window.location.href = `/historias/${id}`;
  };

  const remover = async (id: number) => {
    const { erro: falha } = await apagarHistoria(id);
    if (falha) {
      setErro(falha);
      return;
    }
    setHistorias(await listarHistoriasDaEscola());
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 space-y-5">
      <header className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <BookText className="w-5 h-5 text-primary" />
          Histórias do Território
        </h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
          O lugar onde a escola diz o que os dados significam. A contagem responde
          &ldquo;quantos resíduos encontramos?&rdquo;; a história responde &ldquo;o que isso diz
          deste território, e de quem é a responsabilidade?&rdquo;. Publicada, ela aparece na
          página pública da escola, com o mapa e os números das expedições que cita.
        </p>
      </header>

      {erro && (
        <div className="p-3 rounded-sm text-xs flex items-start gap-2 border bg-destructive/10 border-destructive/30 text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {/* Começar uma história */}
      <section className="bg-card border border-border rounded-md p-4 space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Nova história</h2>
        {escolas.length > 1 && (
          <select
            value={escolaId ?? ""}
            onChange={(e) => setEscolaId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
          >
            <option value="">Escolha a escola…</option>
            {escolas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        )}
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título — “O rio que passa pela nossa escola”"
            className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-sm"
          />
          <button
            onClick={criar}
            disabled={criando || escolaId === null || titulo.trim() === ""}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {criando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Começar
          </button>
        </div>
        {escolas.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Sua conta ainda não tem vínculo com escola nenhuma.{" "}
            <Link href="/onboarding" className="text-primary hover:underline">
              Cadastre a sua escola
            </Link>
            .
          </p>
        )}
      </section>

      {/* Lista */}
      {historias === null ? (
        <EstadoContainer estado="carregando" />
      ) : historias.length === 0 ? (
        <EstadoContainer
          estado="vazio"
          mensagemVazia="Nenhuma história escrita ainda. A primeira costuma nascer do diário de campo."
        />
      ) : (
        <div className="space-y-2">
          {historias.map((h) => (
            <div
              key={h.id}
              className="bg-card border border-border rounded-md p-4 shadow-2xs flex items-start justify-between gap-3"
            >
              <div className="min-w-0 space-y-1">
                <Link href={`/historias/${h.id}`} className="text-sm font-bold hover:underline">
                  {h.titulo}
                </Link>
                {h.resumo && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{h.resumo}</p>
                )}
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  {h.publicada ? (
                    <>
                      <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">Publicada</span>
                    </>
                  ) : (
                    <span>Rascunho</span>
                  )}
                  {h.expedicoes.length > 0 && (
                    <span>
                      · {h.expedicoes.length} expedição(ões) citada(s)
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => remover(h.id)}
                className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                aria-label="Apagar história"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function HistoriasPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <HistoriasConteudo />
      </RotaProtegida>
    </div>
  );
}

"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, Loader2, Lock, Plus, Trash2 } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import {
  listarEntradas,
  criarEntrada,
  apagarEntrada,
  MOMENTOS,
  type EntradaDiario,
  type Momento,
} from "@/lib/diario";
import { carregarExpedicaoFicha, type ExpedicaoFicha } from "@/lib/transcricao";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function DiarioConteudo({ id }: { id: number }) {
  const [expedicao, setExpedicao] = useState<ExpedicaoFicha | null>(null);
  const [entradas, setEntradas] = useState<EntradaDiario[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [momentoAberto, setMomentoAberto] = useState<Momento | null>(null);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [autoria, setAutoria] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([carregarExpedicaoFicha(id), listarEntradas(id)]).then(([exp, ents]) => {
      if (!ativo) return;
      setExpedicao(exp);
      setEntradas(ents);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  const abrirFormulario = (momento: Momento) => {
    setMomentoAberto(momento);
    setTitulo("");
    setTexto("");
    setAutoria("");
    setErro(null);
  };

  const salvar = async () => {
    if (!momentoAberto || texto.trim() === "") return;
    setSalvando(true);
    setErro(null);
    const { erro: falha } = await criarEntrada({
      expedicaoId: id,
      momento: momentoAberto,
      titulo,
      texto,
      autoria,
      turmaId: null,
    });
    if (falha) {
      setSalvando(false);
      setErro(falha);
      return;
    }
    setEntradas(await listarEntradas(id));
    setSalvando(false);
    setMomentoAberto(null);
  };

  const remover = async (entradaId: number) => {
    const { erro: falha } = await apagarEntrada(entradaId);
    if (falha) {
      setErro(falha);
      return;
    }
    setEntradas(await listarEntradas(id));
  };

  if (carregando) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  if (!expedicao) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer
          estado="erro"
          mensagemErro="Expedição não encontrada, ou fora do alcance da sua escola."
        />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6 space-y-5">
      <header className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Diário de Campo
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="font-mono">#{expedicao.numero}</span>{" "}
          {expedicao.titulo ?? "Sem título"} · {expedicao.escola_nome}
        </p>
        <p className="text-[11px] text-muted-foreground mt-2 flex items-start gap-1.5 max-w-2xl">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            O diário fica dentro da escola. Não vai para o mapa nem para a página pública — o
            que sai é a História do Território, que a turma escreve depois, para ser lida.
          </span>
        </p>
      </header>

      {erro && (
        <div className="p-3 rounded-sm text-xs flex items-start gap-2 border bg-destructive/10 border-destructive/30 text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {MOMENTOS.map((m) => {
        const doMomento = entradas.filter((e) => e.momento === m.id);
        return (
          <section key={m.id} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                {m.nome} do mapeamento
              </h2>
              <button
                onClick={() => abrirFormulario(m.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Escrever
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground italic">{m.convite}</p>

            {doMomento.map((e) => (
              <article
                key={e.id}
                className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {e.titulo && <h3 className="text-sm font-bold">{e.titulo}</h3>}
                    <p className="text-[11px] text-muted-foreground">
                      {e.autoria ?? "Sem assinatura"} · {formatarData(e.criado_em)}
                    </p>
                  </div>
                  <button
                    onClick={() => remover(e.id)}
                    className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    aria-label="Apagar entrada"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs whitespace-pre-wrap leading-relaxed">{e.texto}</p>
              </article>
            ))}

            {momentoAberto === m.id && (
              <div className="bg-card border border-primary/40 rounded-md p-4 space-y-3 shadow-2xs">
                <input
                  type="text"
                  value={titulo}
                  onChange={(ev) => setTitulo(ev.target.value)}
                  placeholder="Título (opcional)"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
                />
                <textarea
                  value={texto}
                  onChange={(ev) => setTexto(ev.target.value)}
                  rows={6}
                  placeholder={m.convite}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm resize-y"
                />
                <input
                  type="text"
                  value={autoria}
                  onChange={(ev) => setAutoria(ev.target.value)}
                  placeholder="Quem escreveu — turma, equipe ou nomes"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setMomentoAberto(null)}
                    disabled={salvando}
                    className="flex-1 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvar}
                    disabled={salvando || texto.trim() === ""}
                    className="flex-1 py-2 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar no diário
                  </button>
                </div>
              </div>
            )}

            {doMomento.length === 0 && momentoAberto !== m.id && (
              <p className="text-xs text-muted-foreground border border-dashed border-border rounded-sm p-3">
                Nada escrito ainda.
              </p>
            )}
          </section>
        );
      })}

      <div className="flex flex-col md:flex-row gap-2 pt-2">
        <Link
          href={`/expedicoes/${id}/revisar`}
          className="flex-1 py-2.5 text-center text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary transition-colors"
        >
          Ir para a revisão
        </Link>
        <Link
          href="/historias"
          className="flex-1 py-2.5 text-center text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
        >
          Escrever a História do Território
        </Link>
      </div>
    </main>
  );
}

export default function DiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <DiarioConteudo id={Number(id)} />
      </RotaProtegida>
    </div>
  );
}

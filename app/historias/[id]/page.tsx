"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Globe, Loader2, Save, BookText } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import {
  carregarHistoria,
  salvarHistoria,
  definirExpedicoes,
  publicarHistoria,
  type Historia,
} from "@/lib/historias";
import { supabase } from "@/lib/supabase";
import { Voltar, VoltarRodape } from "@/components/navegacao/voltar";

interface ExpedicaoCitavel {
  id: number;
  numero: number;
  titulo: string | null;
  data_campo: string;
  status: string;
}

/** Expedições da escola, para a história escolher quais narra. */
async function listarExpedicoesDaEscola(escolaId: number): Promise<ExpedicaoCitavel[]> {
  const { data, error } = await supabase
    .from("expedicao")
    .select("id, numero, titulo, data_campo, status")
    .eq("escola_id", escolaId)
    .order("numero", { ascending: false });
  if (error) return [];
  return (data ?? []).map((x) => ({
    id: Number(x.id),
    numero: Number(x.numero),
    titulo: x.titulo ?? null,
    data_campo: String(x.data_campo),
    status: String(x.status),
  }));
}

function EditorConteudo({ id }: { id: number }) {
  const [historia, setHistoria] = useState<Historia | null>(null);
  const [expedicoes, setExpedicoes] = useState<ExpedicaoCitavel[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [citadas, setCitadas] = useState<number[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarHistoria(id).then(async (h) => {
      if (!ativo) return;
      setHistoria(h);
      if (h) {
        setTitulo(h.titulo);
        setResumo(h.resumo ?? "");
        setCorpo(h.corpo);
        setCitadas(h.expedicoes);
        const exps = await listarExpedicoesDaEscola(h.escola_id);
        if (ativo) setExpedicoes(exps);
      }
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  const salvar = async () => {
    setSalvando(true);
    setAviso(null);
    const { erro } = await salvarHistoria(id, { titulo, resumo, corpo, capa_id: null });
    if (erro) {
      setSalvando(false);
      setAviso({ tipo: "erro", texto: erro });
      return;
    }
    const { erro: erroExps } = await definirExpedicoes(id, citadas);
    setSalvando(false);
    if (erroExps) {
      setAviso({ tipo: "erro", texto: erroExps });
      return;
    }
    setAviso({ tipo: "ok", texto: "História guardada." });
  };

  const alternarPublicacao = async () => {
    if (!historia) return;
    setSalvando(true);
    setAviso(null);
    const { erro } = await publicarHistoria(id, !historia.publicada);
    if (erro) {
      setSalvando(false);
      setAviso({ tipo: "erro", texto: erro });
      return;
    }
    const atualizada = await carregarHistoria(id);
    setHistoria(atualizada);
    setSalvando(false);
    setAviso({
      tipo: "ok",
      texto: atualizada?.publicada
        ? "História publicada na página da escola."
        : "História retirada do ar. Ela continua guardada aqui.",
    });
  };

  if (carregando) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  if (!historia) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6">
        <EstadoContainer
          estado="erro"
          mensagemErro="História não encontrada, ou fora do alcance da sua escola."
        />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6 space-y-5">
      <Voltar para="historias" />
      <header className="border-b border-border pb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BookText className="w-5 h-5 text-primary" />
            História do Território
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {historia.publicada ? "Publicada" : "Rascunho"} · endereço{" "}
            <span className="font-mono">{historia.slug}</span>
          </p>
        </div>
        <Link href="/historias" className="text-xs text-primary hover:underline shrink-0">
          Todas as histórias
        </Link>
      </header>

      <section className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Título
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-3 py-2 text-sm font-semibold bg-background border border-input rounded-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Resumo — uma frase, para a lista
          </label>
          <input
            type="text"
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            placeholder="O que esta história conta, em uma linha."
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            A história
          </label>
          <textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            rows={16}
            placeholder={
              "O que a turma viu, o que os números mostraram, o que isso diz do lugar e o que precisa mudar.\n\nUse uma linha em branco para separar parágrafos."
            }
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm resize-y leading-relaxed"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {corpo.trim() === "" ? 0 : corpo.trim().split(/\s+/).length} palavras
          </p>
        </div>
      </section>

      {/* Expedições citadas */}
      <section className="bg-card border border-border rounded-md p-4 space-y-2 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
          Expedições que a história narra
        </h2>
        <p className="text-[11px] text-muted-foreground">
          A história aponta para o dado em vez de copiá-lo: assim ela não envelhece quando a
          contagem é corrigida. Na página pública, só aparecem as expedições já publicadas.
        </p>

        {expedicoes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma expedição nesta escola ainda.</p>
        ) : (
          <div className="space-y-1">
            {expedicoes.map((x) => {
              const marcada = citadas.includes(x.id);
              return (
                <button
                  key={x.id}
                  onClick={() =>
                    setCitadas((prev) =>
                      prev.includes(x.id) ? prev.filter((i) => i !== x.id) : [...prev, x.id]
                    )
                  }
                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-sm border transition-colors ${
                    marcada ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-sm border shrink-0 flex items-center justify-center ${
                      marcada ? "bg-primary border-primary" : "border-input"
                    }`}
                  >
                    {marcada && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                  </span>
                  <span className="text-xs flex-1">
                    <span className="font-mono text-muted-foreground">#{x.numero}</span>{" "}
                    {x.titulo ?? "Sem título"}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider shrink-0 ${
                      x.status === "publicado"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {x.status}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

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

      <div className="flex flex-col md:flex-row gap-2">
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </button>
        <button
          onClick={alternarPublicacao}
          disabled={salvando || titulo.trim() === ""}
          className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 ${
            historia.publicada
              ? "border border-border hover:bg-secondary"
              : "bg-primary text-primary-foreground"
          }`}
        >
          <Globe className="w-4 h-4" />
          {historia.publicada ? "Retirar do ar" : "Publicar na página da escola"}
        </button>
      </div>
      <VoltarRodape para="historias" />
    </main>
  );
}

export default function EditorHistoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <EditorConteudo id={Number(id)} />
      </RotaProtegida>
    </div>
  );
}

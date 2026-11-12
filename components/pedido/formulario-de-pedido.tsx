"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

import {
  LIMITES_DO_PEDIDO,
  PAPEIS_NO_PEDIDO,
  PEDIDO_VAZIO,
  problemasDoPedido,
  type DadosDoPedido,
  type TipoNoPedido,
} from "@/lib/pedido-entrada";
import { lembrarTipo } from "@/lib/organizacao";

const TIPOS: { id: TipoNoPedido; nome: string; dica: string }[] = [
  { id: "regular", nome: "Escola", dica: "Pública ou particular, de qualquer etapa." },
  { id: "surf", nome: "Escola de surf", dica: "Escola, projeto ou associação de surf." },
  { id: "outra", nome: "Outra organização", dica: "Secretaria, universidade, coletivo, ONG." },
];

const ROTULO_DA_ORGANIZACAO: Record<TipoNoPedido, string> = {
  regular: "Nome da escola",
  surf: "Nome da escola de surf",
  outra: "Organização",
};

const campo =
  "w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring";
const rotulo = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1";

export function FormularioDePedido({ tipoInicial }: { tipoInicial: TipoNoPedido }) {
  const [d, setD] = useState<DadosDoPedido>({ ...PEDIDO_VAZIO, tipo: tipoInicial });
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const problemas = problemasDoPedido(d);
  const mostrar = (k: keyof DadosDoPedido) => (tentou ? problemas[k] : undefined);
  const muda = <K extends keyof DadosDoPedido>(k: K, v: DadosDoPedido[K]) => setD((x) => ({ ...x, [k]: v }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTentou(true);
    setErro(null);
    if (Object.keys(problemas).length > 0) return;
    setEnviando(true);
    try {
      const r = await fetch("/api/pedido-entrada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      if (!r.ok) {
        const corpo = (await r.json().catch(() => null)) as { erro?: string } | null;
        setErro(corpo?.erro ?? "Não foi possível enviar agora. Tente de novo.");
        return;
      }
      // A escolha do tipo fica no aparelho: quando o convite chegar e a
      // conta for criada, o cadastro da escola já abre no tipo certo.
      if (d.tipo !== "outra") lembrarTipo(d.tipo);
      setEnviado(true);
    } catch {
      setErro("Sem conexão. Confira a rede e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="mt-8 p-6 border border-emerald-500/30 bg-emerald-500/10 rounded-md">
        <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          Pedido recebido
        </p>
        <p className="text-sm mt-2 leading-relaxed">
          O Instituto Ecosurf vai ler o seu pedido e responder pelo e-mail{" "}
          <strong>{d.email.trim().toLowerCase()}</strong>. Se a entrada for combinada, chega por
          lá um convite com o link para criar a conta.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Enquanto isso, dá para conhecer a rede no{" "}
          <Link href="/" className="text-primary hover:underline">
            mapa
          </Link>{" "}
          e na página{" "}
          <Link href="/sobre" className="text-primary hover:underline">
            Sobre
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="mt-8 space-y-6">
      <fieldset>
        <legend className={rotulo}>De onde você vem</legend>
        <div className="grid sm:grid-cols-3 gap-2">
          {TIPOS.map((t) => (
            <label
              key={t.id}
              className={`cursor-pointer p-3 border rounded-sm text-sm transition-colors ${
                d.tipo === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={t.id}
                checked={d.tipo === t.id}
                onChange={() => muda("tipo", t.id)}
                className="sr-only"
              />
              <span className="font-semibold block">{t.nome}</span>
              <span className="text-[11px] text-muted-foreground">{t.dica}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <Campo id="nome" titulo="Seu nome" erro={mostrar("nome")}>
          <input id="nome" value={d.nome} maxLength={LIMITES_DO_PEDIDO.nome} autoComplete="name"
            onChange={(e) => muda("nome", e.target.value)} className={campo} />
        </Campo>
        <Campo id="email" titulo="E-mail" erro={mostrar("email")} dica="É por ele que chega a resposta e o convite.">
          <input id="email" type="email" value={d.email} maxLength={LIMITES_DO_PEDIDO.email} autoComplete="email"
            onChange={(e) => muda("email", e.target.value)} className={campo} />
        </Campo>
        <Campo id="organizacao" titulo={ROTULO_DA_ORGANIZACAO[d.tipo]} erro={mostrar("organizacao")}>
          <input id="organizacao" value={d.organizacao} maxLength={LIMITES_DO_PEDIDO.organizacao} autoComplete="organization"
            onChange={(e) => muda("organizacao", e.target.value)} className={campo} />
        </Campo>
        <Campo id="municipio" titulo="Município (opcional)" erro={mostrar("municipio")}>
          <input id="municipio" value={d.municipio} maxLength={LIMITES_DO_PEDIDO.municipio}
            onChange={(e) => muda("municipio", e.target.value)} className={campo} />
        </Campo>
        <Campo id="funcao" titulo="Sua função (opcional)" erro={mostrar("funcao")}
          dica={d.tipo === "surf" ? "Ex.: instrutor(a), coordenador(a)." : "Ex.: professora de ciências, coordenação."}>
          <input id="funcao" value={d.funcao} maxLength={LIMITES_DO_PEDIDO.funcao} autoComplete="organization-title"
            onChange={(e) => muda("funcao", e.target.value)} className={campo} />
        </Campo>
      </div>

      <fieldset>
        <legend className={rotulo}>Como quer participar</legend>
        <div className="space-y-2">
          {PAPEIS_NO_PEDIDO.map((p) => (
            <label key={p.id} className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="radio" name="papel" value={p.id} checked={d.papel === p.id}
                onChange={() => muda("papel", p.id)} className="mt-1" />
              <span>
                <span className="font-semibold">{p.nome}</span>
                <span className="block text-[11px] text-muted-foreground">{p.descricao}</span>
              </span>
            </label>
          ))}
        </div>
        {mostrar("papel") && <p className="text-[11px] text-destructive mt-1">{mostrar("papel")}</p>}
      </fieldset>

      <Campo id="mensagem" titulo="Conte um pouco (opcional)" erro={mostrar("mensagem")}
        dica="Turmas, faixa etária, praia ou rio perto de vocês, o que gostariam de fazer.">
        <textarea id="mensagem" rows={5} value={d.mensagem} maxLength={LIMITES_DO_PEDIDO.mensagem}
          onChange={(e) => muda("mensagem", e.target.value)} className={campo} />
      </Campo>

      {/* Armadilha para robô: fora da tela e fora da ordem de tabulação.
          Quem usa a página não a vê; quem a preencher não tem o pedido gravado. */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="site">Site</label>
        <input id="site" tabIndex={-1} autoComplete="off" value={d.site} onChange={(e) => muda("site", e.target.value)} />
      </div>

      <label className="flex items-start gap-2 text-xs leading-relaxed cursor-pointer">
        <input type="checkbox" checked={d.consentimento} onChange={(e) => muda("consentimento", e.target.checked)} className="mt-0.5" />
        <span>
          Autorizo o Instituto Ecosurf a usar estes dados para analisar o pedido e responder por
          e-mail. Eles ficam visíveis só para a equipe do Ecosurf, não aparecem na plataforma e não
          criam conta.
        </span>
      </label>
      {mostrar("consentimento") && <p className="text-[11px] text-destructive -mt-4">{mostrar("consentimento")}</p>}

      <p className="text-[11px] text-muted-foreground">
        Não escreva aqui dados de alunos. O pedido é da escola ou da organização, não da turma.
      </p>

      {erro && (
        <p className="p-3 rounded-sm text-xs flex items-start gap-2 border bg-destructive/10 border-destructive/30 text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {erro}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={enviando}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-sm hover:opacity-90 disabled:opacity-60">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar pedido
        </button>
        <p className="text-xs text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-primary hover:underline font-semibold">Entrar</Link>
        </p>
      </div>
    </form>
  );
}

function Campo({ id, titulo, erro, dica, children }: {
  id: string; titulo: string; erro?: string; dica?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={rotulo}>{titulo}</label>
      {children}
      {erro ? (
        <p className="text-[11px] text-destructive mt-1">{erro}</p>
      ) : dica ? (
        <p className="text-[11px] text-muted-foreground mt-1">{dica}</p>
      ) : null}
    </div>
  );
}

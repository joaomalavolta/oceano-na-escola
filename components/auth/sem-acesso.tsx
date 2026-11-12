"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, Send } from "lucide-react";

import { podeCadastrarEscola } from "@/lib/acesso";

/**
 * O aviso para a conta que existe mas não foi convidada.
 *
 * A entrada na rede é por convite. Uma conta criada por fora dele — pelo
 * Supabase Auth direto, ou antes de o cadastro avulso fechar — entra,
 * mas não cadastra escola: o banco recusa. Aqui ela fica sabendo por quê
 * e por onde seguir.
 */
export function AvisoSemAcesso() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center min-h-[50vh]">
      <span className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        <Lock className="w-6 h-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">Sua conta ainda não tem acesso à rede</p>
      <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
        A entrada na plataforma é por convite do Instituto Ecosurf. Se você quer trazer a sua
        escola, deixe um pedido de entrada; o convite chega pelo e-mail. Se já recebeu um
        convite, abra o link do e-mail com esta mesma conta.
      </p>
      <Link
        href="/pedir-entrada"
        className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
      >
        <Send className="w-4 h-4" />
        Pedir entrada
      </Link>
    </div>
  );
}

/**
 * Só mostra o conteúdo se a conta puder cadastrar escola. Se a pergunta
 * ao banco falhar, mostra o conteúdo: o banco recusa de qualquer forma,
 * e uma falha de rede não deve trancar quem tem acesso.
 */
export function ExigeAcessoParaCadastrar({ children }: { children: React.ReactNode }) {
  const [pode, setPode] = useState<boolean | null | undefined>(undefined);

  useEffect(() => {
    let ativo = true;
    podeCadastrarEscola().then((r) => ativo && setPode(r));
    return () => {
      ativo = false;
    };
  }, []);

  if (pode === undefined) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 min-h-[50vh] text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        Conferindo o acesso…
      </div>
    );
  }
  if (pode === false) return <AvisoSemAcesso />;
  return <>{children}</>;
}

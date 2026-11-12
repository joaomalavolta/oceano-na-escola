"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useSessao } from "@/lib/sessao";
import { lembrarTipo } from "@/lib/organizacao";

/**
 * A entrada do instrutor no cadastro.
 *
 * Guarda "escola de surf" no aparelho antes de sair daqui. Quem clica
 * ainda não tem conta: passa pela tela de entrada e pela confirmação de
 * e-mail, e só então chega ao cadastro — caminho em que um parâmetro de
 * URL se perde. Com a escolha guardada, o cadastro já abre no tipo
 * certo, e a pessoa ainda pode trocá-lo lá.
 */
export function BotaoCadastroSurf() {
  const { session } = useSessao();

  return (
    <Link
      href={session ? "/onboarding" : "/entrar"}
      onClick={() => lembrarTipo("surf")}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity"
    >
      Cadastrar a minha escola de surf
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

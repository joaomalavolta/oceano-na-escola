"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useSessao } from "@/lib/sessao";
import { lembrarTipo } from "@/lib/organizacao";

/**
 * A entrada do instrutor no cadastro.
 *
 * A entrada na rede é por convite. Quem ainda não tem conta vai ao
 * pedido de entrada, já marcado como escola de surf. Quem já tem conta
 * vai ao cadastro — e lá descobre se a conta pode cadastrar escola.
 *
 * Guarda "escola de surf" no aparelho antes de sair daqui: entre o
 * pedido, o convite e a criação da conta passam dias, e um parâmetro de
 * URL se perde no caminho. Com a escolha guardada, o cadastro abre no
 * tipo certo, e a pessoa ainda pode trocá-lo lá.
 */
export function BotaoCadastroSurf() {
  const { session } = useSessao();

  return (
    <Link
      href={session ? "/onboarding" : "/pedir-entrada?tipo=surf"}
      onClick={() => lembrarTipo("surf")}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity"
    >
      {session ? "Cadastrar a minha escola de surf" : "Pedir entrada para a minha escola de surf"}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

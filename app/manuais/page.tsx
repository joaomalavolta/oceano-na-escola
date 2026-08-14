"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, Printer, Users } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { MANUAIS, VERSAO_MANUAIS } from "@/lib/manuais";

const ICONE = {
  professor: Users,
  aluno: GraduationCap,
} as const;

/**
 * Os manuais ficam atrás do login, como o Ecosurf pediu.
 *
 * Vale dizer o que isso significa para o manual do aluno: ele não é
 * secreto, é distribuído pelo professor. A turma recebe o manual em
 * papel, na saída de campo — e é assim que ele funciona melhor de
 * qualquer forma, porque praia não tem sinal e ninguém lê manual no
 * celular com a mão cheia de areia.
 */
function ManuaisConteudo() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 space-y-6">
      <header className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Manuais
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          Versão {VERSAO_MANUAIS}. Os dois são feitos para imprimir: o do professor fica na sala,
          o do aluno vai na mochila.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {MANUAIS.map((m) => {
          const Icone = ICONE[m.slug];
          return (
            <Link
              key={m.slug}
              href={`/manuais/${m.slug}`}
              className="block bg-card border border-border rounded-md p-5 shadow-2xs hover:border-primary/50 hover:bg-secondary/30 transition-colors"
            >
              <span className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3">
                <Icone className="w-5 h-5" />
              </span>
              <span className="block text-sm font-bold">{m.titulo}</span>
              <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                {m.subtitulo}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3">
                <Printer className="w-3 h-3" />
                {m.paginas}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="p-3.5 rounded-sm border border-amber-500/40 bg-amber-500/10 text-xs leading-relaxed">
        <p className="font-semibold text-amber-800 dark:text-amber-300">
          Antes de usar com turma
        </p>
        <p className="mt-1">
          Os textos de método dos protocolos ainda não passaram por revisão formal do Instituto
          Ecosurf. O manual descreve corretamente o funcionamento da plataforma; o que precisa de
          conferência é o procedimento de campo — sobretudo em Microplásticos e Qualidade da água,
          onde o limite de detecção e a calibragem mudam o que o número significa.
        </p>
      </div>
    </main>
  );
}

export default function ManuaisPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <ManuaisConteudo />
      </RotaProtegida>
    </div>
  );
}

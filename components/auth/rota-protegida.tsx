"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";

import { useSessao } from "@/lib/sessao";

/**
 * Exige sessão para renderizar o conteúdo.
 *
 * É conveniência de interface, não proteção de dados: quem protege os
 * dados é o RLS, no banco. Sem sessão, as consultas voltariam vazias de
 * qualquer forma — isto só evita mostrar uma tela vazia sem explicação.
 */
export function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { session, carregando, disponivel } = useSessao();
  const router = useRouter();

  useEffect(() => {
    if (disponivel && !carregando && !session) {
      router.replace("/entrar");
    }
  }, [disponivel, carregando, session, router]);

  if (!disponivel) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center min-h-[60vh]">
        <p className="text-sm font-semibold text-foreground">
          Área restrita indisponível
        </p>
        <p className="text-xs text-muted-foreground max-w-sm">
          Este ambiente está sem as variáveis do Supabase, então não há
          autenticação nem banco para consultar.
        </p>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 min-h-[60vh] text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">Verificando a sessão…</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center min-h-[60vh]">
        <p className="text-sm font-semibold text-foreground">Área restrita</p>
        <p className="text-xs text-muted-foreground">
          Entre com a conta da escola para continuar.
        </p>
        <Link
          href="/entrar"
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
        >
          <LogIn className="w-4 h-4" />
          Entrar
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { use } from "react";
import Link from "next/link";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import { FolhaManual } from "@/components/manuais/folha-manual";
import { manualPorSlug } from "@/lib/manuais";

function ManualConteudo({ slug }: { slug: string }) {
  const manual = manualPorSlug(slug);

  if (!manual) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 space-y-4">
        <EstadoContainer estado="erro" mensagemErro="Este manual não existe." />
        <Link href="/manuais" className="block text-center text-xs text-primary hover:underline">
          Ver os manuais disponíveis
        </Link>
      </main>
    );
  }

  return <FolhaManual manual={manual} />;
}

export default function ManualPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col print:bg-white">
      {/* A barra some no papel: ela é navegação, e papel não navega. */}
      <div className="print:hidden">
        <BarraNavegacao />
      </div>
      <RotaProtegida>
        <ManualConteudo slug={slug} />
      </RotaProtegida>
    </div>
  );
}

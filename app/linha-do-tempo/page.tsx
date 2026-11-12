"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { LinhaDoTempo } from "@/components/linha-do-tempo/linha-do-tempo";
import { carregarLinhaDoTempo, type DadosDaLinha } from "@/lib/dados-linha-do-tempo";
import { montarLinhaDoTempo } from "@/lib/linha-do-tempo";
import { redeDaUrl } from "@/lib/organizacao";

const RECORTES = [
  { rede: "", rotulo: "Toda a rede", href: "/linha-do-tempo" },
  { rede: "regular", rotulo: "Escolas", href: "/linha-do-tempo?rede=regular" },
  { rede: "surf", rotulo: "Escolas de surf", href: "/linha-do-tempo?rede=surf" },
] as const;

/**
 * A linha do tempo da rede.
 *
 * Responde "o que as outras escolas andaram fazendo?" — que é a pergunta
 * de quem está começando e quer ver como as outras fazem, e de quem já
 * faz e quer saber que não está sozinho. Cada marco é uma saída de campo
 * publicada; as fotos são as que a escola curou.
 */
function Conteudo() {
  const params = useSearchParams();
  const rede = redeDaUrl(params.get("rede"));
  const [dados, setDados] = useState<DadosDaLinha | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarLinhaDoTempo().then((d) => ativo && setDados(d));
    return () => {
      ativo = false;
    };
  }, []);

  const meses = useMemo(
    () => (dados ? montarLinhaDoTempo({ ...dados, rede }) : []),
    [dados, rede]
  );
  const saidas = meses.reduce((s, m) => s + m.marcos.length, 0);
  const escolasAtivas = new Set(meses.flatMap((m) => m.marcos.map((x) => x.expedicao.escola_slug))).size;

  const estado = !dados ? "carregando" : dados.erro ? "erro" : saidas === 0 ? "vazio" : "pronto";

  return (
    <main className="max-w-3xl mx-auto w-full px-4 py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-primary" />
          Linha do tempo da rede
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          As saídas de campo publicadas por todas as escolas, da mais recente para a mais antiga.
          Cada escola vê o que as outras estão fazendo — onde foram, quando, e o que registraram.
        </p>
        {dados && saidas > 0 && (
          <p className="text-xs text-muted-foreground mt-2 tabular-nums">
            {saidas} {saidas === 1 ? "saída" : "saídas"} de {escolasAtivas}{" "}
            {escolasAtivas === 1 ? "escola" : "escolas"}
          </p>
        )}
        {dados?.origem === "mock" && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Dados de demonstração: escolas e saídas fictícias.
          </p>
        )}
      </header>

      <nav aria-label="Recorte da rede" className="flex flex-wrap gap-1.5 mb-6">
        {RECORTES.map((r) => {
          const ativo = rede === r.rede;
          return (
            <Link
              key={r.rede || "todas"}
              href={r.href}
              aria-current={ativo ? "page" : undefined}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                ativo
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {r.rotulo}
            </Link>
          );
        })}
      </nav>

      <EstadoContainer
        estado={estado}
        mensagemVazia={
          rede === "surf"
            ? "Nenhuma escola de surf publicou saída de campo ainda."
            : "Nenhuma saída de campo publicada ainda."
        }
        mensagemErro="Não foi possível carregar a linha do tempo."
        onTentarNovamente={() => window.location.reload()}
      >
        <LinhaDoTempo meses={meses} />
      </EstadoContainer>
    </main>
  );
}

export default function LinhaDoTempoPage() {
  return (
    <div className="min-h-screen bg-background">
      <BarraNavegacao />
      <Suspense fallback={null}>
        <Conteudo />
      </Suspense>
    </div>
  );
}

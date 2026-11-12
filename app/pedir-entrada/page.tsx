import type { Metadata } from "next";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { FormularioDePedido } from "@/components/pedido/formulario-de-pedido";
import type { TipoNoPedido } from "@/lib/pedido-entrada";

export const metadata: Metadata = {
  title: "Pedir entrada — Oceano na Escola",
  description:
    "A entrada na rede Oceano na Escola é por convite do Instituto Ecosurf. Escolas, escolas de surf e pesquisadores pedem entrada por aqui.",
};

/**
 * O pedido de entrada na rede.
 *
 * A conta não se cria mais sozinha: a entrada é por convite. Esta é a
 * porta para quem ainda não foi convidado — deixa o pedido, o Ecosurf
 * analisa e, aceitando, manda o convite por e-mail.
 */
export default async function PedirEntradaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const inicial: TipoNoPedido = tipo === "surf" || tipo === "outra" ? tipo : "regular";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <main className="flex-1 w-full px-4 py-10 md:py-14">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Programa Oceano na Escola · Instituto Ecosurf
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pedir entrada na rede</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            A rede cresce por parceria: cada escola entra com o acompanhamento do Instituto
            Ecosurf, que apresenta o método e combina como vai ser o trabalho com a turma. Por
            isso a conta não se cria sozinha. Conte quem você é e de onde vem; o Ecosurf responde
            pelo e-mail informado e, combinada a entrada, envia o convite para criar a conta.
          </p>
          <FormularioDePedido tipoInicial={inicial} />
        </div>
      </main>
    </div>
  );
}

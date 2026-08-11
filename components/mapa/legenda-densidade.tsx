"use client";

import { escalaDe, PROTOCOLO_PADRAO, type FaixaDensidade } from "@/lib/mapa-publico";

interface LegendaDensidadeProps {
  /** Protocolo que a legenda descreve. */
  protocolo?: string;
  /** Nome vindo do banco. Sem ele, mostra o código. */
  nome?: string | null;
  /** Unidade vinda do banco: itens/m², m², pontos. */
  unidade?: string | null;
  /** Faixas já resolvidas pelo mapa — curadas ou derivadas dos dados. */
  escala?: FaixaDensidade[];
}

export function LegendaDensidade({
  protocolo = PROTOCOLO_PADRAO,
  nome,
  unidade,
  escala,
}: LegendaDensidadeProps) {
  const faixas = escala ?? escalaDe(protocolo);

  return (
    <div className="hidden md:block fixed bottom-20 right-4 z-40">
      <div className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-sm px-3 py-2 shadow-lg">
        <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
          Densidade {unidade ? `(${unidade})` : ""}
        </h4>
        <p className="text-[10px] text-muted-foreground mb-1.5">{nome ?? protocolo}</p>
        <div className="flex flex-col gap-1.5">
          {faixas.map((faixa) => (
            <div key={faixa.label} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-sm shrink-0"
                style={{ backgroundColor: faixa.cor }}
              />
              <span className="text-xs">{faixa.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

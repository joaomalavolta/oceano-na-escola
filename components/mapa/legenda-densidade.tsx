"use client";

import { escalaDe, PROTOCOLO_PADRAO } from "@/lib/mapa-publico";

const NOME_PROTOCOLO: Record<string, string> = {
  RES: "Resíduos",
  MIC: "Microplásticos",
};

interface LegendaDensidadeProps {
  /** Protocolo exibido no mapa. Cada um tem escala própria. */
  protocolo?: string;
}

export function LegendaDensidade({ protocolo = PROTOCOLO_PADRAO }: LegendaDensidadeProps) {
  const escala = escalaDe(protocolo);
  const nome = NOME_PROTOCOLO[protocolo] ?? protocolo;

  return (
    <div className="hidden md:block fixed bottom-20 right-4 z-40">
      <div className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-sm px-3 py-2 shadow-lg">
        <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
          Densidade (itens/m²)
        </h4>
        <p className="text-[10px] text-muted-foreground mb-1.5">{nome}</p>
        <div className="flex flex-col gap-1.5">
          {escala.map((faixa) => (
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

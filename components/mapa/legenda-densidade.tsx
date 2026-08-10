"use client";

import { NIVEIS_DENSIDADE } from "@/lib/mapa-publico";

export function LegendaDensidade() {
  return (
    <div className="hidden md:block fixed bottom-20 right-4 z-40">
      <div className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-sm px-3 py-2 shadow-lg">
        <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
          Densidade (itens/m²)
        </h4>
        <div className="flex flex-col gap-1.5">
          {NIVEIS_DENSIDADE.map((nivel) => (
            <div key={nivel.label} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-sm shrink-0"
                style={{ backgroundColor: nivel.cor }}
              />
              <span className="text-xs">{nivel.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

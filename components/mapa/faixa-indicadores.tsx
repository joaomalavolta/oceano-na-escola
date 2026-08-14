"use client";

import { School, Ship, Eye, Route, Package } from "lucide-react";
import type { IndicadoresGerais } from "@/lib/database.types";

interface FaixaIndicadoresProps {
  dados: IndicadoresGerais;
}

const INDICADORES = [
  { chave: "escolas" as const, label: "Escolas", Icon: School },
  { chave: "expedicoes" as const, label: "Expedições", Icon: Ship },
  { chave: "observacoes" as const, label: "Observações", Icon: Eye },
  { chave: "km_monitorados" as const, label: "km monitorados", Icon: Route },
  { chave: "itens_catalogados" as const, label: "Itens catalogados", Icon: Package },
] as const;

export function FaixaIndicadores({ dados }: FaixaIndicadoresProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-18 md:pb-4 pointer-events-none">
      {/* Rótulos a 85% e não a 70%: a faixa é translúcida, o mapa
          clareia o azul por baixo dela, e a 70% eles mediam 4,43 —
          logo abaixo do mínimo de 4,5. O número escapa da regra por
          outro caminho: a 20 px em negrito ele conta como texto
          grande, onde 3:1 basta, e o âmbar dá 3,55.

          Azul da marca, e não mais vidro creme. A faixa fecha o mapa
          por baixo como a barra o fecha por cima: as duas viraram a
          moldura do território, e o creme era a única superfície da
          tela que não pertencia a lugar nenhum. */}
      <div className="pointer-events-auto bg-marca/95 backdrop-blur-xl border-t-2 border-marca-forte rounded-sm shadow-lg">
        {/* Desktop: row */}
        <div className="hidden md:flex items-center justify-around px-4 py-2.5">
          {INDICADORES.map(({ chave, label, Icon }) => (
            <div key={chave} className="flex items-center gap-2">
              <Icon size={16} className="text-white/85 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xl font-bold tabular-nums text-accent">
                  {dados[chave].toLocaleString("pt-BR")}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-white/85">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: horizontal carousel */}
        <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory gap-0 px-2 py-2.5 scrollbar-none">
          {INDICADORES.map(({ chave, label, Icon }) => (
            <div
              key={chave}
              className="flex-none min-w-[120px] snap-start flex items-center gap-2 px-2"
            >
              <Icon size={14} className="text-white/85 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xl font-bold tabular-nums text-accent">
                  {dados[chave].toLocaleString("pt-BR")}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/85 whitespace-nowrap">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

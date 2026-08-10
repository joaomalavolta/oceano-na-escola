"use client";

import Link from "next/link";
import { formatarMes } from "@/lib/mapa-publico";

interface PopupCelulaProps {
  densidade: number | null;
  totalItens: number;
  areaAmostrada: number;
  mes: string;
  escolaNome: string;
  escolaSlug: string;
}

export function PopupCelula({
  densidade,
  totalItens,
  areaAmostrada,
  mes,
  escolaNome,
  escolaSlug,
}: PopupCelulaProps) {
  return (
    <div className="px-3 py-2.5 min-w-[200px]">
      {/* Densidade — destaque principal */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-lg font-bold tabular-nums text-accent">
          {densidade !== null ? densidade.toLocaleString("pt-BR", { minimumFractionDigits: 3 }) : "—"}
        </span>
        <span className="text-[11px] text-muted-foreground">itens/m²</span>
      </div>

      {/* Detalhes */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total de itens</span>
          <span className="font-medium tabular-nums">{totalItens.toLocaleString("pt-BR")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Área amostrada</span>
          <span className="font-medium tabular-nums">
            {areaAmostrada.toLocaleString("pt-BR")} m²
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mês</span>
          <span className="font-medium capitalize">{formatarMes(mes)}</span>
        </div>
      </div>

      {/* Escola — link para a página */}
      <div className="mt-2 pt-2 border-t border-border">
        <Link
          href={`/escola/${escolaSlug}`}
          className="text-sm text-primary hover:underline transition-colors"
        >
          {escolaNome}
        </Link>
      </div>
    </div>
  );
}

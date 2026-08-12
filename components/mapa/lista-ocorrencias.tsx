"use client";

import { MapPinned } from "lucide-react";
import { IconeBadge, slugDe } from "./icones";
import type { PubObservacaoPontual } from "@/lib/database.types";

interface Props {
  ocorrencias: PubObservacaoPontual[];
  /** Total antes do recorte pela área visível, para dizer o que ficou fora. */
  totalNoFiltro: number;
  onIr: (o: PubObservacaoPontual) => void;
}

function data(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

/**
 * O que está no enquadramento, em lista.
 *
 * O mapa sozinho só entrega o dado a quem passa o mouse em cima de cada
 * pino, um a um. Isso deixa de fora quem navega por teclado, quem usa
 * leitor de tela e quem só quer saber o que existe ali sem caçar. A
 * lista acompanha o enquadramento: mexeu o mapa, mudou a lista.
 *
 * É a resposta em texto para a pergunta que o documento de concepção
 * coloca como central — o que está acontecendo neste território.
 */
export function ListaOcorrencias({ ocorrencias, totalNoFiltro, onIr }: Props) {
  if (ocorrencias.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-2 py-6 text-center">
        {totalNoFiltro > 0
          ? "Nenhuma ocorrência nesta área. Afaste o mapa ou mova para outro trecho."
          : "Nenhuma ocorrência publicada com estes filtros."}
      </p>
    );
  }

  const foraDaVista = totalNoFiltro - ocorrencias.length;

  return (
    <div className="space-y-1">
      {ocorrencias.map((o) => {
        const magnitude =
          o.valor !== null && o.item_unidade
            ? `${o.valor.toLocaleString("pt-BR")} ${o.item_unidade}`
            : null;

        return (
          <button
            key={o.id}
            onClick={() => onIr(o)}
            className="flex items-start gap-2.5 w-full text-left px-2 py-2 rounded-sm hover:bg-muted/60 transition-colors"
          >
            <IconeBadge
              slug={slugDe(o.item_icone, o.protocolo_icone)}
              cor={o.protocolo_cor}
              tamanho={26}
              className="mt-0.5"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium leading-tight truncate">
                {o.item_nome ?? o.descricao}
              </span>
              {magnitude && (
                <span className="block text-[12px] tabular-nums font-semibold text-accent">
                  {magnitude}
                </span>
              )}
              <span className="block text-[11px] text-muted-foreground truncate">
                {o.escola_nome} · {data(o.data_campo)}
              </span>
            </span>
            <MapPinned className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
          </button>
        );
      })}

      {foraDaVista > 0 && (
        <p className="text-[11px] text-muted-foreground px-2 pt-2 border-t border-glass-border">
          Mais {foraDaVista} fora do enquadramento. Afaste o mapa para alcançá-las.
        </p>
      )}
    </div>
  );
}

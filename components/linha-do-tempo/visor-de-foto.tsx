"use client";

import { useRef } from "react";
import { X } from "lucide-react";

import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import { PedirRemocao } from "@/components/ui/pedir-remocao";

interface Props {
  evidenciaId: number;
  storagePath: string;
  legenda: string | null;
  /** Linha de contexto: escola e data da saída. */
  contexto: string;
  alt: string;
  className?: string;
}

/**
 * Miniatura que abre a foto grande.
 *
 * O pedido de remoção mora aqui dentro, e não embaixo de cada miniatura.
 * Embaixo, quatro fotos por saída davam quatro "Pedir remoção desta
 * imagem" em fila, mais altos que as próprias fotos — e o da última
 * ficava escondido sob o "+2". Aberta, a foto é vista inteira, e quem
 * quer pedir que ela saia está olhando exatamente para ela.
 *
 * `<dialog>` nativo: o Esc fecha, o foco fica preso dentro enquanto ele
 * está aberto e volta à miniatura ao fechar, sem biblioteca.
 */
export function VisorDeFoto({ evidenciaId, storagePath, legenda, contexto, alt, className }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        className="block w-full rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`Abrir foto: ${alt}`}
      >
        <FotoEvidencia storagePath={storagePath} alt={alt} className={className} />
      </button>

      <dialog
        ref={dialogo}
        // Clique fora da caixa (no fundo escurecido) fecha.
        onClick={(e) => {
          if (e.target === dialogo.current) dialogo.current?.close();
        }}
        className="m-auto w-[min(56rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] p-0 rounded-md border border-border bg-card text-foreground shadow-xl backdrop:bg-black/70"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => dialogo.current?.close()}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
          <FotoEvidencia
            storagePath={storagePath}
            alt={alt}
            className="w-full max-h-[70vh] object-contain bg-black"
          />
        </div>
        <div className="p-4 space-y-1.5">
          {legenda && <p className="text-sm">{legenda}</p>}
          <p className="text-xs text-muted-foreground">{contexto}</p>
          <div className="pt-1">
            <PedirRemocao evidenciaId={evidenciaId} />
          </div>
        </div>
      </dialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

/**
 * Exclusão em dois passos, na própria linha.
 *
 * Com `digitar`, o botão só destrava quando o texto pedido é digitado
 * igual — é o que se usa para escola e pessoa, onde a exclusão leva
 * muita coisa junto. Para um pino, um segundo clique basta.
 */
export function Excluir({
  rotulo = "Excluir",
  aviso,
  digitar,
  aoConfirmar,
}: {
  rotulo?: string;
  aviso: string;
  digitar?: string;
  aoConfirmar: (digitado: string) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const liberado = digitar ? texto.trim() === digitar.trim() : true;

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {rotulo}
      </button>
    );
  }

  return (
    <div className="w-full mt-2 p-3 rounded-sm border border-destructive/40 bg-destructive/5 space-y-2">
      <p className="text-xs leading-relaxed text-destructive">{aviso}</p>
      {digitar && (
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">
            Para confirmar, digite <strong className="text-foreground">{digitar}</strong>
          </label>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-sm"
          />
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAberto(false);
            setTexto("");
          }}
          disabled={ocupado}
          className="px-3 py-1.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!liberado || ocupado}
          onClick={async () => {
            setOcupado(true);
            await aoConfirmar(texto);
            setOcupado(false);
            setAberto(false);
            setTexto("");
          }}
          className="px-3 py-1.5 text-xs font-semibold bg-destructive text-white rounded-sm disabled:opacity-40 inline-flex items-center gap-1"
        >
          {ocupado ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Excluir de vez
        </button>
      </div>
    </div>
  );
}

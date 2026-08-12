"use client";

import { useState } from "react";
import { Layers2, Check } from "lucide-react";
import { MAPAS_DE_FUNDO, type MapaDeFundo } from "@/lib/mapa-base";

interface Props {
  atual: MapaDeFundo;
  onEscolher: (id: string) => void;
  /**
   * De que lado o painel cresce.
   *
   * Precisa acompanhar de que lado do mapa o botão está. Alinhado à
   * direita num botão encostado na borda esquerda, o painel de 16rem
   * avança para fora do mapa — e num mapa dentro de caixa com
   * `overflow-hidden`, como o da página da escola, ele simplesmente
   * some, com a camada de clique-fora ocupando o lugar dele.
   */
  alinhamento?: "direita" | "esquerda";
}

/**
 * Troca do mapa de fundo.
 *
 * Fica recolhido em um botão: o mapa de fundo é escolha ocasional, e
 * três opções sempre abertas competiriam com o painel de camadas, que é
 * o controle do dia a dia. Aberto, mostra o que cada fundo serve — a
 * diferença entre "Mapa" e "Satélite" é óbvia para quem já usou mapa
 * digital, e não é para quem está aprendendo a usar um.
 */
export function SeletorFundo({ atual, onEscolher, alinhamento = "direita" }: Props) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex items-center gap-2 px-3 h-9 rounded-sm bg-glass-bg backdrop-blur-xl border border-glass-border shadow-sm text-xs font-semibold text-foreground hover:bg-secondary/60 transition-colors"
      >
        <Layers2 className="w-4 h-4 text-primary" />
        <span>{atual.nome}</span>
      </button>

      {aberto && (
        <>
          {/* Clique fora fecha. Sem isto, o painel ficaria aberto sobre o
              mapa e roubaria a área de arrasto. */}
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />

          <div
            className={`absolute mt-1.5 z-50 w-64 rounded-sm bg-glass-bg backdrop-blur-xl border border-glass-border shadow-lg overflow-hidden ${
              alinhamento === "direita" ? "right-0" : "left-0"
            }`}
          >
            {MAPAS_DE_FUNDO.map((m) => {
              const ativo = m.id === atual.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onEscolher(m.id);
                    setAberto(false);
                  }}
                  className={`flex items-start gap-2.5 w-full text-left px-3 py-2.5 transition-colors ${
                    ativo ? "bg-primary/10" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="w-4 shrink-0 pt-0.5">
                    {ativo && <Check className="w-4 h-4 text-primary" />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm ${ativo ? "font-semibold text-primary" : ""}`}
                    >
                      {m.nome}
                    </span>
                    <span className="block text-[11px] text-muted-foreground leading-snug">
                      {m.descricao}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

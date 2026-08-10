"use client";

import React from "react";
import { Loader2, AlertTriangle, Inbox, Lock, Save } from "lucide-react";

interface EstadoContainerProps {
  estado: "carregando" | "vazio" | "erro" | "somente_leitura" | "salvando" | "pronto";
  mensagemVazia?: string;
  mensagemErro?: string;
  onTentarNovamente?: () => void;
  children: React.ReactNode;
}

/**
 * Componente padronizado para os 5 estados obrigatórios da plataforma:
 * 1. Carregando
 * 2. Vazio (com orientação do que fazer)
 * 3. Erro (com ação de tentar de novo)
 * 4. Somente leitura (dados validados ou sem permissão)
 * 5. Salvando
 */
export function EstadoContainer({
  estado,
  mensagemVazia = "Nenhum registro encontrado.",
  mensagemErro = "Ocorreu um erro ao carregar os dados.",
  onTentarNovamente,
  children,
}: EstadoContainerProps) {
  if (estado === "carregando") {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando dados do território…</p>
      </div>
    );
  }

  if (estado === "vazio") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-md bg-card/50 min-h-[250px]">
        <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-1">{mensagemVazia}</p>
      </div>
    );
  }

  if (estado === "erro") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-destructive/10 border border-destructive/20 rounded-md text-destructive min-h-[250px]">
        <AlertTriangle className="w-10 h-10 mb-2" />
        <p className="text-sm font-semibold mb-3">{mensagemErro}</p>
        {onTentarNovamente && (
          <button
            onClick={onTentarNovamente}
            className="px-4 py-1.5 text-xs font-semibold bg-destructive text-destructive-foreground rounded-sm hover:opacity-90 transition-opacity"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {estado === "somente_leitura" && (
        <div className="flex items-center gap-2 p-2 mb-3 bg-secondary/80 border border-border text-xs text-muted-foreground rounded-sm">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span>Modo somente leitura — esta expedição já foi validada e publicada.</span>
        </div>
      )}
      {estado === "salvando" && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-card border border-border shadow-lg rounded-sm text-xs font-medium text-foreground">
          <Save className="w-4 h-4 text-accent animate-bounce" />
          <span>Salvando alterações…</span>
        </div>
      )}
      {children}
    </div>
  );
}

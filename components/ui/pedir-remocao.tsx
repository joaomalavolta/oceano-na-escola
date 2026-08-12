"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { pedirRemocao } from "@/lib/galeria";

/**
 * Pedido de remoção de imagem.
 *
 * O termo de parceria promete remoção em até 72 horas mediante pedido
 * formalizado, e as premissas mandam que a imagem saia do ar antes da
 * exclusão definitiva — isso acontece no banco, num gatilho, no
 * instante em que o pedido é gravado. Aqui só se coleta o pedido.
 *
 * Fica aberto a quem não tem login: quem precisa pedir a remoção de uma
 * foto é a família, e família não tem conta na plataforma.
 */
export function PedirRemocao({ evidenciaId }: { evidenciaId: number }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async () => {
    if (nome.trim() === "" || contato.trim() === "") return;
    setEnviando(true);
    setErro(null);
    const { erro: falha } = await pedirRemocao({ evidenciaId, nome, contato, motivo });
    setEnviando(false);
    if (falha) {
      setErro(falha);
      return;
    }
    setEnviado(true);
  };

  if (enviado) {
    return (
      <p className="text-[11px] flex items-start gap-1.5 text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Pedido registrado. A imagem já saiu do ar; a exclusão definitiva acontece em até 72
          horas.
        </span>
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-[11px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
      >
        <ShieldAlert className="w-3 h-3" />
        Pedir remoção desta imagem
      </button>
    );
  }

  return (
    <div className="space-y-2 border-t border-border pt-2 mt-1">
      <p className="text-[11px] text-muted-foreground">
        Pedido formalizado de remoção. A imagem sai do ar imediatamente e é apagada em até 72
        horas, conforme o termo de parceria.
      </p>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        className="w-full px-2 py-1.5 text-xs bg-background border border-input rounded-sm"
      />
      <input
        type="text"
        value={contato}
        onChange={(e) => setContato(e.target.value)}
        placeholder="E-mail ou telefone para retorno"
        className="w-full px-2 py-1.5 text-xs bg-background border border-input rounded-sm"
      />
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        rows={2}
        placeholder="Motivo (opcional)"
        className="w-full px-2 py-1.5 text-xs bg-background border border-input rounded-sm resize-none"
      />
      {erro && (
        <p className="text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {erro}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setAberto(false)}
          disabled={enviando}
          className="flex-1 py-1.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={enviar}
          disabled={enviando || nome.trim() === "" || contato.trim() === ""}
          className="flex-1 py-1.5 text-xs font-semibold bg-destructive text-white rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Enviar pedido
        </button>
      </div>
    </div>
  );
}

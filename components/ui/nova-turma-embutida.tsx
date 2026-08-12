"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Plus, X } from "lucide-react";
import { criarTurma, type TurmaDisponivel } from "@/lib/cadastro-expedicao";

interface Props {
  escolaId: number;
  anoLetivo: number;
  onCriada: (turma: TurmaDisponivel) => void;
}

const NIVEIS = [
  "",
  "Anos iniciais",
  "Anos finais",
  "Ensino médio",
  "EJA",
  "Educação infantil",
];

/**
 * Cadastro de turma dentro da ficha.
 *
 * A turma nasce no ano letivo que a ficha está usando — quem abre a
 * saída de campo em 2027 não precisa lembrar de trocar o ano num
 * segundo lugar. "7º ano B" de 2026 e de 2027 são turmas diferentes
 * para o banco, e é assim que a série histórica da escola não mistura
 * gerações.
 */
export function NovaTurmaEmbutida({ escolaId, anoLetivo, onCriada }: Props) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [nivel, setNivel] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async () => {
    if (nome.trim() === "") return;
    setSalvando(true);
    setErro(null);
    const { turma, erro: falha } = await criarTurma(escolaId, nome, anoLetivo, nivel);
    setSalvando(false);

    if (falha || !turma) {
      setErro(falha ?? "Não foi possível criar a turma.");
      return;
    }
    setNome("");
    setNivel("");
    setAberto(false);
    onCriada(turma);
  };

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="px-3 py-1.5 text-xs font-semibold rounded-sm border border-dashed border-input text-primary hover:bg-secondary/50 transition-colors inline-flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Nova turma em {anoLetivo}
      </button>
    );
  }

  return (
    <div className="w-full border border-primary/40 bg-primary/5 rounded-sm p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
          Nova turma · ano letivo {anoLetivo}
        </span>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="p-1 text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="7º ano B"
          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
        />
        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
        >
          {NIVEIS.map((n) => (
            <option key={n} value={n}>
              {n === "" ? "Nível (opcional)…" : n}
            </option>
          ))}
        </select>
      </div>

      {erro && (
        <p className="text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando || nome.trim() === ""}
        className="w-full py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
        Criar e selecionar
      </button>
    </div>
  );
}

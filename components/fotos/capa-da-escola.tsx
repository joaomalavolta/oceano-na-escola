"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2, Trash2 } from "lucide-react";

import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import { carregarCapa, definirCapa, type Capa } from "@/lib/fotos-da-escola";
import { removerEvidencia } from "@/lib/galeria";

interface Props {
  escolaId: number;
  /** O termo de imagem como está agora na ficha. */
  termosOk: boolean;
  /** "a escola" / "a escola de surf", para as frases. */
  aOrganizacao: string;
}

/**
 * A foto de capa, na ficha da escola.
 *
 * Escolher a capa já é a curadoria: quem escolhe está dizendo "esta é a
 * foto que nos representa", e ela vai a público assim que a escola
 * estiver publicada e com termo de imagem — nunca antes.
 */
export function CapaDaEscola({ escolaId, termosOk, aOrganizacao }: Props) {
  const [capa, setCapa] = useState<Capa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarCapa(escolaId).then((c) => {
      if (!ativo) return;
      setCapa(c);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [escolaId]);

  const escolher = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    const { erro: falha } = await definirCapa(escolaId, arquivo);
    if (falha) setErro(falha);
    setCapa(await carregarCapa(escolaId));
    setEnviando(false);
  };

  const remover = async () => {
    if (!capa) return;
    if (!window.confirm("Remover a foto de capa? O arquivo é apagado.")) return;
    setErro(null);
    setEnviando(true);
    const { erro: falha } = await removerEvidencia(capa.id, capa.storage_path);
    if (falha) setErro(falha);
    setCapa(await carregarCapa(escolaId));
    setEnviando(false);
  };

  const botaoArquivo = (rotulo: string) => (
    <label
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary transition-colors cursor-pointer ${
        enviando ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
      {enviando ? "Enviando…" : rotulo}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={enviando}
        onChange={(e) => {
          escolher(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        A foto que representa {aOrganizacao} na página pública e na lista da rede: a fachada, o
        portão, a turma reunida. Registro coletivo — sem destaque para um aluno, e sem nome na
        imagem.
      </p>

      {carregando ? (
        <div className="h-40 rounded-sm bg-muted/40 animate-pulse" />
      ) : capa ? (
        <div className="space-y-2">
          <FotoEvidencia
            storagePath={capa.storage_path}
            alt="Foto de capa"
            className="w-full h-48 sm:h-56 object-cover rounded-sm border border-border"
          />
          <div className="flex flex-wrap gap-2">
            {botaoArquivo("Trocar a foto")}
            <button
              type="button"
              onClick={remover}
              disabled={enviando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-destructive border border-border rounded-sm hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 h-40 rounded-sm border border-dashed border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">Sem foto de capa.</p>
          {botaoArquivo("Escolher a foto de capa")}
        </div>
      )}

      {capa && !termosOk && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          A capa só aparece em público depois de registrado o termo de uso de imagem.
        </p>
      )}

      {erro && (
        <p className="text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {erro}
        </p>
      )}
    </div>
  );
}

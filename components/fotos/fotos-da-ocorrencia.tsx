"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Eye, EyeOff, ImagePlus, Loader2, Trash2 } from "lucide-react";

import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import { enviarFotoDaOcorrencia, listarFotosDaOcorrencia, type FotoEnviada } from "@/lib/fotos-da-escola";
import { curarEvidencia, removerEvidencia } from "@/lib/galeria";

interface Props {
  escolaId: number;
  expedicaoId: number;
  pontualId: number;
  termosOk: boolean;
  /** Avisa a revisão para recontar fotos e alertas. */
  onMudou: () => void;
}

/**
 * As fotos de uma ocorrência, na revisão: ver, acrescentar e publicar.
 *
 * É aqui que o pino ganha imagem. A ocorrência que veio da ficha de
 * papel não tem foto; a que veio do celular pode ter, e precisa de
 * alguém que a olhe antes de ela ir ao mapa. As duas coisas na mesma
 * linha da tabela em que a ocorrência é conferida.
 */
export function FotosDaOcorrencia({ escolaId, expedicaoId, pontualId, termosOk, onMudou }: Props) {
  const [fotos, setFotos] = useState<FotoEnviada[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setFotos(await listarFotosDaOcorrencia(pontualId));
  }, [pontualId]);

  useEffect(() => {
    let ativo = true;
    listarFotosDaOcorrencia(pontualId).then((l) => ativo && setFotos(l));
    return () => {
      ativo = false;
    };
  }, [pontualId]);

  const agir = async (acao: () => Promise<{ erro: string | null }>) => {
    setOcupado(true);
    setErro(null);
    const { erro: falha } = await acao();
    if (falha) setErro(falha);
    await recarregar();
    onMudou();
    setOcupado(false);
  };

  return (
    <div className="space-y-2">
      {fotos === null ? (
        <div className="h-20 rounded-sm bg-muted/40 animate-pulse" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {fotos.map((f) => {
            const publica = f.status === "publicada";
            return (
              <div key={f.id} className="w-36 border border-border rounded-sm overflow-hidden bg-card">
                <FotoEvidencia
                  storagePath={f.storage_path}
                  alt="Foto da ocorrência"
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="p-1.5 space-y-1">
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${publica ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {publica ? "Vai ao mapa" : "Só para a escola"}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={ocupado || (!publica && !termosOk)}
                      title={!publica && !termosOk ? "Falta o termo de uso de imagem da escola" : undefined}
                      onClick={() => agir(() => curarEvidencia(f.id, !publica))}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-1.5 py-1 text-[11px] font-semibold border border-border rounded-sm hover:bg-secondary disabled:opacity-50"
                    >
                      {publica ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {publica ? "Tirar" : "Publicar"}
                    </button>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => {
                        if (window.confirm("Apagar esta foto? O arquivo é removido de vez.")) {
                          agir(() => removerEvidencia(f.id, f.storage_path));
                        }
                      }}
                      className="p-1 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      aria-label="Apagar foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <label
            className={`w-36 aspect-[4/3] flex flex-col items-center justify-center gap-1 border border-dashed border-border rounded-sm text-xs font-semibold text-primary cursor-pointer hover:bg-muted/40 ${
              ocupado ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {fotos.length === 0 ? "Pôr foto" : "Outra foto"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) agir(() => enviarFotoDaOcorrencia(escolaId, expedicaoId, pontualId, f));
              }}
            />
          </label>
        </div>
      )}

      {!termosOk && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          A escola ainda não registrou o termo de uso de imagem: as fotos ficam guardadas, mas não
          vão ao mapa.
        </p>
      )}
      {erro && <p className="text-[11px] text-destructive">{erro}</p>}
    </div>
  );
}

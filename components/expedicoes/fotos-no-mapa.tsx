"use client";

import { useState } from "react";
import { Camera, CheckCircle2, Clock, ImageOff, Loader2, Lock } from "lucide-react";

import type { SituacaoDasFotos } from "@/lib/pino-com-foto";

/** A declaração que acompanha toda publicação de foto em lote. */
export const DECLARACAO_DAS_FOTOS =
  "Conferi as fotos: nenhuma mostra rosto identificável de estudante, nome ou uniforme com nome.";

/**
 * O que falta para cada pino desta saída aparecer com foto no mapa.
 *
 * Junta numa caixa as quatro condições que antes viviam em quatro telas.
 * Depois da saída publicada, oferece publicar as fotos que ainda
 * aguardam curadoria — o mesmo ato da galeria, com a mesma declaração.
 */
export function FotosNoMapa({
  situacao,
  saidaPublicada,
  aoPublicarFotos,
}: {
  situacao: SituacaoDasFotos;
  saidaPublicada: boolean;
  aoPublicarFotos: () => Promise<void>;
}) {
  const [conferiu, setConferiu] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const s = situacao;
  if (s.ocorrencias === 0) return null;

  const linhas = [
    { Icone: CheckCircle2, cor: "text-emerald-600", n: s.comFotoPublicada, texto: "com foto publicada" },
    { Icone: Clock, cor: "text-amber-600", n: s.aguardandoCuradoria, texto: "com foto aguardando curadoria" },
    { Icone: ImageOff, cor: "text-muted-foreground", n: s.semFoto, texto: "sem foto" },
  ].filter((l) => l.n > 0);

  return (
    <section className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
        <Camera className="w-4 h-4" />
        Pinos com foto no mapa
      </h2>

      <ul className="space-y-1 text-xs">
        {linhas.map(({ Icone, cor, n, texto }) => (
          <li key={texto} className="flex items-center gap-2">
            <Icone className={`w-4 h-4 ${cor}`} />
            <span className="tabular-nums font-semibold">{n}</span> ocorrência(s) {texto}
          </li>
        ))}
      </ul>

      {s.bloqueios.map((b) => (
        <p key={b} className="text-xs flex items-start gap-2 text-destructive">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {b}
        </p>
      ))}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        O pino só aparece com foto quando as quatro coisas estão de pé: a saída publicada, a foto
        publicada, a escola com termo de uso de imagem e a escola publicada.
        {!saidaPublicada && s.fotosAguardando > 0 && " Dá para publicar as fotos junto com a saída, no botão de publicar abaixo."}
        {s.semFoto > 0 && " Ocorrência sem foto ganha foto pela linha dela, na tabela de ocorrências acima."}
      </p>

      {saidaPublicada && s.fotosAguardando > 0 && s.bloqueios.length === 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <label className="flex items-start gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={conferiu} onChange={(e) => setConferiu(e.target.checked)} className="mt-0.5" />
            {DECLARACAO_DAS_FOTOS}
          </label>
          <button
            onClick={async () => {
              setPublicando(true);
              await aoPublicarFotos();
              setPublicando(false);
              setConferiu(false);
            }}
            disabled={!conferiu || publicando}
            className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-sm disabled:opacity-50 inline-flex items-center gap-2"
          >
            {publicando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Publicar as {s.fotosAguardando} foto(s) desta saída
          </button>
        </div>
      )}
    </section>
  );
}

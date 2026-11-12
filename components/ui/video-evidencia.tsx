"use client";

import { useEffect, useState } from "react";
import { VideoOff } from "lucide-react";
import { urlAssinadaDaFoto } from "@/lib/dados-escola-publica";

/**
 * Vídeo do Storage por URL assinada — o par do `FotoEvidencia`.
 *
 * Mesmo bucket privado e mesmas políticas: a assinatura só sai se o
 * vídeo estiver publicado, a escola publicada e o termo de imagem
 * registrado. `preload="metadata"` baixa só o começo do arquivo; o vídeo
 * inteiro só vem se a pessoa apertar o play — numa linha do tempo com
 * vários vídeos, baixar todos de uma vez acabaria com o plano de dados
 * de quem olha pelo celular.
 */
export function VideoEvidencia({
  storagePath,
  rotulo,
  className,
}: {
  storagePath: string;
  rotulo: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [negado, setNegado] = useState(false);

  useEffect(() => {
    let ativo = true;
    urlAssinadaDaFoto(storagePath).then((u) => {
      if (!ativo) return;
      if (u) setUrl(u);
      else setNegado(true);
    });
    return () => {
      ativo = false;
    };
  }, [storagePath]);

  if (url) {
    return (
      <video
        src={url}
        controls
        preload="metadata"
        playsInline
        aria-label={rotulo}
        className={className}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-secondary text-muted-foreground ${className ?? ""}`}
      aria-label={negado ? "Vídeo indisponível" : rotulo}
    >
      {negado ? <VideoOff className="w-6 h-6" /> : null}
    </div>
  );
}

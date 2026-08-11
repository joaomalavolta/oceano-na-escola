"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { urlAssinadaDaFoto } from "@/lib/dados-escola-publica";

interface FotoEvidenciaProps {
  storagePath: string;
  alt: string;
  className?: string;
}

/**
 * Foto do Storage por URL assinada.
 *
 * O bucket é privado, então o <img> não pode apontar direto para o
 * caminho: primeiro se pede a assinatura, que só sai se as políticas
 * deixarem — foto curada, escola publicada, termo de imagem. Enquanto
 * a assinatura não chega, um bloco neutro segura o layout; se ela é
 * negada, o bloco fica, com o ícone de imagem indisponível.
 */
export function FotoEvidencia({ storagePath, alt, className }: FotoEvidenciaProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [negada, setNegada] = useState(false);

  useEffect(() => {
    let ativo = true;
    urlAssinadaDaFoto(storagePath).then((u) => {
      if (!ativo) return;
      if (u) setUrl(u);
      else setNegada(true);
    });
    return () => {
      ativo = false;
    };
  }, [storagePath]);

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={className} />;
  }

  return (
    <div
      className={`flex items-center justify-center bg-secondary text-muted-foreground ${className ?? ""}`}
      aria-label={negada ? "Imagem indisponível" : alt}
    >
      {negada ? <ImageOff className="w-6 h-6" /> : null}
    </div>
  );
}

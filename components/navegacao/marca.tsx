"use client";

import { useState } from "react";
import Link from "next/link";
import { Waves } from "lucide-react";

/**
 * A marca no topo: logo do Instituto Ecosurf e o nome da plataforma.
 *
 * É um bloqueio de marca de dois níveis — a instituição responde pela
 * plataforma, e a plataforma tem nome próprio. O traço vertical separa
 * os dois em vez de empilhá-los: "Ecosurf Oceano na Escola" lido de
 * corrido soa como um nome só, que nenhum dos dois é.
 *
 * A logo é o arquivo em `public/logo-ecosurf.svg`. Enquanto ele não
 * existir, entra a onda que já estava aqui — a barra continua inteira
 * em vez de exibir imagem quebrada. Trocar a marca passa a ser só
 * colocar o arquivo no lugar.
 *
 * Fundo escuro: a logo institucional é azul-escuro e sumiria. Se
 * houver `logo-ecosurf-clara.svg`, ela é usada no escuro e as cores da
 * marca ficam preservadas; sem ela, a versão padrão é rebatida em
 * branco por filtro, que é legível mas perde o azul.
 */

interface MarcaProps {
  /** Compacta a marca, para a barra flutuante sobre o mapa. */
  compacta?: boolean;
}

export function Marca({ compacta = false }: MarcaProps) {
  const [semLogo, setSemLogo] = useState(false);
  const [semLogoClara, setSemLogoClara] = useState(false);

  const altura = compacta ? "h-6" : "h-7";

  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 min-w-0 group"
      aria-label="Oceano na Escola — Instituto Ecosurf"
    >
      {semLogo ? (
        <span className="w-7 h-7 rounded-sm bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Waves className="w-4 h-4" />
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-ecosurf.svg"
            alt="Instituto Ecosurf"
            onError={() => setSemLogo(true)}
            className={`${altura} w-auto shrink-0 ${
              semLogoClara ? "dark:brightness-0 dark:invert" : "dark:hidden"
            }`}
          />
          {!semLogoClara && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/logo-ecosurf-clara.svg"
              alt=""
              aria-hidden="true"
              onError={() => setSemLogoClara(true)}
              className={`${altura} w-auto shrink-0 hidden dark:block`}
            />
          )}
        </>
      )}

      {/* O traço só aparece quando há logo: sem ela, separaria a onda do
          nome sem motivo. */}
      {!semLogo && <span className="w-px h-6 bg-border shrink-0" aria-hidden="true" />}

      <span
        className={`font-semibold tracking-tight text-foreground truncate ${
          compacta ? "text-sm" : "text-sm md:text-[15px]"
        }`}
      >
        Oceano na Escola
      </span>
    </Link>
  );
}

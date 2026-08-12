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
 * O arquivo da logo pode chegar em SVG ou PNG, e a marca tenta os dois
 * antes de desistir: quem for colocar o arquivo não deveria precisar
 * converter formato para o header funcionar. Sem nenhum deles, entra a
 * onda que já estava aqui e a barra continua inteira, em vez de exibir
 * imagem quebrada.
 *
 * Fundo escuro: a marca institucional é azul-escuro e sumiria. Se
 * houver uma versão clara, ela é usada no escuro e as cores da marca
 * ficam preservadas; sem ela, a versão padrão é rebatida em branco por
 * filtro, que é legível mas perde o azul do símbolo.
 */

const LOGO = ["/logo-ecosurf.svg", "/logo-ecosurf.png"];
const LOGO_CLARA = ["/logo-ecosurf-clara.svg", "/logo-ecosurf-clara.png"];

interface ImagemProps {
  fontes: string[];
  alt: string;
  className: string;
  onEsgotar: () => void;
}

/** Tenta cada fonte em ordem; avisa quando todas falharem. */
function ImagemComAlternativas({ fontes, alt, className, onEsgotar }: ImagemProps) {
  const [indice, setIndice] = useState(0);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fontes[indice]}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      onError={() => {
        if (indice + 1 < fontes.length) setIndice(indice + 1);
        else onEsgotar();
      }}
      className={className}
    />
  );
}

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
      className="flex items-center gap-2.5 min-w-0"
      aria-label="Oceano na Escola — Instituto Ecosurf"
    >
      {semLogo ? (
        <span className="w-7 h-7 rounded-sm bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Waves className="w-4 h-4" />
        </span>
      ) : (
        <>
          <ImagemComAlternativas
            fontes={LOGO}
            alt="Instituto Ecosurf"
            onEsgotar={() => setSemLogo(true)}
            className={`${altura} w-auto shrink-0 ${
              semLogoClara ? "dark:brightness-0 dark:invert" : "dark:hidden"
            }`}
          />
          {!semLogoClara && (
            <ImagemComAlternativas
              fontes={LOGO_CLARA}
              alt=""
              onEsgotar={() => setSemLogoClara(true)}
              className={`${altura} w-auto shrink-0 hidden dark:block`}
            />
          )}
        </>
      )}

      {/* O traço só aparece com a logo: sem ela, separaria a onda do
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

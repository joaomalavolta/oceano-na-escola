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
 * UM ARQUIVO, APONTADO DIRETO. Antes havia uma cadeia de alternativas —
 * tentava SVG, caía no PNG — para quem fosse colocar a arte não precisar
 * converter formato. A conveniência custava caro: como só o PNG existe,
 * toda carga de página começava pedindo um SVG inexistente, levava 404 e
 * só trocava pelo arquivo certo depois que o React assumisse a página. A
 * marca sumia e voltava, e o instante em que ela voltava dependia de
 * quando a hidratação terminasse, que muda a cada carga. Era essa a
 * piscada. Trocar o formato da arte agora é editar a constante abaixo;
 * é uma linha, contra um 404 por visita, para sempre.
 *
 * UMA ARTE, DOIS FUNDOS. A logo institucional é distribuída em branco
 * vazado, para aplicar sobre foto. Sobre a faixa azul ela vai como foi
 * desenhada, sem filtro. Num fundo claro o filtro a rebate em preto,
 * preservando a transparência: fica monocromático — perde a cor da
 * marca — mas é legível, que é o que o header precisa.
 */

/** A arte em branco vazado. Se um dia chegar uma colorida, troque aqui. */
const LOGO = "/logo-ecosurf-clara.png";

/** Tamanho real do arquivo, para o header não pular quando ele chega. */
const LOGO_LARGURA = 770;
const LOGO_ALTURA = 160;

interface MarcaProps {
  /** Compacta a marca, para a barra flutuante sobre o mapa. */
  compacta?: boolean;
  /**
   * A marca está sobre a faixa azul institucional.
   *
   * Aí o fundo é escuro nos dois temas, e a arte branca serve sem
   * filtro — é a única situação em que a logo aparece exatamente como
   * foi desenhada, em vez de rebatida.
   */
  sobreEscuro?: boolean;
}

export function Marca({ compacta = false, sobreEscuro = false }: MarcaProps) {
  // Só para o caso de o arquivo sumir da pasta: aí entra a onda e a
  // barra continua inteira, em vez de exibir imagem quebrada. Não é
  // mais o caminho de todo dia, como era com a cadeia de alternativas.
  const [semArte, setSemArte] = useState(false);

  const altura = compacta ? "h-6" : "h-7";

  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 min-w-0"
      aria-label="Oceano na Escola — Instituto Ecosurf"
    >
      {semArte ? (
        <span
          className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${
            sobreEscuro ? "bg-white/15 text-white" : "bg-primary text-primary-foreground"
          }`}
        >
          <Waves className="w-4 h-4" />
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO}
            alt="Instituto Ecosurf"
            width={LOGO_LARGURA}
            height={LOGO_ALTURA}
            /* Está acima da dobra em toda página: vale competir por
               banda com o resto. */
            fetchPriority="high"
            onError={() => setSemArte(true)}
            className={`${altura} w-auto shrink-0 ${sobreEscuro ? "" : "brightness-0"}`}
          />

          {/* O traço só aparece com a logo: sem ela, separaria a onda do
              nome sem motivo. */}
          <span
            className={`w-px h-6 shrink-0 ${sobreEscuro ? "bg-white/30" : "bg-border"}`}
            aria-hidden="true"
          />
        </>
      )}

      <span
        className={`font-semibold tracking-tight truncate ${
          sobreEscuro ? "text-white" : "text-foreground"
        } ${compacta ? "text-sm" : "text-sm md:text-[15px]"}`}
      >
        Oceano na Escola
      </span>
    </Link>
  );
}

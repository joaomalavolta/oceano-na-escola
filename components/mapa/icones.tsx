/**
 * Iconografia do Oceano na Escola.
 *
 * O documento de concepção pede uma linguagem própria, "usando o
 * princípio do Green Map sem copiar os ícones protegidos" — e é o que
 * está aqui: glifos flat desenhados para o projeto, no traço geométrico
 * de biblioteca de ícones, nunca emoji. Nada foi baixado de banco de
 * ícones de terceiros: licença de asset alheio não entra em repositório
 * público.
 *
 * O banco é a fonte da verdade dos nomes: protocolo.icone e
 * protocolo_item.icone guardam os slugs deste dicionário. Protocolo novo
 * ganha ícone acrescentando um glifo aqui — ou herda o do protocolo,
 * porque o pin carrega a cor e ela já diz de que família o ponto é.
 *
 * Três peças:
 *   Glifo      — o desenho cru, em currentColor;
 *   IconeBadge — disco colorido com o glifo em branco, para legenda e lista;
 *   PinMapa    — gota de mapa com cauda apontando a coordenada exata,
 *                no estilo dos pins do Ecosurf App e do ZUrb.
 */

import React from "react";

type Tracos = React.ReactNode;

/** Todos os glifos vivem num viewBox 24×24, traço 2, cantos redondos. */
const GLIFOS: Record<string, Tracos> = {
  // ── Protocolos ────────────────────────────────────────────────────
  /** RES — garrafa deitada na linha da areia. */
  residuos: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v3l-3 2.5V17a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8.5L14 6V3" />
      <path d="M7 13h10" />
    </>
  ),
  /** MIC — partículas dispersas em área amostrada. */
  microplasticos: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 3" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="17" cy="17" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  /** RST — broto de restinga na duna. */
  restinga: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6z" />
      <path d="M12 10c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6z" />
      <path d="M4 21c2.5-1.5 5-1.5 8 0 3-1.5 5.5-1.5 8 0" />
    </>
  ),
  /** ESG — cano lançando no corpo d'água. */
  esgoto: (
    <>
      <path d="M3 6h8a2 2 0 0 1 2 2v4" />
      <path d="M3 10h6" />
      <path d="M13 16.5c-.8 1.2-2 1.5-3 1.5" strokeDasharray="0 0" />
      <path d="M13 12l0 2" />
      <path d="M4 20c2-1.2 4-1.2 6 0 2-1.2 4-1.2 6 0 1 .6 2 .9 3 .9" />
    </>
  ),
  /** DES — lixeira barrada: descarte onde não devia. */
  descarte: (
    <>
      <path d="M5 7h14" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" />
      <path d="M4 4l16 16" />
    </>
  ),
  /** AVI — ave costeira em voo. */
  avifauna: (
    <>
      <path d="M2 8c3-2 6-2 8 1 1.5 2 1.5 4 .5 6" />
      <path d="M22 8c-3-2-6-2-8 1-1.5 2-1.5 4-.5 6" />
      <path d="M10.5 15c.5 2 1 3.5 1.5 5 .5-1.5 1-3 1.5-5" />
    </>
  ),
  /** AGU — gota d'água. */
  agua: (
    <>
      <path d="M12 3c4 5 7 8.5 7 12a7 7 0 0 1-14 0c0-3.5 3-7 7-12z" />
      <path d="M9.5 15a3 3 0 0 0 2 2.6" />
    </>
  ),

  // ── Itens de campo — água ─────────────────────────────────────────
  /** Frasco de análise. */
  ph: (
    <>
      <path d="M10 3v6l-4.5 8A2.5 2.5 0 0 0 7.7 21h8.6a2.5 2.5 0 0 0 2.2-4L14 9V3" />
      <path d="M8.5 3h7" />
      <path d="M8 15h8" />
    </>
  ),
  /** Disco de Secchi: metade clara, metade escura. */
  turbidez: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
    </>
  ),
  temperatura: (
    <>
      <path d="M10 4a2 2 0 0 1 4 0v9.5a4.5 4.5 0 1 1-4 0z" />
      <circle cx="12" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  /** Cristais de sal sobre a água. */
  salinidade: (
    <>
      <path d="M8 6l2 2-2 2-2-2z" />
      <path d="M15 4l2 2-2 2-2-2z" />
      <path d="M12 11l2 2-2 2-2-2z" />
      <path d="M3 20c2.5-1.5 5-1.5 7 0 2.5-1.5 5-1.5 7 0 1.2.7 2.5 1 4 .8" />
    </>
  ),

  // ── Itens de campo — avifauna e fauna ─────────────────────────────
  ave: (
    <>
      <path d="M16 5a3 3 0 0 1 3 3v1l2 1-2 1c0 5-3.5 8-8.5 8H4l5-4" />
      <path d="M4 15l7-6c1.5-1.3 3-4 5-4" />
      <circle cx="17.5" cy="7.5" r="0.5" fill="currentColor" stroke="none" />
    </>
  ),
  /** Ninho com ovos. */
  ninho: (
    <>
      <ellipse cx="10" cy="10.5" rx="2" ry="2.6" />
      <ellipse cx="14" cy="10.5" rx="2" ry="2.6" />
      <path d="M4 13c0 4 3.5 7 8 7s8-3 8-7" />
      <path d="M4 13c2.5 1.2 5 1.8 8 1.8s5.5-.6 8-1.8" />
    </>
  ),
  /** Ave com resíduo no bico. */
  "ave-residuo": (
    <>
      <path d="M15 4a3 3 0 0 1 3 3v1l2 1-2 1c0 5-3.5 8-8.5 8H4l5-4" />
      <path d="M4 14l7-6c1.5-1.3 2-4 4-4" />
      <path d="M20 9l3 3" />
      <rect x="19.6" y="10.6" width="3" height="2" rx="0.4" transform="rotate(45 21 11.6)" />
    </>
  ),
  /** Animal encalhado na linha da praia. */
  encalhe: (
    <>
      <path d="M4 12c2.5-3.5 6-5 9-5 2.5 0 4.5 1 6 2.5-1.5 1.5-3.5 2.5-6 2.5-3 0-6.5-1.5-9 0z" />
      <path d="M17 8l3-2-1 4" />
      <path d="M3 19c2.5-1.5 5-1.5 7 0 2.5-1.5 5-1.5 7 0 1.2.7 2.5 1 4 .8" />
    </>
  ),

  // ── Itens de campo — descarte irregular ───────────────────────────
  /** Entulho: blocos empilhados. */
  entulho: (
    <>
      <rect x="4" y="13" width="7" height="5" rx="0.5" />
      <rect x="12.5" y="13" width="7" height="5" rx="0.5" />
      <rect x="8" y="7.5" width="7" height="5" rx="0.5" />
      <path d="M3 21h18" />
    </>
  ),
  /** Móvel descartado: poltrona. */
  volumoso: (
    <>
      <path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <path d="M4 13a2 2 0 0 1 4 0v1h8v-1a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M7 18v2M17 18v2" />
    </>
  ),
  queima: (
    <>
      <path d="M12 3c1 3-3.5 4.5-3.5 8a3.5 3.5 0 0 0 7 0c2 1.5 2.5 3 2.5 5a6 6 0 0 1-12 0c0-5 5-7 6-13z" />
    </>
  ),
  /** Acúmulo: monte de resíduo no terreno. */
  acumulo: (
    <>
      <path d="M3 19h18" />
      <path d="M5 19c0-4 3-8 7-8s7 4 7 8" />
      <path d="M10 8l1-2 1.5 1.5L14 5" />
      <circle cx="10" cy="14.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14" cy="15.5" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),

  // ── Itens de campo — esgoto e drenagem ────────────────────────────
  /** Boca de tubulação vista de frente. */
  tubulacao: (
    <>
      <circle cx="12" cy="10" r="6" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M9 19c1-1.2 2-1.2 3 0 1-1.2 2-1.2 3 0" />
    </>
  ),
  /** Ligação irregular: junção que não devia existir. */
  ligacao: (
    <>
      <path d="M4 8h9a2 2 0 0 1 2 2v10" />
      <path d="M4 12h5" />
      <path d="M15 13h5" />
      <path d="M18 10l3 3-3 3" />
    </>
  ),
  /** Espuma na superfície. */
  espuma: (
    <>
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="14.5" cy="6.5" r="2" />
      <circle cx="12.5" cy="11.5" r="1.5" />
      <path d="M3 17c2.5-1.5 5-1.5 7 0 2.5-1.5 5-1.5 7 0 1.2.7 2.5 1 4 .8" />
    </>
  ),
  /** Córrego contaminado: curso d'água com alerta. */
  corrego: (
    <>
      <path d="M4 5c3 0 3 3 6 3s3-3 6-3 3 3 5 3" />
      <path d="M4 11c3 0 3 3 6 3s3-3 6-3 3 3 5 3" />
      <path d="M12 17v2.5" />
      <circle cx="12" cy="21.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),

  // ── Itens de campo — restinga ─────────────────────────────────────
  /** Supressão: vegetação cortada. */
  "restinga-corte": (
    <>
      <path d="M12 20v-7" />
      <path d="M12 13c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6z" />
      <path d="M12 10c0-3-2-5-5-5.5" strokeDasharray="2 2" />
      <path d="M5 20l14-14" />
      <path d="M19 20L5 6" />
    </>
  ),
  /** Trilha irregular: pegadas na vegetação. */
  trilha: (
    <>
      <ellipse cx="9" cy="6" rx="2" ry="2.8" transform="rotate(-15 9 6)" />
      <ellipse cx="15" cy="12" rx="2" ry="2.8" transform="rotate(15 15 12)" />
      <ellipse cx="9" cy="18" rx="2" ry="2.8" transform="rotate(-15 9 18)" />
    </>
  ),
  /** Espécie invasora: broto com alerta. */
  invasora: (
    <>
      <path d="M9 21v-8" />
      <path d="M9 13c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6z" />
      <path d="M9 10c0-3 2-5.5 5-6" />
      <path d="M18 13v4" />
      <circle cx="18" cy="20" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  /** Aterro: camada despejada sobre o terreno. */
  aterro: (
    <>
      <path d="M3 20h18" />
      <path d="M6 20c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5" />
      <path d="M12 4v6" />
      <path d="M9 7.5L12 10.5 15 7.5" />
    </>
  ),

  // ── Rede ──────────────────────────────────────────────────────────
  /** Escola: capelo de formatura. */
  escola: (
    <>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
      <path d="M22 9v5" />
    </>
  ),
};

/** Item sem glifo próprio herda o do protocolo; sem nenhum, ponto pleno. */
const GENERICO: Tracos = <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" />;

export function temGlifo(slug: string | null | undefined): boolean {
  return Boolean(slug && GLIFOS[slug]);
}

/**
 * Resolve o glifo de uma observação: o do item quando existe, senão o
 * do protocolo. É o mesmo fallback do dado — nem todo item tem ícone.
 */
export function slugDe(
  itemIcone: string | null | undefined,
  protocoloIcone: string | null | undefined
): string | null {
  if (temGlifo(itemIcone)) return itemIcone!;
  if (temGlifo(protocoloIcone)) return protocoloIcone!;
  return null;
}

interface GlifoProps {
  slug: string | null | undefined;
  tamanho?: number;
  className?: string;
}

/** O desenho cru, em currentColor. */
export function Glifo({ slug, tamanho = 16, className }: GlifoProps) {
  const tracos = (slug && GLIFOS[slug]) || GENERICO;
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {tracos}
    </svg>
  );
}

/**
 * A cor da escola no mapa, para pino e legenda.
 *
 * Fica fora de `--primary` de propósito. O primário virou o azul da
 * marca, e o pino da escola pintado com ele encostaria em "Avifauna e
 * fauna costeira" — 12° de matiz de distância, indistinguível no
 * tamanho de um pino. Este é o mesmo azul, bem mais fundo.
 */
export const COR_ESCOLA = "var(--color-escola)";

interface IconeBadgeProps {
  slug: string | null | undefined;
  cor: string | null | undefined;
  tamanho?: number;
  className?: string;
}

/** Disco na cor do protocolo com o glifo em branco. Para legenda e lista. */
export function IconeBadge({ slug, cor, tamanho = 24, className }: IconeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 text-white ${className ?? ""}`}
      style={{ width: tamanho, height: tamanho, backgroundColor: cor ?? "var(--color-primary)" }}
    >
      <Glifo slug={slug} tamanho={Math.round(tamanho * 0.62)} />
    </span>
  );
}

interface PinMapaProps {
  slug: string | null | undefined;
  cor: string | null | undefined;
  /** Largura em px; a altura acompanha a proporção da gota. */
  tamanho?: number;
  className?: string;
}

/**
 * A gota de mapa: disco com anel branco e cauda apontando a coordenada.
 * Use com Marker anchor="bottom" — a ponta é o lugar exato.
 */
export function PinMapa({ slug, cor, tamanho = 30, className }: PinMapaProps) {
  const altura = Math.round(tamanho * (38 / 30));
  return (
    <svg
      width={tamanho}
      height={altura}
      viewBox="0 0 30 38"
      aria-hidden="true"
      className={className}
      style={{ display: "block" }}
    >
      <path
        d="M15 36.5C13 31.5 2 25.5 2 15a13 13 0 1 1 26 0c0 10.5-11 16.5-13 21.5z"
        fill={cor ?? "var(--color-primary)"}
        stroke="#fff"
        strokeWidth={2}
      />
      <g transform="translate(7 7) scale(0.6667)" color="#fff">
        <Glifo slug={slug} tamanho={24} />
      </g>
    </svg>
  );
}

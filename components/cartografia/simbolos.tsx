import type { ReactNode } from "react";

/**
 * Os símbolos da camada social.
 *
 * Ficam separados de `components/mapa/icones.tsx` de propósito: aquele
 * dicionário é amarrado aos slugs gravados em `protocolo_item.icone`, e
 * misturar símbolos que o banco nunca vai conhecer o tornaria um lugar
 * onde não se sabe mais o que é dado e o que é desenho.
 *
 * O traço segue o mesmo desenho do outro conjunto — linha de 1,75 sobre
 * grade de 24 — para que as duas famílias convivam na mesma cartolina
 * sem uma parecer decalque da outra.
 */

const TRACOS: Record<string, ReactNode> = {
  /** Anzol e linha: onde se tira comida ou renda do lugar. */
  pesca: (
    <>
      <path d="M12 3v9" />
      <path d="M12 12a4 4 0 0 1-8 0 4 4 0 0 1 4-4" />
      <path d="M12 3h4" />
      <circle cx="18" cy="17" r="1.2" fill="currentColor" stroke="none" />
      <path d="M15 20c1.5-1.5 4.5-1.5 6 0" />
    </>
  ),
  /** Onda com pessoa: onde se entra na água. */
  banho: (
    <>
      <circle cx="9" cy="6" r="2" />
      <path d="M13 11c-1.5-1.5-3-2-4.5-1.5" />
      <path d="M2 16c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
      <path d="M2 20c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
    </>
  ),
  /** Roda de gente: onde as pessoas se juntam. */
  encontro: (
    <>
      <circle cx="12" cy="12" r="7" strokeDasharray="3 2.5" />
      <circle cx="12" cy="5.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </>
  ),
  /** Trilha com pegadas: por onde se chega. */
  caminho: (
    <>
      <path d="M5 21c3-4 1-7 4-10s2-6 5-8" strokeDasharray="4 3" />
      <circle cx="8" cy="16" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  /** Balão de fala com relógio: o que já existiu e não existe mais. */
  memoria: (
    <>
      <path d="M4 5h16v11H9l-4 4V5z" />
      <circle cx="12" cy="10.5" r="3.2" />
      <path d="M12 8.8v1.9l1.4.9" />
    </>
  ),
  /** Triângulo de atenção: lugar de perigo. */
  perigo: (
    <>
      <path d="M12 3 2 20h20L12 3z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  /** Setas em sentidos opostos sobre uma linha: o que mudou. */
  mudou: (
    <>
      <path d="M3 12h18" />
      <path d="M7 8 3 12l4 4" />
      <path d="M17 16l4-4-4-4" />
      <path d="M9 4v3M15 17v3" strokeDasharray="2 2" />
    </>
  ),
  /** Coração sobre marcador: lugar de que se gosta. */
  gosto: (
    <>
      <path d="M12 21s-7-4.6-7-9.5A3.5 3.5 0 0 1 12 9a3.5 3.5 0 0 1 7 2.5c0 4.9-7 9.5-7 9.5z" />
      <path d="M12 9V3" />
      <path d="M9 5h6" />
    </>
  ),
};

export function temSimboloSocial(slug: string): boolean {
  return slug in TRACOS;
}

/** Desenho sem moldura, no mesmo traço dos ícones de protocolo. */
export function SimboloSocial({
  slug,
  tamanho = 20,
  className,
}: {
  slug: string;
  tamanho?: number;
  className?: string;
}) {
  const tracos = TRACOS[slug];
  if (!tracos) return null;
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {tracos}
    </svg>
  );
}

/**
 * O símbolo dentro de um quadrado, como aparece na legenda impressa.
 *
 * Quadrado, e não círculo: na cartolina o aluno desenha à mão, e
 * quadrado torto ainda parece quadrado. Círculo torto parece erro.
 */
export function SeloSocial({ slug, tamanho = 30 }: { slug: string; tamanho?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center border-2 border-current shrink-0"
      style={{ width: tamanho, height: tamanho }}
    >
      <SimboloSocial slug={slug} tamanho={Math.round(tamanho * 0.6)} />
    </span>
  );
}

import type { Metadata } from "next";

/**
 * A página em si é cliente (lê a rede escolhida da URL e carrega pelo
 * navegador); os metadados moram aqui porque componente cliente não os
 * exporta.
 *
 * `noindex` pela mesma regra da galeria: há foto de turma nesta página,
 * e foto de turma não deve aparecer em busca de imagens. A página
 * continua aberta a quem chega pelo site.
 */
export const metadata: Metadata = {
  title: "Linha do tempo da rede — Oceano na Escola",
  description:
    "As saídas de campo de todas as escolas da rede, da mais recente para a mais antiga, com as fotos publicadas por cada uma.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

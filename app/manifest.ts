import type { MetadataRoute } from "next";

/**
 * Manifesto do PWA.
 *
 * O documento de concepção pede experiência mobile própria para o
 * campo; instalado na tela inicial, o app abre direto no mapa e o
 * professor chega ao /campo em um toque.
 *
 * O ícone é o símbolo do Instituto Ecosurf — o círculo com a onda que
 * faz o "O" da marca — em branco sobre o azul institucional, o mesmo
 * #014D9E da faixa do topo e do valordasondas.org. Tem margem de
 * segurança para o recorte maskable do Android, que come até 10% de
 * cada borda.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oceano na Escola",
    short_name: "Oceano",
    description:
      "Plataforma de Cultura Oceânica e ciência cidadã: escolas mapeando, pesquisando e monitorando o litoral.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f4ef",
    theme_color: "#014D9E",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

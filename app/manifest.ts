import type { MetadataRoute } from "next";

/**
 * Manifesto do PWA.
 *
 * O documento de concepção pede experiência mobile própria para o
 * campo; instalado na tela inicial, o app abre direto no mapa e o
 * professor chega ao /campo em um toque. O ícone tem margem de
 * segurança para o recorte maskable do Android.
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
    theme_color: "#1e6a78",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

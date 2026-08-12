import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProvedorSessao } from "@/lib/sessao";
import { RegistraSw } from "@/components/ui/registra-sw";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oceano na Escola — Mapa Participativo",
  description:
    "Plataforma de ciência cidadã e monitoramento ambiental costeiro organizada a partir de escolas. Instituto Ecosurf, Itanhaém/SP.",
  openGraph: {
    title: "Oceano na Escola",
    description:
      "Mapa participativo de monitoramento ambiental costeiro — Instituto Ecosurf",
    type: "website",
  },
};

/**
 * Os ícones não aparecem aqui de propósito: o Next acha sozinho
 * `app/icon.png`, `app/apple-icon.png` e `app/favicon.ico`, e declará-los
 * duas vezes só criaria uma segunda fonte de verdade para divergir.
 *
 * `themeColor` pinta a barra de endereço do navegador no celular. No
 * azul institucional, a faixa do topo da página e a moldura do navegador
 * viram uma coisa só — que é o que se vê ao abrir a plataforma
 * instalada. Estava sem, e o navegador escolhia sozinho.
 *
 * O viewport saiu do `<head>` escrito à mão e virou este export, que é
 * onde o Next espera encontrá-lo — com as duas formas, sairiam duas
 * tags.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#014D9E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* O overflow é de quem precisa dele. O mapa trava a rolagem no
          próprio container, em tela cheia; travá-la aqui prendia todas as
          outras páginas — formulário, painel, listas — cortadas na altura
          da janela, sem alcance até o botão de salvar. */}
      <body className="min-h-full">
        <ProvedorSessao>{children}</ProvedorSessao>
        <RegistraSw />
      </body>
    </html>
  );
}

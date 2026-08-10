import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}

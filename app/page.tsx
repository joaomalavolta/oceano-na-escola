import dynamic from "next/dynamic";

/**
 * Home pública — Mapa SIG participativo em tela cheia.
 *
 * MapLibre exige o DOM, então o componente principal é carregado
 * dinamicamente sem SSR.
 */
const MapaPublico = dynamic(
  () =>
    import("@/components/mapa/mapa-publico").then((mod) => mod.MapaPublico),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-screen h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando mapa…</span>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  return <MapaPublico />;
}

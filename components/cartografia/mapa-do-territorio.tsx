"use client";

import { useCallback, useRef, useState } from "react";
import MapGL, { Layer, NavigationControl, Source, type MapRef } from "react-map-gl/maplibre";
import { Camera, Loader2 } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

import { ESTILO_SEM_FUNDO, fundoPorId } from "@/lib/mapa-base";
import type { TerritorioCapturado } from "./prancha-territorio";

const SATELITE = fundoPorId("satelite");

/** Itanhaém, que é onde o piloto acontece. */
const CENTRO = { latitude: -24.1875, longitude: -46.8015, zoom: 14 };

interface Props {
  onCapturar: (t: TerritorioCapturado) => void;
  capturado: boolean;
}

/**
 * O mapa de satélite de onde sai a prancha do território.
 *
 * Fixo em satélite: a prancha existe para a turma ver o lugar como ele
 * é, e o mapa de ruas responde outra pergunta.
 *
 * `preserveDrawingBuffer` é o que torna a captura possível. Sem ela o
 * WebGL descarta o buffer depois de pintar e `toDataURL` devolve uma
 * imagem em branco — sem erro nenhum, o que é pior: a folha sairia
 * vazia da impressora e ninguém saberia por quê. Custa memória, e por
 * isso está aqui e não no mapa da rede, que fica aberto o dia todo.
 *
 * Ela vai dentro de `canvasContextAttributes`, e não solta: o MapLibre
 * 5 moveu para lá as opções de contexto WebGL que antes ficavam na
 * raiz. Passada solta, o TypeScript recusa — e em JavaScript seria
 * pior, porque seria ignorada em silêncio e a captura sairia branca.
 */
export function MapaDoTerritorio({ onCapturar, capturado }: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const capturar = useCallback(() => {
    const mapa = mapRef.current?.getMap();
    if (!mapa) return;

    setOcupado(true);
    setErro(null);

    // Espera o mapa parar de carregar tile antes de fotografar, senão a
    // imagem sai com quadrados cinzentos onde o tile ainda não chegou.
    const tirar = () => {
      try {
        const canvas = mapa.getCanvas();
        const imagem = canvas.toDataURL("image/png");

        // Canvas em branco sai como um PNG minúsculo. É o sintoma de
        // buffer descartado, e vale avisar em vez de imprimir vazio.
        if (imagem.length < 5000) {
          setErro(
            "A captura saiu em branco. Recarregue a página e tente de novo, sem trocar de aba enquanto o mapa carrega."
          );
          setOcupado(false);
          return;
        }

        const centro = mapa.getCenter();
        onCapturar({
          imagem,
          lat: centro.lat,
          lng: centro.lng,
          zoom: mapa.getZoom(),
          largura: canvas.width,
          atribuicao: SATELITE.atribuicao.replace(/<[^>]+>/g, ""),
          capturadoEm: new Date().toLocaleDateString("pt-BR"),
        });
        setOcupado(false);
      } catch {
        // SecurityError: o navegador recusa ler um canvas que recebeu
        // imagem de outro domínio sem permissão de CORS. Não há
        // contorno pelo lado do cliente, e fingir que deu certo seria
        // pior — a folha sairia vazia.
        setErro(
          "O navegador não deixou copiar a imagem do mapa. Use a captura de tela do próprio computador e cole no documento da oficina."
        );
        setOcupado(false);
      }
    };

    if (mapa.areTilesLoaded()) tirar();
    else mapa.once("idle", tirar);
  }, [onCapturar]);

  return (
    <div className="space-y-2">
      <div className="relative h-[380px] rounded-md overflow-hidden border border-border">
        <MapGL
          ref={mapRef}
          initialViewState={CENTRO}
          style={{ width: "100%", height: "100%" }}
          mapStyle={ESTILO_SEM_FUNDO}
          canvasContextAttributes={{ preserveDrawingBuffer: true }}
          attributionControl={false}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <Source
            id="fundo-satelite"
            type="raster"
            tiles={SATELITE.tiles}
            tileSize={256}
            maxzoom={SATELITE.maxzoom}
            attribution={SATELITE.atribuicao}
          >
            <Layer id="fundo-satelite-tiles" type="raster" />
          </Source>
        </MapGL>

        <p className="absolute left-2 bottom-2 z-10 px-1.5 py-0.5 text-[10px] bg-background/85 rounded-sm">
          {SATELITE.atribuicao.replace(/<[^>]+>/g, "")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={capturar}
          disabled={ocupado}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm disabled:opacity-50 inline-flex items-center gap-2"
        >
          {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {capturado ? "Capturar de novo" : "Gerar prancha com este enquadramento"}
        </button>
        <p className="text-[11px] text-muted-foreground flex-1 min-w-[220px]">
          Enquadre o trecho da saída — o pedaço de praia onde as equipes vão trabalhar. O que
          estiver na tela é o que sai na folha.
        </p>
      </div>

      {erro && (
        <p className="text-[11px] text-destructive border border-destructive/30 bg-destructive/10 rounded-sm p-2.5">
          {erro}
        </p>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import MapGL, {
  Marker,
  Popup,
  NavigationControl,
  AttributionControl,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import { GraduationCap } from "lucide-react";

import type {
  PubEscola,
  PubObservacaoPontual,
  PubFotoGeorreferenciada,
} from "@/lib/database.types";
import { urlDaFoto } from "@/lib/dados-escola-publica";

const MAP_STYLE: StyleSpecification = {
  version: 8,
  name: "OSM Raster",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }],
};

interface MapaEscolaProps {
  escola: PubEscola;
  ocorrencias: PubObservacaoPontual[];
  fotos: PubFotoGeorreferenciada[];
}

function coordenadas(geojson: string): [number, number] | null {
  try {
    const g = JSON.parse(geojson) as { coordinates?: [number, number] };
    return g.coordinates ?? null;
  } catch {
    return null;
  }
}

/**
 * Mapa do território de uma escola.
 *
 * Componente próprio, e não o MapaPublico: aquele é de tela cheia, com
 * painel de camadas e rodapé de indicadores da rede inteira. Aqui o
 * recorte é uma escola, e o que interessa é onde ela mapeou.
 */
export function MapaEscola({ escola, ocorrencias, fotos }: MapaEscolaProps) {
  const [aberta, setAberta] = useState<PubObservacaoPontual | null>(null);

  // Foto da ocorrência, quando existe, indexada pela posição — é o que
  // amarra o pin à imagem que o documenta.
  const fotoPorPonto = useMemo(() => {
    const mapa = new Map<string, PubFotoGeorreferenciada>();
    for (const f of fotos) mapa.set(f.ponto_geojson, f);
    return mapa;
  }, [fotos]);

  const pins = useMemo(
    () =>
      ocorrencias
        .map((o) => ({ o, xy: coordenadas(o.ponto_geojson) }))
        .filter((p): p is { o: PubObservacaoPontual; xy: [number, number] } => p.xy !== null),
    [ocorrencias]
  );

  const abertaXY = aberta ? coordenadas(aberta.ponto_geojson) : null;
  const fotoAberta = aberta ? fotoPorPonto.get(aberta.ponto_geojson) : undefined;

  return (
    <MapGL
      initialViewState={{ latitude: escola.lat, longitude: escola.lng, zoom: 14 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      attributionControl={false}
    >
      <AttributionControl position="bottom-right" compact />
      <NavigationControl position="top-right" showCompass={false} />

      <Marker latitude={escola.lat} longitude={escola.lng} anchor="bottom">
        <div
          title={escola.nome}
          className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-md"
        >
          <GraduationCap size={18} />
        </div>
      </Marker>

      {pins.map(({ o, xy }) => (
        <Marker
          key={o.id}
          latitude={xy[1]}
          longitude={xy[0]}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setAberta(o);
          }}
        >
          <span
            title={o.item_nome ?? o.descricao}
            className="block w-3.5 h-3.5 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform"
            style={{ backgroundColor: o.protocolo_cor ?? "#a63d40" }}
          />
        </Marker>
      ))}

      {aberta && abertaXY && (
        <Popup
          latitude={abertaXY[1]}
          longitude={abertaXY[0]}
          anchor="bottom"
          onClose={() => setAberta(null)}
          closeButton
          closeOnClick={false}
          maxWidth="260px"
        >
          <div className="space-y-1.5 p-0.5">
            {fotoAberta && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urlDaFoto(fotoAberta.storage_path)}
                alt={fotoAberta.legenda ?? aberta.descricao}
                className="w-full h-28 object-cover rounded-sm"
              />
            )}
            <p className="text-xs font-bold text-foreground">
              {aberta.item_nome ?? aberta.descricao}
            </p>
            {aberta.valor !== null && aberta.item_unidade && (
              <p className="text-xs tabular-nums text-accent font-semibold">
                {aberta.valor.toLocaleString("pt-BR")} {aberta.item_unidade}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">{aberta.protocolo_nome}</p>
            {aberta.origem_provavel && (
              <p className="text-[11px] text-muted-foreground">
                Origem provável: {aberta.origem_provavel}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Expedição #{aberta.expedicao_numero} ·{" "}
              {new Date(aberta.data_campo + "T00:00:00").toLocaleDateString("pt-BR")}
            </p>
          </div>
        </Popup>
      )}
    </MapGL>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import MapGL, {
  Marker,
  Popup,
  NavigationControl,
  AttributionControl,
  type MapRef,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import { PinMapa, slugDe, COR_ESCOLA } from "./icones";
import { PinoAgrupado, composicaoDoGrupo, resumoDoGrupo } from "./pino-agrupado";
import { agruparPorProximidade, pontoDe as coordenadas } from "@/lib/agrupamento";

import type {
  PubEscola,
  PubObservacaoPontual,
  PubFotoGeorreferenciada,
} from "@/lib/database.types";
import { FotoEvidencia } from "@/components/ui/foto-evidencia";

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

const ZOOM_INICIAL = 14;

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

  // O mesmo agrupamento do mapa público: a escola do piloto concentra
  // as ocorrências num trecho curto, e sobrepostas elas se escondem.
  const [zoom, setZoom] = useState(ZOOM_INICIAL);
  const mapRef = useRef<MapRef>(null);

  const grupos = useMemo(
    () => agruparPorProximidade(ocorrencias, (o) => coordenadas(o.ponto_geojson), zoom),
    [ocorrencias, zoom]
  );

  const abertaXY = aberta ? coordenadas(aberta.ponto_geojson) : null;
  const fotoAberta = aberta ? fotoPorPonto.get(aberta.ponto_geojson) : undefined;

  return (
    <MapGL
      ref={mapRef}
      initialViewState={{ latitude: escola.lat, longitude: escola.lng, zoom: ZOOM_INICIAL }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      attributionControl={false}
      onZoomEnd={(e) => setZoom(e.viewState.zoom)}
    >
      <AttributionControl position="bottom-right" compact />
      <NavigationControl position="top-right" showCompass={false} />

      <Marker latitude={escola.lat} longitude={escola.lng} anchor="bottom">
        <div title={escola.nome}>
          <PinMapa slug="escola" cor={COR_ESCOLA} tamanho={34} className="drop-shadow-md" />
        </div>
      </Marker>

      {grupos.map((grupo) => {
        if (grupo.itens.length > 1) {
          const fatias = composicaoDoGrupo(grupo.itens);
          return (
            <Marker
              key={`gr-${grupo.chave}`}
              latitude={grupo.lat}
              longitude={grupo.lng}
              anchor="center"
            >
              <PinoAgrupado
                quantidade={grupo.itens.length}
                fatias={fatias}
                titulo={`${grupo.itens.length} ocorrências: ${resumoDoGrupo(fatias)}. Clique para aproximar.`}
                onClick={() =>
                  mapRef.current?.easeTo({
                    center: [grupo.lng, grupo.lat],
                    zoom: (mapRef.current.getZoom() ?? ZOOM_INICIAL) + 2.5,
                  })
                }
              />
            </Marker>
          );
        }

        const o = grupo.itens[0];
        return (
          <Marker
            key={o.id}
            latitude={grupo.lat}
            longitude={grupo.lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setAberta(o);
            }}
          >
            <div title={o.item_nome ?? o.descricao} className="cursor-pointer">
              <PinMapa
                slug={slugDe(o.item_icone, o.protocolo_icone)}
                cor={o.protocolo_cor ?? "#a63d40"}
                tamanho={28}
                className="drop-shadow-md hover:scale-110 transition-transform origin-bottom"
              />
            </div>
          </Marker>
        );
      })}

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
              <FotoEvidencia
                storagePath={fotoAberta.storage_path}
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

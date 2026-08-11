"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import MapGL, {
  Source,
  Layer,
  Popup,
  Marker,
  NavigationControl,
  AttributionControl,
  type MapRef,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import { Loader2, AlertTriangle, SearchX, GraduationCap } from "lucide-react";
import Link from "next/link";

import {
  carregarDadosPublicos,
  municipiosDe,
  protocolosDe,
  type DadosPublicos,
} from "@/lib/dados-publicos";
import {
  mockEscolas,
  mockGrade,
  mockIndicadoresEscola,
  mockIndicadoresGerais,
  hexDensidade,
  PROTOCOLO_PADRAO,
} from "@/lib/mapa-publico";
import type { PubObservacaoGrade } from "@/lib/database.types";
import { BarraSuperior } from "./barra-superior";
import { PainelCamadas, type CamadasState, type FiltrosState } from "./painel-camadas";
import { FaixaIndicadores } from "./faixa-indicadores";
import { PopupCelula } from "./popup-celula";
import { LegendaDensidade } from "./legenda-densidade";
import { MobileSheet } from "./mobile-sheet";
import { NavegacaoMobile } from "./navegacao-mobile";

// ── Constantes ───────────────────────────────────────────────────────

const ITANHAEM_CENTER = { longitude: -46.79, latitude: -24.18 };
const INITIAL_ZOOM = 13;

/** MapLibre style spec com tiles raster do OSM */
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
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// ── Tipos internos ──────────────────────────────────────────────────

interface PopupInfo {
  latitude: number;
  longitude: number;
  celula: PubObservacaoGrade;
  escolaNome: string;
}

// ── Componente ──────────────────────────────────────────────────────

export function MapaPublico() {
  const mapRef = useRef<MapRef>(null);

  // Estado do mapa
  const [carregando, setCarregando] = useState(true);
  const [erroTiles, setErroTiles] = useState(false);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  // Dados públicos. Partem do mock e são substituídos pelo banco assim
  // que a consulta volta, para o mapa nunca renderizar vazio.
  const [dados, setDados] = useState<DadosPublicos>({
    escolas: mockEscolas,
    grade: mockGrade,
    indicadoresEscola: mockIndicadoresEscola,
    indicadoresGerais: mockIndicadoresGerais,
    origem: "mock",
    erro: null,
  });

  useEffect(() => {
    let ativo = true;
    carregarDadosPublicos().then((d) => {
      if (ativo) setDados(d);
    });
    return () => {
      ativo = false;
    };
  }, []);

  // Camadas
  const [camadas, setCamadas] = useState<CamadasState>({
    residuos: true,
    microplasticos: false,
    escolas: true,
    expedicoes: false,
  });

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosState>({
    municipio: "",
    escola: "",
    protocolo: "",
    mesInicio: "",
    mesFim: "",
  });

  const toggleCamada = useCallback((key: keyof CamadasState) => {
    setCamadas((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const changeFiltro = useCallback(
    (campo: keyof FiltrosState, valor: string) => {
      setFiltros((prev) => ({ ...prev, [campo]: valor }));
      setPopupInfo(null);
    },
    []
  );

  // ── Dados filtrados ─────────────────────────────────────────────

  const gradeFiltrada = useMemo(() => {
    return dados.grade.filter((g) => {
      if (filtros.municipio) {
        const escola = dados.escolas.find((e) => e.slug === g.escola_slug);
        if (escola?.municipio !== filtros.municipio) return false;
      }
      if (filtros.escola && g.escola_slug !== filtros.escola) return false;
      if (filtros.protocolo && g.protocolo !== filtros.protocolo) return false;
      if (filtros.mesInicio && g.mes < filtros.mesInicio) return false;
      if (filtros.mesFim && g.mes > filtros.mesFim + "-31") return false;

      // Filtra por camada de protocolo
      if (g.protocolo === "RES" && !camadas.residuos) return false;
      if (g.protocolo === "MIC" && !camadas.microplasticos) return false;

      return true;
    });
  }, [dados.grade, dados.escolas, filtros, camadas.residuos, camadas.microplasticos]);

  const escolasFiltradas = useMemo(() => {
    return dados.escolas.filter((e) => {
      if (filtros.municipio && e.municipio !== filtros.municipio) return false;
      if (filtros.escola && e.slug !== filtros.escola) return false;
      return true;
    });
  }, [dados.escolas, filtros.municipio, filtros.escola]);

  // ── GeoJSON para as células ────────────────────────────────────

  const gradeGeoJson = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: gradeFiltrada.map((g, i) => {
        const geometry = JSON.parse(g.celula_geojson);
        return {
          type: "Feature" as const,
          id: i,
          geometry,
          properties: {
            idx: i,
            densidade: g.densidade_itens_m2 ?? 0,
            cor: hexDensidade(g.densidade_itens_m2, g.protocolo),
            totalItens: g.total_itens,
            areaAmostrada: g.area_amostrada_m2,
            mes: g.mes,
            escolaSlug: g.escola_slug,
          },
        };
      }),
    };
  }, [gradeFiltrada]);

  // ── Handlers ──────────────────────────────────────────────────

  const onMapLoad = useCallback(() => {
    setCarregando(false);
  }, []);

  const onMapError = useCallback(() => {
    setErroTiles(true);
    setCarregando(false);
  }, []);

  const onCelulaClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties;
      if (!props) return;

      const celula = gradeFiltrada[props.idx];
      if (!celula) return;

      const escola = dados.escolas.find((es) => es.slug === celula.escola_slug);

      // Centróide do polígono
      const geom = JSON.parse(celula.celula_geojson);
      const coords = geom.coordinates[0] as number[][];
      const centLng =
        coords.reduce((s: number, c: number[]) => s + c[0], 0) / (coords.length - 1);
      const centLat =
        coords.reduce((s: number, c: number[]) => s + c[1], 0) / (coords.length - 1);

      setPopupInfo({
        latitude: centLat,
        longitude: centLng,
        celula,
        escolaNome: escola?.nome ?? "Escola não identificada",
      });
    },
    [gradeFiltrada, dados.escolas]
  );

  // ── Cursor interativo na camada ───────────────────────────────

  const onMouseEnterCelula = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = "pointer";
    }
  }, []);

  const onMouseLeaveCelula = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = "";
    }
  }, []);

  // ── Listas para filtros ────────────────────────────────────────

  // Protocolo que a legenda deve descrever. O filtro manda; sem ele,
  // vale a camada ligada. Com as duas ligadas não há escala honesta que
  // sirva para ambas, e a de resíduos é o padrão.
  const protocoloExibido = useMemo(() => {
    if (filtros.protocolo) return filtros.protocolo;
    if (camadas.microplasticos && !camadas.residuos) return "MIC";
    return PROTOCOLO_PADRAO;
  }, [filtros.protocolo, camadas.microplasticos, camadas.residuos]);

  const listaMunicipios = useMemo(() => municipiosDe(dados.escolas), [dados.escolas]);
  const listaProtocolos = useMemo(() => protocolosDe(dados.grade), [dados.grade]);
  const listaEscolas = useMemo(
    () => dados.escolas.map((e) => ({ slug: e.slug, nome: e.nome })),
    [dados.escolas]
  );

  // Verifica se filtro ativo não tem resultados
  const filtroAtivo =
    filtros.municipio || filtros.escola || filtros.protocolo || filtros.mesInicio || filtros.mesFim;
  const semResultado = filtroAtivo && gradeFiltrada.length === 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Mapa em tela cheia */}
      <MapGL
        ref={mapRef}
        initialViewState={{
          ...ITANHAEM_CENTER,
          zoom: INITIAL_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        onLoad={onMapLoad}
        onError={onMapError}
        interactiveLayerIds={["celulas-fill"]}
        onClick={onCelulaClick}
        onMouseEnter={onMouseEnterCelula}
        onMouseLeave={onMouseLeaveCelula}
        attributionControl={false}
      >
        <AttributionControl position="bottom-right" compact />
        <NavigationControl position="top-right" showCompass={false} />

        {/* Camada: Células de densidade */}
        <Source id="grade" type="geojson" data={gradeGeoJson}>
          <Layer
            id="celulas-fill"
            type="fill"
            paint={{
              "fill-color": ["get", "cor"],
              "fill-opacity": 0.6,
            }}
          />
          <Layer
            id="celulas-outline"
            type="line"
            paint={{
              "line-color": ["get", "cor"],
              "line-width": 1,
              "line-opacity": 0.8,
            }}
          />
        </Source>

        {/* Camada: Escolas */}
        {camadas.escolas &&
          escolasFiltradas.map((escola) => (
            <Marker
              key={escola.id}
              latitude={escola.lat}
              longitude={escola.lng}
              anchor="bottom"
            >
              <Link
                href={`/escola/${escola.slug}`}
                title={escola.nome}
                className="group flex flex-col items-center"
              >
                <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-md group-hover:scale-110 transition-transform">
                  <GraduationCap size={18} />
                </div>
                <div className="mt-0.5 px-1.5 py-0.5 rounded-sm bg-glass-bg backdrop-blur-sm border border-glass-border text-[10px] font-medium text-foreground max-w-[120px] truncate">
                  {escola.nome.split(" ").slice(0, 3).join(" ")}
                </div>
              </Link>
            </Marker>
          ))}

        {/* Popup da célula */}
        {popupInfo && (
          <Popup
            latitude={popupInfo.latitude}
            longitude={popupInfo.longitude}
            closeOnClick={false}
            onClose={() => setPopupInfo(null)}
            maxWidth="280px"
            anchor="bottom"
          >
            <PopupCelula
              densidade={popupInfo.celula.densidade_itens_m2}
              totalItens={popupInfo.celula.total_itens}
              areaAmostrada={popupInfo.celula.area_amostrada_m2}
              mes={popupInfo.celula.mes}
              escolaNome={popupInfo.escolaNome}
              escolaSlug={popupInfo.celula.escola_slug}
            />
          </Popup>
        )}
      </MapGL>

      {/* ── Painéis flutuantes ─────────────────────────────────────── */}

      <BarraSuperior />

      {/* Desktop: painel lateral */}
      <div className="hidden md:block">
        <PainelCamadas
          camadas={camadas}
          onToggleCamada={toggleCamada}
          filtros={filtros}
          onChangeFiltro={changeFiltro}
          municipios={listaMunicipios}
          escolas={listaEscolas}
          protocolos={listaProtocolos}
        />
      </div>

      {/* Desktop: legenda */}
      <div className="hidden md:block">
        <LegendaDensidade protocolo={protocoloExibido} />
      </div>

      {/* Indicadores no rodapé */}
      <FaixaIndicadores dados={dados.indicadoresGerais} />

      {/* Mobile: sheet + nav */}
      <MobileSheet
        camadas={camadas}
        onToggleCamada={toggleCamada}
        filtros={filtros}
        onChangeFiltro={changeFiltro}
        municipios={listaMunicipios}
        escolas={listaEscolas}
        protocolos={listaProtocolos}
      />
      <NavegacaoMobile />

      {/* ── Estados ──────────────────────────────────────────────────── */}

      {/* Carregando */}
      {carregando && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Carregando mapa…
            </span>
          </div>
        </div>
      )}

      {/* Erro de tiles */}
      {erroTiles && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 max-w-xs text-center">
            <AlertTriangle size={36} className="text-destructive" />
            <span className="text-sm font-semibold">
              Erro ao carregar o mapa
            </span>
            <p className="text-xs text-muted-foreground">
              Não foi possível carregar os tiles do OpenStreetMap. Verifique
              sua conexão.
            </p>
            <button
              onClick={() => {
                setErroTiles(false);
                setCarregando(true);
                window.location.reload();
              }}
              className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Filtro sem resultado */}
      {semResultado && !carregando && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="flex flex-col items-center gap-2 bg-glass-bg backdrop-blur-xl border border-glass-border rounded-sm px-6 py-4 text-center">
            <SearchX size={28} className="text-muted-foreground" />
            <span className="text-sm font-medium">
              Nenhuma observação neste filtro
            </span>
            <button
              onClick={() =>
                setFiltros({
                  municipio: "",
                  escola: "",
                  protocolo: "",
                  mesInicio: "",
                  mesFim: "",
                })
              }
              className="text-xs text-primary hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

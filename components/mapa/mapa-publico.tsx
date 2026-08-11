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
  PROTOCOLOS_INICIAIS,
  type DadosPublicos,
} from "@/lib/dados-publicos";
import {
  mockEscolas,
  mockGrade,
  mockIndicadoresEscola,
  mockIndicadoresGerais,
  hexDensidade,
  escalaDe,
  PROTOCOLO_PADRAO,
} from "@/lib/mapa-publico";
import type { PubObservacaoGrade, PubObservacaoPontual } from "@/lib/database.types";
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
    protocolos: PROTOCOLOS_INICIAIS,
    pontuais: [],
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

  // Camadas. Guardamos só o que o visitante desligou, e derivamos o
  // resto: protocolo novo no banco nasce ligado, sem effect semeando
  // estado a cada carga de dados.
  const [protocolosDesligados, setProtocolosDesligados] = useState<string[]>([]);
  const [outrasCamadas, setOutrasCamadas] = useState({ escolas: true, ocorrencias: true });

  const camadas = useMemo<CamadasState>(
    () => ({
      protocolos: Object.fromEntries(
        dados.protocolos.map((p) => [p.codigo, !protocolosDesligados.includes(p.codigo)])
      ),
      ...outrasCamadas,
    }),
    [dados.protocolos, protocolosDesligados, outrasCamadas]
  );

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosState>({
    municipio: "",
    escola: "",
    protocolo: "",
    mesInicio: "",
    mesFim: "",
  });

  const toggleCamada = useCallback((key: "escolas" | "ocorrencias") => {
    setOutrasCamadas((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleProtocolo = useCallback((codigo: string) => {
    setProtocolosDesligados((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]
    );
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

      // A camada manda. Protocolo desconhecido fica oculto em vez de
      // escapar dos testes e aparecer sempre, como acontecia com os
      // dois booleanos fixos.
      return camadas.protocolos[g.protocolo] === true;
    });
  }, [dados.grade, dados.escolas, filtros, camadas.protocolos]);

  const pontuaisFiltrados = useMemo(() => {
    if (!camadas.ocorrencias) return [] as PubObservacaoPontual[];
    return dados.pontuais.filter((o) => {
      if (filtros.municipio) {
        const escola = dados.escolas.find((e) => e.slug === o.escola_slug);
        if (escola?.municipio !== filtros.municipio) return false;
      }
      if (filtros.escola && o.escola_slug !== filtros.escola) return false;
      if (filtros.protocolo && o.protocolo !== filtros.protocolo) return false;
      if (filtros.mesInicio && o.data_campo < filtros.mesInicio + "-01") return false;
      if (filtros.mesFim && o.data_campo > filtros.mesFim + "-31") return false;
      return camadas.protocolos[o.protocolo] === true;
    });
  }, [dados.pontuais, dados.escolas, filtros, camadas.protocolos, camadas.ocorrencias]);

  const escolasFiltradas = useMemo(() => {
    return dados.escolas.filter((e) => {
      if (filtros.municipio && e.municipio !== filtros.municipio) return false;
      if (filtros.escola && e.slug !== filtros.escola) return false;
      return true;
    });
  }, [dados.escolas, filtros.municipio, filtros.escola]);

  // Escala por protocolo: a curada quando existe, senão derivada dos
  // valores observados. A cor vem de `protocolo.cor`, no banco.
  const escalas = useMemo(() => {
    const mapa = new Map<string, ReturnType<typeof escalaDe>>();
    for (const p of dados.protocolos) {
      const valores = dados.grade
        .filter((g) => g.protocolo === p.codigo)
        .map((g) => g.densidade_itens_m2 ?? 0);
      mapa.set(p.codigo, escalaDe(p.codigo, p.cor, valores));
    }
    return mapa;
  }, [dados.protocolos, dados.grade]);

  const escalaPadrao = useMemo(() => escalaDe(PROTOCOLO_PADRAO), []);

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
            cor: hexDensidade(
              g.densidade_itens_m2,
              escalas.get(g.protocolo) ?? escalaPadrao
            ),
            totalItens: g.total_itens,
            areaAmostrada: g.area_amostrada_m2,
            mes: g.mes,
            escolaSlug: g.escola_slug,
          },
        };
      }),
    };
  }, [gradeFiltrada, escalas, escalaPadrao]);

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
  // A legenda descreve um protocolo por vez. Com o filtro, ele manda;
  // sem filtro, vale a única camada de densidade ligada. Com mais de uma,
  // não há escala honesta que sirva às duas — cai no padrão.
  const protocoloExibido = useMemo(() => {
    if (filtros.protocolo) return filtros.protocolo;
    const densidadesLigadas = dados.protocolos.filter(
      (p) => p.forma_agregacao === "densidade" && camadas.protocolos[p.codigo]
    );
    return densidadesLigadas.length === 1 ? densidadesLigadas[0].codigo : PROTOCOLO_PADRAO;
  }, [filtros.protocolo, dados.protocolos, camadas.protocolos]);

  const listaMunicipios = useMemo(() => municipiosDe(dados.escolas), [dados.escolas]);
  const listaProtocolos = useMemo(
    () =>
      dados.protocolos.map((p) => ({
        codigo: p.codigo,
        nome: p.nome,
        cor: p.cor,
        forma_agregacao: p.forma_agregacao,
      })),
    [dados.protocolos]
  );
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

        {/* Camada: Ocorrências ambientais, em coordenada exata.
            Cor e magnitude vêm do protocolo e do item, no banco. */}
        {pontuaisFiltrados.map((o) => {
          const ponto = JSON.parse(o.ponto_geojson) as { coordinates: [number, number] };
          const [lng, lat] = ponto.coordinates;
          const cor = o.protocolo_cor ?? "#a63d40";
          const magnitude =
            o.valor !== null && o.item_unidade
              ? `${o.valor.toLocaleString("pt-BR")} ${o.item_unidade}`
              : null;

          return (
            <Marker key={`oc-${o.id}`} latitude={lat} longitude={lng} anchor="center">
              <div
                className="group relative flex items-center justify-center"
                title={`${o.item_nome ?? o.descricao}${magnitude ? ` — ${magnitude}` : ""} · ${o.escola_nome}`}
              >
                <span
                  className="block w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-125"
                  style={{ backgroundColor: cor }}
                />
                <div className="pointer-events-none absolute bottom-5 hidden group-hover:block whitespace-nowrap px-2 py-1 rounded-sm bg-glass-bg backdrop-blur-sm border border-glass-border text-[10px] font-medium text-foreground shadow-lg z-10">
                  <strong>{o.item_nome ?? o.descricao}</strong>
                  {magnitude && <span className="ml-1 tabular-nums">{magnitude}</span>}
                  <span className="block text-muted-foreground">{o.protocolo_nome}</span>
                </div>
              </div>
            </Marker>
          );
        })}

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
          onToggleProtocolo={toggleProtocolo}
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
        <LegendaDensidade
          protocolo={protocoloExibido}
          nome={dados.protocolos.find((p) => p.codigo === protocoloExibido)?.nome}
          unidade={dados.protocolos.find((p) => p.codigo === protocoloExibido)?.unidade_medida}
          escala={escalas.get(protocoloExibido) ?? escalaPadrao}
        />
      </div>

      {/* Indicadores no rodapé */}
      <FaixaIndicadores dados={dados.indicadoresGerais} />

      {/* Mobile: sheet + nav */}
      <MobileSheet
        camadas={camadas}
        onToggleProtocolo={toggleProtocolo}
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

"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import MapGL, {
  Source,
  Layer,
  Popup,
  Marker,
  NavigationControl,
  GeolocateControl,
  AttributionControl,
  type MapRef,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import { Loader2, AlertTriangle, SearchX } from "lucide-react";
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
  mockPontuais,
  mockIndicadoresEscola,
  mockIndicadoresGerais,
  hexDensidade,
  escalaDe,
  PROTOCOLO_PADRAO,
} from "@/lib/mapa-publico";
import type { PubObservacaoGrade, PubObservacaoPontual } from "@/lib/database.types";
import { ESTILO_SEM_FUNDO, fundoPorId, fundoSalvo, salvaFundo } from "@/lib/mapa-base";
import { agruparPorProximidade, pontoDe } from "@/lib/agrupamento";
import { PinMapa, slugDe, COR_ESCOLA } from "./icones";
import { PinoAgrupado, composicaoDoGrupo, resumoDoGrupo } from "./pino-agrupado";
import { SeletorFundo } from "./seletor-fundo";
import { BarraSuperior } from "./barra-superior";
import { PainelCamadas, type CamadasState, type FiltrosState } from "./painel-camadas";
import { FaixaIndicadores } from "./faixa-indicadores";
import { PopupCelula } from "./popup-celula";
import { MobileSheet } from "./mobile-sheet";
import { NavegacaoMobile } from "./navegacao-mobile";

// ── Constantes ───────────────────────────────────────────────────────

const ITANHAEM_CENTER = { longitude: -46.79, latitude: -24.18 };
const INITIAL_ZOOM = 13;

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

  // Mapa de fundo, lido já na inicialização do estado. Dá para fazer
  // isso aqui porque a página carrega este componente com ssr: false —
  // ele nunca renderiza no servidor, então não há hidratação para
  // divergir. Buscar em effect obrigaria a pintar o fundo padrão antes
  // de trocar pelo escolhido, com um piscar de tiles a cada visita.
  const [fundoId, setFundoId] = useState<string>(fundoSalvo);
  const fundo = fundoPorId(fundoId);

  const escolherFundo = useCallback((id: string) => {
    setFundoId(id);
    salvaFundo(id);
  }, []);

  // Zoom só para o agrupamento dos pinos. Atualizado no fim do gesto e
  // não a cada quadro: a grade é em graus, então arrastar não muda
  // agrupamento nenhum — só aproximar muda.
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  // O enquadramento, para a lista e as contagens acompanharem o mapa.
  // Diferente do zoom, este muda ao arrastar — por isso é lido no fim
  // do movimento, e não durante.
  const [vista, setVista] = useState<[number, number, number, number] | null>(null);

  const lerVista = useCallback(() => {
    const b = mapRef.current?.getBounds();
    if (b) setVista([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
  }, []);

  const dentroDaVista = useCallback(
    (geojson: string) => {
      if (!vista) return true;
      const xy = pontoDe(geojson);
      if (!xy) return false;
      const [lng, lat] = xy;
      return lng >= vista[0] && lng <= vista[2] && lat >= vista[1] && lat <= vista[3];
    },
    [vista]
  );

  // Dados públicos. Partem do mock e são substituídos pelo banco assim
  // que a consulta volta, para o mapa nunca renderizar vazio.
  const [dados, setDados] = useState<DadosPublicos>({
    escolas: mockEscolas,
    grade: mockGrade,
    indicadoresEscola: mockIndicadoresEscola,
    indicadoresGerais: mockIndicadoresGerais,
    protocolos: PROTOCOLOS_INICIAIS,
    pontuais: mockPontuais,
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

  /** Município de uma escola, por slug — usado pelos dois filtros. */
  const municipioDaEscola = useCallback(
    (slug: string) => dados.escolas.find((e) => e.slug === slug)?.municipio,
    [dados.escolas]
  );

  /**
   * Os filtros do painel, sem o liga-desliga das camadas.
   *
   * Separado porque as contagens do painel precisam justamente do que
   * está desligado: o número existe para decidir se vale ligar a camada,
   * e zeraria no momento em que é mais útil.
   */
  const gradeSemCamada = useMemo(() => {
    return dados.grade.filter((g) => {
      if (filtros.municipio && municipioDaEscola(g.escola_slug) !== filtros.municipio) return false;
      if (filtros.escola && g.escola_slug !== filtros.escola) return false;
      if (filtros.protocolo && g.protocolo !== filtros.protocolo) return false;
      if (filtros.mesInicio && g.mes < filtros.mesInicio) return false;
      if (filtros.mesFim && g.mes > filtros.mesFim + "-31") return false;
      return true;
    });
  }, [dados.grade, filtros, municipioDaEscola]);

  const pontuaisSemCamada = useMemo(() => {
    return dados.pontuais.filter((o) => {
      if (filtros.municipio && municipioDaEscola(o.escola_slug) !== filtros.municipio) return false;
      if (filtros.escola && o.escola_slug !== filtros.escola) return false;
      if (filtros.protocolo && o.protocolo !== filtros.protocolo) return false;
      if (filtros.mesInicio && o.data_campo < filtros.mesInicio + "-01") return false;
      if (filtros.mesFim && o.data_campo > filtros.mesFim + "-31") return false;
      return true;
    });
  }, [dados.pontuais, filtros, municipioDaEscola]);

  // A camada manda no que o mapa desenha. Protocolo desconhecido fica
  // oculto em vez de escapar dos testes e aparecer sempre, como
  // acontecia com os dois booleanos fixos.
  const gradeFiltrada = useMemo(
    () => gradeSemCamada.filter((g) => camadas.protocolos[g.protocolo] === true),
    [gradeSemCamada, camadas.protocolos]
  );

  const pontuaisFiltrados = useMemo(() => {
    if (!camadas.ocorrencias) return [] as PubObservacaoPontual[];
    return pontuaisSemCamada.filter((o) => camadas.protocolos[o.protocolo] === true);
  }, [pontuaisSemCamada, camadas.protocolos, camadas.ocorrencias]);

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

  /** Ocorrências agrupadas por proximidade, no zoom atual. */
  const gruposDeOcorrencia = useMemo(
    () => agruparPorProximidade(pontuaisFiltrados, (o) => pontoDe(o.ponto_geojson), zoom),
    [pontuaisFiltrados, zoom]
  );

  /** Aproxima até o grupo se desfazer, centrando nele. */
  const abrirGrupo = useCallback((lat: number, lng: number) => {
    mapRef.current?.easeTo({ center: [lng, lat], zoom: (mapRef.current.getZoom() ?? 13) + 2.5 });
  }, []);

  /** Ocorrências no enquadramento, que é o que a lista mostra. */
  const ocorrenciasNaVista = useMemo(
    () =>
      pontuaisFiltrados
        .filter((o) => dentroDaVista(o.ponto_geojson))
        .sort((a, b) => b.data_campo.localeCompare(a.data_campo)),
    [pontuaisFiltrados, dentroDaVista]
  );

  /**
   * Quantas feições cada protocolo tem sob os filtros atuais.
   *
   * Conta o que o protocolo desenha: célula para os de densidade, pino
   * para os de ocorrência.
   *
   * Duas decisões de escopo, e as duas são deliberadas. Ignora o
   * liga-desliga da camada, porque o número existe para decidir se vale
   * ligar e zeraria justamente quando é mais útil. E conta a rede
   * inteira sob os filtros, não só o enquadramento — a lista já é o
   * recorte do que está à vista, e um número que muda a cada arrasto
   * não serviria para decidir nada.
   */
  const contagens = useMemo(() => {
    const conta: Record<string, number> = {};
    for (const g of gradeSemCamada) conta[g.protocolo] = (conta[g.protocolo] ?? 0) + 1;
    for (const o of pontuaisSemCamada) conta[o.protocolo] = (conta[o.protocolo] ?? 0) + 1;
    return conta;
  }, [gradeSemCamada, pontuaisSemCamada]);

  /** Leva o mapa até a ocorrência escolhida na lista. */
  const irParaOcorrencia = useCallback((o: PubObservacaoPontual) => {
    const xy = pontoDe(o.ponto_geojson);
    if (!xy) return;
    mapRef.current?.easeTo({ center: xy, zoom: Math.max(mapRef.current.getZoom() ?? 16, 17) });
  }, []);

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

  // Guardado fora do estado: só o handler de erro precisa saber, e
  // mudar estado a cada tile faltando causaria um render por tile.
  const jaCarregou = useRef(false);

  const onMapLoad = useCallback(() => {
    jaCarregou.current = true;
    setCarregando(false);
    // Primeira leitura do enquadramento: sem ela a lista começaria com a
    // rede inteira e só se ajustaria no primeiro arrasto.
    lerVista();
  }, [lerVista]);

  /**
   * Erro depois que o mapa já subiu não derruba a tela.
   *
   * O `onError` do MapLibre dispara para cada tile que falha, e tile
   * faltando é rotina — mais ainda em satélite, onde nem todo canto tem
   * imagem no zoom máximo. Tratar isso como falha geral fazia um buraco
   * de imagem virar "Erro ao carregar o mapa" em tela cheia, com o
   * overlay bloqueando o mapa inteiro que estava ali, funcionando.
   *
   * O aviso fica para o que ele descreve de fato: o mapa não subiu.
   */
  const onMapError = useCallback(() => {
    if (jaCarregou.current) return;
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

  const listaMunicipios = useMemo(() => municipiosDe(dados.escolas), [dados.escolas]);
  const listaProtocolos = useMemo(
    () =>
      dados.protocolos.map((p) => ({
        codigo: p.codigo,
        nome: p.nome,
        cor: p.cor,
        icone: p.icone,
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
        mapStyle={ESTILO_SEM_FUNDO}
        onLoad={onMapLoad}
        onError={onMapError}
        onZoomEnd={(e) => setZoom(e.viewState.zoom)}
        onMoveEnd={lerVista}
        interactiveLayerIds={["celulas-fill"]}
        onClick={onCelulaClick}
        onMouseEnter={onMouseEnterCelula}
        onMouseLeave={onMouseLeaveCelula}
        attributionControl={false}
      >
        <AttributionControl position="bottom-right" compact />
        <NavigationControl position="top-right" showCompass={false} />
        {/* "Onde estou". O mapa é de território costeiro e quem usa em
            campo está dentro dele: sem isto, a professora na praia tinha
            de achar a própria posição arrastando. Só pede permissão de
            localização quando clicado. */}
        <GeolocateControl
          position="top-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation
        />

        {/* Mapa de fundo. A `key` força remontar ao trocar: fonte raster
            não muda de endereço de tile no lugar. Declarado antes de
            tudo, fica por baixo da grade e das ocorrências. */}
        <Source
          key={fundo.id}
          id="fundo-mapa"
          type="raster"
          tiles={fundo.tiles}
          tileSize={256}
          maxzoom={fundo.maxzoom}
          attribution={fundo.atribuicao}
        >
          <Layer id="fundo-mapa-tiles" type="raster" />
        </Source>

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
            Cor e magnitude vêm do protocolo e do item, no banco.
            Pinos próximos viram um grupo até o zoom separá-los. */}
        {gruposDeOcorrencia.map((grupo) => {
          if (grupo.itens.length > 1) {
            const fatias = composicaoDoGrupo(grupo.itens);
            return (
              <Marker
                key={`gr-${grupo.chave}`}
                latitude={grupo.lat}
                longitude={grupo.lng}
                anchor="center"
                style={{ zIndex: 1 }}
              >
                <PinoAgrupado
                  quantidade={grupo.itens.length}
                  fatias={fatias}
                  titulo={`${grupo.itens.length} ocorrências: ${resumoDoGrupo(fatias)}. Clique para aproximar.`}
                  onClick={() => abrirGrupo(grupo.lat, grupo.lng)}
                />
              </Marker>
            );
          }

          const o = grupo.itens[0];
          const cor = o.protocolo_cor ?? "#a63d40";
          const magnitude =
            o.valor !== null && o.item_unidade
              ? `${o.valor.toLocaleString("pt-BR")} ${o.item_unidade}`
              : null;

          return (
            <Marker
              key={`oc-${o.id}`}
              latitude={grupo.lat}
              longitude={grupo.lng}
              anchor="bottom"
              style={{ zIndex: 1 }}
            >
              <div
                className="group relative flex flex-col items-center"
                title={`${o.item_nome ?? o.descricao}${magnitude ? ` — ${magnitude}` : ""} · ${o.escola_nome}`}
              >
                {/* O glifo do item; sem ele, o do protocolo. A cauda da
                    gota aponta a coordenada exata — por isso anchor bottom. */}
                <PinMapa
                  slug={slugDe(o.item_icone, o.protocolo_icone)}
                  cor={cor}
                  tamanho={28}
                  className="drop-shadow-md transition-transform group-hover:scale-110 origin-bottom"
                />
                <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap px-2 py-1 rounded-sm bg-glass-bg backdrop-blur-sm border border-glass-border text-[10px] font-medium text-foreground shadow-lg z-10">
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
              /* Acima das ocorrências: o nome da escola é a âncora de
                 leitura do mapa, e estava sendo coberto pelos grupos. */
              style={{ zIndex: 2 }}
            >
              {/* O rótulo vai acima do pino, não abaixo. Abaixo, ele caía
                  bem onde as ocorrências da escola se agrupam: ou cobria
                  os grupos e engolia o clique deles, ou era coberto. Acima,
                  os dois convivem — e a ponta do pino passa a cair no
                  ponto da escola, que é onde ela está. */}
              <Link
                href={`/escola/${escola.slug}`}
                title={escola.nome}
                className="group flex flex-col items-center"
              >
                <div className="mb-0.5 px-1.5 py-0.5 rounded-sm bg-glass-bg backdrop-blur-sm border border-glass-border text-[10px] font-medium text-foreground max-w-[120px] truncate shadow-sm">
                  {escola.nome.split(" ").slice(0, 3).join(" ")}
                </div>
                <PinMapa
                  slug="escola"
                  cor={COR_ESCOLA}
                  tamanho={34}
                  className="drop-shadow-md transition-transform group-hover:scale-110 origin-bottom"
                />
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

      {/* Escolha do mapa de fundo, acima do controle de zoom */}
      <div className="absolute top-16 right-3 z-30">
        <SeletorFundo atual={fundo} onEscolher={escolherFundo} />
      </div>

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
          contagens={contagens}
          ocorrenciasNaVista={ocorrenciasNaVista}
          totalDeOcorrencias={pontuaisFiltrados.length}
          onIrParaOcorrencia={irParaOcorrencia}
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
        contagens={contagens}
        ocorrenciasNaVista={ocorrenciasNaVista}
        totalDeOcorrencias={pontuaisFiltrados.length}
        onIrParaOcorrencia={irParaOcorrencia}
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

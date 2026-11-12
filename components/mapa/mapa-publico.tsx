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
import type {
  PubEscola,
  PubObservacaoGrade,
  PubObservacaoPontual,
  PubFotoGeorreferenciada,
} from "@/lib/database.types";
import { ESTILO_SEM_FUNDO, fundoPorId, fundoSalvo, salvaFundo } from "@/lib/mapa-base";
import { agruparPorProximidade, pontoDe } from "@/lib/agrupamento";
import { PinMapa, slugDe, pinoDaOrganizacao } from "./icones";
import { redeDaUrl, rotuloDoPino } from "@/lib/organizacao";
import { PinoAgrupado, composicaoDoGrupo, resumoDoGrupo } from "./pino-agrupado";
import { SeletorFundo } from "./seletor-fundo";
import { BalaoEscola } from "./balao-escola";
import { SeloDeFoto } from "./selo-de-foto";
import { enquadrarBalao, offsetDoBalao, useBalao } from "./use-balao";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import {
  PainelCamadas,
  type CamadaDeRede,
  type CamadasState,
  type FiltrosState,
} from "./painel-camadas";
import { FaixaIndicadores } from "./faixa-indicadores";
import { PopupCelula } from "./popup-celula";
import { PopupOcorrencia } from "./popup-ocorrencia";
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

  /**
   * A ocorrência aberta no cartão.
   *
   * Antes o pino só tinha dica ao passar o mouse — que não existe em
   * celular, que é onde a maior parte das pessoas abre este mapa. Quem
   * via um pino de descarte irregular no telefone não tinha como
   * descobrir o que era.
   */
  const [ocorrenciaAberta, setOcorrenciaAberta] = useState<PubObservacaoPontual | null>(null);
  const balao = useBalao<PubEscola>();

  // Tocado ou clicado, o balão aparece inteiro. As folgas são o que cobre
  // o mapa: a barra do topo, a faixa de indicadores embaixo e o painel de
  // camadas à esquerda (só no desktop).
  useEffect(() => {
    if (!balao.aberto || balao.origem !== "clique") return;
    const t = setTimeout(() => {
      const largo = window.innerWidth >= 768;
      enquadrarBalao(mapRef.current, {
        topo: 72,
        base: largo ? 100 : 150,
        esquerda: largo ? 344 : 12,
        direita: 60,
      });
    }, 60);
    return () => clearTimeout(t);
  }, [balao.aberto, balao.origem, balao.vez]);

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
    // A demonstração não tem foto: elas exigem curadoria e termo de
    // imagem, que só existem com escola de verdade.
    fotos: [],
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
  const [outrasCamadas, setOutrasCamadas] = useState({
    escolas: true,
    guardioes: true,
    ocorrencias: true,
  });

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
  // `/?rede=surf` abre o mapa já recortado nos Guardiões — é o link da
  // página do programa. Lido no inicializador: este componente só existe
  // no navegador (a home o carrega sem SSR), então `window` está aqui.
  const [filtros, setFiltros] = useState<FiltrosState>(() => ({
    municipio: "",
    rede: redeDaUrl(new URLSearchParams(window.location.search).get("rede")),
    escola: "",
    mesInicio: "",
    mesFim: "",
  }));

  const toggleCamada = useCallback((key: CamadaDeRede) => {
    setOutrasCamadas((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleProtocolo = useCallback((codigo: string) => {
    setProtocolosDesligados((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]
    );
  }, []);

  const changeFiltro = useCallback(
    (campo: keyof FiltrosState, valor: string) => {
      // Trocar a rede desmarca a escola escolhida: ela pode ser do outro
      // tipo, e os dois filtros juntos dariam um mapa vazio sem motivo
      // aparente.
      setFiltros((prev) => ({
        ...prev,
        [campo]: valor,
        ...(campo === "rede" ? { escola: "" } : {}),
      }));
      setPopupInfo(null);
      setOcorrenciaAberta(null);
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
   * O dado é da rede escolhida? Sem filtro de rede, todo dado é.
   *
   * O tipo vem da escola, pelo slug, e não de uma coluna em cada
   * ocorrência: assim a grade — que não carrega o tipo — é recortada
   * pela mesma regra que os pinos.
   */
  const daRede = useCallback(
    (slug: string) =>
      !filtros.rede || dados.escolas.find((e) => e.slug === slug)?.tipo === filtros.rede,
    [dados.escolas, filtros.rede]
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
      if (!daRede(g.escola_slug)) return false;
      if (filtros.escola && g.escola_slug !== filtros.escola) return false;
      if (filtros.mesInicio && g.mes < filtros.mesInicio) return false;
      if (filtros.mesFim && g.mes > filtros.mesFim + "-31") return false;
      return true;
    });
  }, [dados.grade, filtros, municipioDaEscola, daRede]);

  const pontuaisSemCamada = useMemo(() => {
    return dados.pontuais.filter((o) => {
      if (filtros.municipio && municipioDaEscola(o.escola_slug) !== filtros.municipio) return false;
      if (!daRede(o.escola_slug)) return false;
      if (filtros.escola && o.escola_slug !== filtros.escola) return false;
      if (filtros.mesInicio && o.data_campo < filtros.mesInicio + "-01") return false;
      if (filtros.mesFim && o.data_campo > filtros.mesFim + "-31") return false;
      return true;
    });
  }, [dados.pontuais, filtros, municipioDaEscola, daRede]);

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
      if (filtros.rede && e.tipo !== filtros.rede) return false;
      if (filtros.escola && e.slug !== filtros.escola) return false;
      // Cada tipo tem o seu liga-desliga, porque cada um tem o seu pino.
      return e.tipo === "surf" ? camadas.guardioes : camadas.escolas;
    });
  }, [dados.escolas, filtros.municipio, filtros.rede, filtros.escola, camadas.escolas, camadas.guardioes]);

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

  /** A foto de cada ocorrência, por identidade da ocorrência. */
  const fotoPorOcorrencia = useMemo(() => {
    const mapa = new Map<number, PubFotoGeorreferenciada>();
    for (const f of dados.fotos) mapa.set(f.pontual_id, f);
    return mapa;
  }, [dados.fotos]);

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
    // Abre o cartão junto: quem escolheu o item na lista já disse o que
    // quer ver, e obrigar a achar o pino e clicar de novo seria pedir o
    // mesmo duas vezes.
    setPopupInfo(null);
    setOcorrenciaAberta(o);
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
  // Com a rede escolhida, a lista de escolas só oferece as dela.
  const listaEscolas = useMemo(
    () =>
      dados.escolas
        .filter((e) => !filtros.rede || e.tipo === filtros.rede)
        .map((e) => ({ slug: e.slug, nome: e.nome })),
    [dados.escolas, filtros.rede]
  );
  const temSurf = useMemo(() => dados.escolas.some((e) => e.tipo === "surf"), [dados.escolas]);

  // Verifica se filtro ativo não tem resultados
  const filtroAtivo =
    filtros.municipio || filtros.rede || filtros.escola || filtros.mesInicio || filtros.mesFim;
  // Vazio de verdade: nem grade nem ocorrência. Só a grade não basta —
  // a escola de surf produz quase tudo como ocorrência pontual, e o
  // recorte dos Guardiões acusaria "nenhuma observação" em cima de um
  // mapa cheio de pinos.
  const semResultado =
    filtroAtivo && gradeFiltrada.length === 0 && pontuaisSemCamada.length === 0;

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
          const cor = o.protocolo_cor ?? "#c51d28";
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
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupInfo(null);
                setOcorrenciaAberta(o);
              }}
            >
              <div
                className="group relative flex flex-col items-center cursor-pointer"
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
                {fotoPorOcorrencia.has(o.id) && <SeloDeFoto />}
                <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap px-2 py-1 rounded-sm bg-glass-bg backdrop-blur-sm border border-glass-border text-[10px] font-medium text-foreground shadow-lg z-10">
                  <strong>{o.item_nome ?? o.descricao}</strong>
                  {magnitude && <span className="ml-1 tabular-nums">{magnitude}</span>}
                  <span className="block text-muted-foreground">
                    {o.protocolo_nome}
                    {fotoPorOcorrencia.has(o.id) && " · com foto — clique para ver"}
                  </span>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Camada: Escolas */}
        {escolasFiltradas.map((escola) => (
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
              {/* Passar o mouse abre o balão; clicar leva à página. No
                  toque não há "passar", então o primeiro toque abre o balão
                  e o segundo — ou o botão dentro dele — leva à página. O
                  teclado abre ao focar e segue com Enter. */}
              <Link
                href={`/escola/${escola.slug}`}
                aria-label={`${escola.nome} — abrir resumo da escola`}
                className="group flex flex-col items-center"
                onPointerEnter={(e) => e.pointerType === "mouse" && balao.abrir(escola, "mouse")}
                onPointerLeave={(e) => e.pointerType === "mouse" && balao.fecharDepois()}
                onFocus={() => balao.abrir(escola)}
                onClick={(e) => {
                  if (balao.aberto?.slug !== escola.slug) {
                    e.preventDefault();
                    balao.abrir(escola);
                  }
                }}
              >
                <div className="mb-0.5 px-1.5 py-0.5 rounded-sm bg-glass-bg backdrop-blur-sm border border-glass-border text-[10px] font-medium text-foreground max-w-[120px] truncate shadow-sm">
                  {rotuloDoPino(escola.nome, escola.tipo)}
                </div>
                <PinMapa
                  {...pinoDaOrganizacao(escola.tipo)}
                  tamanho={34}
                  className="drop-shadow-md transition-transform group-hover:scale-110 origin-bottom"
                />
              </Link>
            </Marker>
          ))}

        {/* Balão da escola. Acima do pino e do rótulo: o deslocamento é a
            altura dos dois, para a ponta do balão encostar no rótulo. */}
        {balao.aberto && (
          <Popup
            latitude={balao.aberto.lat}
            longitude={balao.aberto.lng}
            offset={offsetDoBalao(64)}
            closeButton
            closeOnClick={false}
            onClose={balao.fechar}
            maxWidth="none"
            /* Acima dos pinos das escolas, que têm zIndex 2: sem isto, o
               pino de uma escola vizinha cortava o balão. */
            style={{ zIndex: 10 }}
            // Abrir o balão não rouba o foco: quem só passou o mouse não
            // pediu para o cursor do teclado pular para dentro dele.
            focusAfterOpen={false}
          >
            <div onMouseEnter={balao.cancelar} onMouseLeave={balao.fecharDepois}>
              <BalaoEscola
                escola={balao.aberto}
                indicador={dados.indicadoresEscola.find((i) => i.escola_slug === balao.aberto?.slug)}
                acao={{ tipo: "link", href: `/escola/${balao.aberto.slug}`, rotulo: "Ver a página da escola" }}
              />
            </div>
          </Popup>
        )}

        {/* Cartão da ocorrência: foto primeiro, quando há */}
        {ocorrenciaAberta &&
          (() => {
            const xy = pontoDe(ocorrenciaAberta.ponto_geojson);
            if (!xy) return null;
            return (
              <Popup
                latitude={xy[1]}
                longitude={xy[0]}
                anchor="bottom"
                // A ponta do balão encosta no topo do pino (28 px de largura, 35 de
                // altura), e não na coordenada: senão o balão cobria o próprio pino.
                offset={[0, -36] as [number, number]}
                onClose={() => setOcorrenciaAberta(null)}
                closeButton
                closeOnClick={false}
                maxWidth="270px"
                style={{ zIndex: 10 }}
                focusAfterOpen={false}
              >
                <PopupOcorrencia
                  ocorrencia={ocorrenciaAberta}
                  foto={fotoPorOcorrencia.get(ocorrenciaAberta.id)}
                  comLinkParaEscola
                />
              </Popup>
            );
          })()}

        {/* Popup da célula */}
        {popupInfo && (
          <Popup
            latitude={popupInfo.latitude}
            longitude={popupInfo.longitude}
            closeOnClick={false}
            onClose={() => setPopupInfo(null)}
            maxWidth="280px"
            anchor="bottom"
            /* Acima dos pinos: sem isto, o pino vizinho cortava o balão. */
            style={{ zIndex: 10 }}
            focusAfterOpen={false}
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

      {/* A mesma barra das outras páginas, flutuando sobre o mapa. */}
      <BarraNavegacao flutuante />

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
          temSurf={temSurf}
          protocolos={listaProtocolos}
          contagens={contagens}
          ocorrenciasNaVista={ocorrenciasNaVista}
          totalDeOcorrencias={pontuaisFiltrados.length}
          comFoto={fotoPorOcorrencia}
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
        temSurf={temSurf}
        protocolos={listaProtocolos}
        contagens={contagens}
        ocorrenciasNaVista={ocorrenciasNaVista}
        totalDeOcorrencias={pontuaisFiltrados.length}
          comFoto={fotoPorOcorrencia}
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

      {/* Filtro sem resultado.

          No alto, em faixa, e não numa caixa no centro do mapa. O centro
          é onde o mapa enquadra o que sobrou do filtro — com o recorte
          dos Guardiões, a caixa caía em cima do pino da única escola de
          surf, dizendo "nada aqui" sobre a coisa que estava ali. */}
      {semResultado && !carregando && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-2rem)]">
          <div className="flex items-center gap-2.5 bg-glass-bg backdrop-blur-xl border border-glass-border rounded-sm shadow-sm px-3.5 py-2">
            <SearchX size={16} className="text-muted-foreground shrink-0" />
            <span className="text-xs font-medium">
              {escolasFiltradas.length > 0
                ? "Nenhuma observação publicada neste filtro ainda"
                : "Nenhuma observação neste filtro"}
            </span>
            <button
              onClick={() =>
                setFiltros({
                  municipio: "",
                  rede: "",
                  escola: "",
                  mesInicio: "",
                  mesFim: "",
                })
              }
              className="text-xs text-primary hover:underline shrink-0"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL, {
  Source,
  Layer,
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  AttributionControl,
  type MapRef,
} from "react-map-gl/maplibre";
import { PinMapa, slugDe, pinoDaOrganizacao } from "./icones";
import { PinoAgrupado, composicaoDoGrupo, resumoDoGrupo } from "./pino-agrupado";
import { SeletorFundo } from "./seletor-fundo";
import { BalaoEscola } from "./balao-escola";
import { SeloDeFoto } from "./selo-de-foto";
import { enquadrarBalao, offsetDoBalao, useBalao } from "./use-balao";
import { PopupOcorrencia } from "./popup-ocorrencia";
import { agruparPorProximidade, pontoDe as coordenadas } from "@/lib/agrupamento";
import { ESTILO_SEM_FUNDO, fundoPorId, fundoSalvo, salvaFundo } from "@/lib/mapa-base";

import type {
  PubEscola,
  PubIndicadorEscola,
  PubObservacaoPontual,
  PubFotoGeorreferenciada,
} from "@/lib/database.types";

interface MapaEscolaProps {
  escola: PubEscola;
  ocorrencias: PubObservacaoPontual[];
  fotos: PubFotoGeorreferenciada[];
  indicador?: PubIndicadorEscola;
  /** O botão do balão: na página da escola, abre a aba Sobre. */
  onVerSobre?: () => void;
}

const ZOOM_INICIAL = 14;

/**
 * Mapa do território de uma escola.
 *
 * Componente próprio, e não o MapaPublico: aquele é de tela cheia, com
 * painel de camadas e rodapé de indicadores da rede inteira. Aqui o
 * recorte é uma escola, e o que interessa é onde ela mapeou.
 */
export function MapaEscola({ escola, ocorrencias, fotos, indicador, onVerSobre }: MapaEscolaProps) {
  const [aberta, setAberta] = useState<PubObservacaoPontual | null>(null);
  const balao = useBalao<true>();

  /**
   * A foto da ocorrência, indexada pela ocorrência que ela documenta.
   *
   * Era indexada pela coordenada em texto, e não casava nunca: a view da
   * foto arredondava a posição em 100 m enquanto a da ocorrência dava a
   * exata — de 21 a 42 metros de diferença nos dados do piloto. O popup
   * tinha suporte a foto que jamais podia disparar. Por identidade, não
   * há formatação de float no meio.
   */
  const fotoPorOcorrencia = useMemo(() => {
    const mapa = new Map<number, PubFotoGeorreferenciada>();
    for (const f of fotos) mapa.set(f.pontual_id, f);
    return mapa;
  }, [fotos]);

  // O mesmo agrupamento do mapa público: a escola do piloto concentra
  // as ocorrências num trecho curto, e sobrepostas elas se escondem.
  const [zoom, setZoom] = useState(ZOOM_INICIAL);
  const mapRef = useRef<MapRef>(null);

  // Clicado, o balão aparece inteiro: o mapa se desloca até ele caber.
  // Espera um quadro para o balão existir no DOM antes de medi-lo.
  useEffect(() => {
    if (!balao.aberto || balao.origem !== "clique") return;
    const t = setTimeout(
      () => enquadrarBalao(mapRef.current, { topo: 12, base: 12, esquerda: 12, direita: 56 }),
      60
    );
    return () => clearTimeout(t);
  }, [balao.aberto, balao.origem, balao.vez]);

  // A escolha do fundo é a mesma do mapa da rede: quem pediu satélite lá
  // pediu satélite, e não "satélite naquela página". Lido já na
  // inicialização do estado, o que só vale porque a página carrega este
  // componente com ssr: false — buscar em effect faria piscar o fundo
  // padrão antes de trocar pelo escolhido.
  const [fundoId, setFundoId] = useState<string>(fundoSalvo);
  const fundo = fundoPorId(fundoId);

  const escolherFundo = useCallback((id: string) => {
    setFundoId(id);
    salvaFundo(id);
  }, []);

  const grupos = useMemo(
    () => agruparPorProximidade(ocorrencias, (o) => coordenadas(o.ponto_geojson), zoom),
    [ocorrencias, zoom]
  );

  const abertaXY = aberta ? coordenadas(aberta.ponto_geojson) : null;
  const fotoAberta = aberta ? fotoPorOcorrencia.get(aberta.id) : undefined;

  return (
    <div className="mapa-em-caixa relative w-full h-full">
      <MapGL
        ref={mapRef}
        initialViewState={{
          latitude: escola.lat,
          longitude: escola.lng,
          zoom: ZOOM_INICIAL,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={ESTILO_SEM_FUNDO}
        attributionControl={false}
        onZoomEnd={(e) => setZoom(e.viewState.zoom)}
      >
        <AttributionControl position="bottom-right" compact />
        <NavigationControl position="top-right" showCompass={false} />
        {/* Tela cheia: aqui o mapa mora numa caixa de 550 px dentro de uma
          página que rola. É pouco para ler imagem de satélite, que é
          justamente o que a troca de fundo veio permitir. */}
        <FullscreenControl position="top-right" />
        <GeolocateControl
          position="top-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation
        />

        {/* Mapa de fundo. A `key` força remontar ao trocar: fonte raster
          não muda de endereço de tile no lugar. */}
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

        <Marker latitude={escola.lat} longitude={escola.lng} anchor="bottom" style={{ zIndex: 2 }}>
          {/* Passar o mouse ou tocar abre o balão com os dados da escola. */}
          <button
            type="button"
            aria-label={`${escola.nome} — abrir resumo da escola`}
            className="block cursor-pointer transition-transform hover:scale-110 origin-bottom"
            onPointerEnter={(e) => e.pointerType === "mouse" && balao.abrir(true, "mouse")}
            onPointerLeave={(e) => e.pointerType === "mouse" && balao.fecharDepois()}
            onFocus={() => balao.abrir(true)}
            onClick={() => balao.abrir(true, "clique")}
          >
            <PinMapa {...pinoDaOrganizacao(escola.tipo)} tamanho={34} className="drop-shadow-md" />
          </button>
        </Marker>

        {balao.aberto && (
          <Popup
            latitude={escola.lat}
            longitude={escola.lng}
            offset={offsetDoBalao(44)}
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
                escola={escola}
                indicador={indicador}
                semCapa={Boolean(onVerSobre)}
                acao={
                  onVerSobre
                    ? {
                        tipo: "botao",
                        rotulo: "Contato e coordenação",
                        onClick: () => {
                          balao.fechar();
                          onVerSobre();
                        },
                      }
                    : { tipo: "link", href: `/escola/${escola.slug}`, rotulo: "Ver a página da escola" }
                }
              />
            </div>
          </Popup>
        )}

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
              <div
                title={`${o.item_nome ?? o.descricao}${fotoPorOcorrencia.has(o.id) ? " · com foto" : ""}`}
                className="relative cursor-pointer"
              >
                <PinMapa
                  slug={slugDe(o.item_icone, o.protocolo_icone)}
                  cor={o.protocolo_cor ?? "#c51d28"}
                  tamanho={28}
                  className="drop-shadow-md hover:scale-110 transition-transform origin-bottom"
                />
                {fotoPorOcorrencia.has(o.id) && <SeloDeFoto />}
              </div>
            </Marker>
          );
        })}

        {aberta && abertaXY && (
          <Popup
            latitude={abertaXY[1]}
            longitude={abertaXY[0]}
            anchor="bottom"
            // A ponta do balão encosta no topo do pino (28 px de largura, 35 de
            // altura), e não na coordenada: senão o balão cobria o próprio pino.
            offset={[0, -36] as [number, number]}
            onClose={() => setAberta(null)}
            closeButton
            closeOnClick={false}
            maxWidth="270px"
            /* Acima dos pinos: sem isto, o pino vizinho cortava o balão. */
            style={{ zIndex: 10 }}
            focusAfterOpen={false}
          >
            <PopupOcorrencia ocorrencia={aberta} foto={fotoAberta} />
          </Popup>
        )}
      </MapGL>

      {/* À esquerda porque a direita já tem zoom, tela cheia e "onde
          estou" empilhados. Daí o alinhamento à esquerda: o painel
          precisa crescer para dentro do mapa, e não para fora, senão a
          caixa da página o corta. */}
      <div className="absolute top-3 left-3 z-10">
        <SeletorFundo atual={fundo} onEscolher={escolherFundo} alinhamento="esquerda" />
      </div>
    </div>
  );
}

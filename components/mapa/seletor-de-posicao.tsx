"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MapGL, {
  Source,
  Layer,
  Marker,
  NavigationControl,
  AttributionControl,
  type MapRef,
  type MapLayerMouseEvent,
  type MarkerDragEvent,
} from "react-map-gl/maplibre";
import { LocateFixed, Loader2, MousePointerClick, Undo2 } from "lucide-react";

import { PinMapa, pinoDaOrganizacao } from "./icones";
import { SeletorFundo } from "./seletor-fundo";
import { ESTILO_SEM_FUNDO, fundoPorId, fundoSalvo, salvaFundo } from "@/lib/mapa-base";
import { CENTRO_INICIAL, arredondar, posicaoValida } from "@/lib/posicao";
import type { TipoOrganizacao } from "@/lib/organizacao";

interface Props {
  lat: number | null;
  lng: number | null;
  onMudar: (lat: number, lng: number) => void;
  /** Decide o pino: o capelo da escola ou a onda da escola de surf. */
  tipo: TipoOrganizacao;
}

const ZOOM_SEM_POSICAO = 12;
const ZOOM_COM_POSICAO = 16;

/**
 * Marcar a posição da escola apontando no mapa.
 *
 * Latitude e longitude são como o banco guarda o lugar, não como uma
 * pessoa o conhece. Ninguém sabe de cabeça a coordenada da própria
 * escola, e o cadastro com dois campos numéricos acabava gravando o
 * valor que já vinha preenchido. Aqui a pessoa acha o telhado no
 * satélite e solta o pino em cima.
 *
 * Três jeitos de marcar, porque cada um serve a uma situação: arrastar
 * o pino para ajustar, tocar no mapa para marcar de primeira, e "usar
 * onde estou" para quem está fazendo o cadastro de dentro da escola.
 * Os campos numéricos continuam ao lado, para quem tem a coordenada.
 */
export function SeletorDePosicao({ lat, lng, onMudar, tipo }: Props) {
  const mapRef = useRef<MapRef>(null);
  const temPosicao = posicaoValida(lat, lng);

  // A mesma escolha de fundo do resto da plataforma. Este componente só
  // é carregado sem SSR, então `window` existe no inicializador.
  const [fundoId, setFundoId] = useState<string>(fundoSalvo);
  const fundo = fundoPorId(fundoId);

  const [localizando, setLocalizando] = useState(false);
  const [erroDeLocal, setErroDeLocal] = useState("");

  /**
   * A última posição que saiu daqui.
   *
   * Quando a posição muda por fora — alguém digitou nos campos —, o
   * mapa precisa ir até ela. Quando muda por dentro, não: a pessoa
   * acabou de soltar o pino, e recentralizar o mapa nesse instante
   * arrancaria o chão debaixo do dedo dela.
   */
  const emitida = useRef<string>("");

  /**
   * A posição com que a tela abriu, para poder voltar a ela.
   *
   * Um toque no mapa move o pino — é o jeito mais rápido de marcar, e
   * também o mais fácil de fazer sem querer, ao arrastar o mapa com
   * pressa. Sem um caminho de volta, o toque errado numa escola já
   * publicada só se corrigia lembrando a coordenada de cabeça.
   */
  const [inicial] = useState(() => (posicaoValida(lat, lng) ? { lat: lat!, lng: lng! } : null));
  const mudou = inicial !== null && temPosicao && (inicial.lat !== lat || inicial.lng !== lng);

  const marcar = useCallback(
    (novaLat: number, novaLng: number) => {
      const la = arredondar(novaLat);
      const lo = arredondar(novaLng);
      emitida.current = `${la},${lo}`;
      onMudar(la, lo);
    },
    [onMudar]
  );

  useEffect(() => {
    if (!posicaoValida(lat, lng)) return;
    if (emitida.current === `${lat},${lng}`) return;
    const mapa = mapRef.current;
    if (!mapa) return;
    mapa.easeTo({
      center: [lng as number, lat as number],
      zoom: Math.max(mapa.getZoom(), ZOOM_COM_POSICAO - 2),
      duration: 500,
    });
  }, [lat, lng]);

  const aoClicar = useCallback(
    (e: MapLayerMouseEvent) => marcar(e.lngLat.lat, e.lngLat.lng),
    [marcar]
  );

  const aoSoltar = useCallback(
    (e: MarkerDragEvent) => marcar(e.lngLat.lat, e.lngLat.lng),
    [marcar]
  );

  const usarOndeEstou = () => {
    setErroDeLocal("");
    if (!("geolocation" in navigator)) {
      setErroDeLocal("Este aparelho não informa a localização.");
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocalizando(false);
        // Marca e leva o mapa junto: aqui a posição nasce de dentro,
        // mas pode estar a quilômetros do que a tela mostra.
        marcar(p.coords.latitude, p.coords.longitude);
        mapRef.current?.easeTo({
          center: [p.coords.longitude, p.coords.latitude],
          zoom: ZOOM_COM_POSICAO,
          duration: 600,
        });
      },
      () => {
        setLocalizando(false);
        setErroDeLocal(
          "Não foi possível obter a localização. Verifique a permissão do navegador ou marque o ponto no mapa."
        );
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="mapa-em-caixa relative h-72 sm:h-80 rounded-sm overflow-hidden border border-input">
        <MapGL
          ref={mapRef}
          initialViewState={{
            latitude: temPosicao ? (lat as number) : CENTRO_INICIAL.lat,
            longitude: temPosicao ? (lng as number) : CENTRO_INICIAL.lng,
            zoom: temPosicao ? ZOOM_COM_POSICAO : ZOOM_SEM_POSICAO,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={ESTILO_SEM_FUNDO}
          attributionControl={false}
          onClick={aoClicar}
          cursor="crosshair"
          /* O mapa mora dentro de um formulário que rola. Sem isto, a
             roda do mouse daria zoom em vez de rolar a página, e no
             celular um dedo sobre o mapa prenderia a rolagem. O arrasto
             do pino e o toque para marcar continuam com um dedo só. */
          cooperativeGestures
          locale={{
            "CooperativeGesturesHandler.WindowsHelpText":
              "Segure Ctrl e role para aproximar o mapa",
            "CooperativeGesturesHandler.MacHelpText": "Segure ⌘ e role para aproximar o mapa",
            "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa",
          }}
        >
          <AttributionControl position="bottom-right" compact />
          <NavigationControl position="top-right" showCompass={false} />

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

          {temPosicao && (
            <Marker
              latitude={lat as number}
              longitude={lng as number}
              anchor="bottom"
              draggable
              onDragEnd={aoSoltar}
            >
              <div className="cursor-grab active:cursor-grabbing" title="Arraste para ajustar">
                <PinMapa {...pinoDaOrganizacao(tipo)} tamanho={40} className="drop-shadow-md" />
              </div>
            </Marker>
          )}
        </MapGL>

        <div className="absolute top-2 left-2 z-10">
          <SeletorFundo
            atual={fundo}
            onEscolher={(id) => {
              setFundoId(id);
              salvaFundo(id);
            }}
            alinhamento="esquerda"
          />
        </div>

        {!temPosicao && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
            <span className="inline-flex items-center gap-1.5 bg-glass-bg backdrop-blur-xl border border-glass-border rounded-sm shadow-sm px-3 py-1.5 text-xs font-medium">
              <MousePointerClick className="w-3.5 h-3.5 text-primary" />
              Toque no mapa para marcar onde fica
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <p className="text-[11px] text-muted-foreground">
          {temPosicao
            ? "Arraste o pino ou toque no mapa para ajustar. No satélite dá para achar o telhado."
            : "Aproxime o mapa até achar o lugar e toque nele. No satélite dá para achar o telhado."}
        </p>
        {/* Os dois juntos: soltos, a quebra de linha separava um do outro. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {mudou && (
            <button
              type="button"
              onClick={() => inicial && onMudar(inicial.lat, inicial.lng)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Voltar à posição anterior
            </button>
          )}
          <button
            type="button"
            onClick={usarOndeEstou}
            disabled={localizando}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-60"
          >
            {localizando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5" />
            )}
            Usar onde estou agora
          </button>
        </div>
      </div>

      {erroDeLocal && <p className="text-[11px] text-destructive">{erroDeLocal}</p>}
    </div>
  );
}

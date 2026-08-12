/**
 * Mapas de fundo.
 *
 * O mapa de ruas responde "onde fica"; o de satélite responde "o que
 * tem ali". Para monitoramento costeiro, a segunda pergunta é a que
 * importa mais: a faixa de restinga, a boca da drenagem, a foz do rio e
 * o terreno onde o entulho foi despejado só se enxergam na imagem. Uma
 * ocorrência de supressão de vegetação sobre o mapa de ruas é um pino
 * no vazio; sobre a imagem, é a mancha que a turma viu.
 *
 * Todas as fontes são abertas e sem chave de API — nada aqui depende de
 * uma conta que possa expirar e derrubar o mapa da rede.
 */

export interface MapaDeFundo {
  id: string;
  nome: string;
  /** Uma linha explicando para que serve, na hora de escolher. */
  descricao: string;
  tiles: string[];
  maxzoom: number;
  atribuicao: string;
  /** Fundo claro pede rótulo escuro; imagem de satélite pede claro. */
  escuro: boolean;
}

export const MAPAS_DE_FUNDO: MapaDeFundo[] = [
  {
    id: "ruas",
    nome: "Mapa",
    descricao: "Ruas, bairros e nomes de lugar",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    maxzoom: 19,
    atribuicao:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    escuro: false,
  },
  {
    id: "satelite",
    nome: "Satélite",
    descricao: "Imagem real: areia, restinga, foz e drenagem",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    maxzoom: 19,
    atribuicao: "Imagem &copy; Esri, Maxar, Earthstar Geographics",
    escuro: true,
  },
  {
    id: "relevo",
    nome: "Relevo",
    descricao: "Terreno, morros e curso d'água",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    ],
    maxzoom: 19,
    atribuicao: "&copy; Esri, HERE, Garmin, FAO, NOAA, USGS",
    escuro: false,
  },
];

export const FUNDO_PADRAO = MAPAS_DE_FUNDO[0];

export function fundoPorId(id: string): MapaDeFundo {
  return MAPAS_DE_FUNDO.find((m) => m.id === id) ?? FUNDO_PADRAO;
}

/** Onde o navegador guarda a escolha, para ela sobreviver ao recarregar. */
export const CHAVE_FUNDO = "oceano.mapa-de-fundo";

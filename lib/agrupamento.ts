/**
 * Agrupamento de pinos por proximidade.
 *
 * Com sete protocolos ligados, cada escola do piloto empilha meia dúzia
 * de ocorrências no mesmo pedaço de praia. Sobrepostas, elas escondem
 * uma à outra e ainda cobrem o rótulo da escola — o mapa fica com
 * aparência de cheio e leitura de vazio.
 *
 * O agrupamento é feito numa grade em graus, derivada do zoom, e não em
 * pixels da tela. A diferença importa: em graus, arrastar o mapa não
 * remonta os grupos, e só aproximar os separa. Em pixels, cada
 * movimento reagruparia tudo e os pinos ficariam piscando.
 *
 * Não é o mesmo agrupamento da grade de 100 m das premissas. Aquele
 * protege a identificação de quem foi a campo e vive no banco; este é
 * só desenho, acontece no navegador e some ao aproximar.
 */

export interface Grupo<T> {
  /** Estável entre renders com o mesmo zoom, serve de key no React. */
  chave: string;
  lat: number;
  lng: number;
  itens: T[];
}

/**
 * Lado da célula, em graus, para manter os pinos a uma distância mínima
 * na tela. O mundo tem 256 × 2^zoom pixels de largura no esquema de
 * tiles, então cada pixel vale 360 / (256 × 2^zoom) graus de longitude.
 */
function ladoEmGraus(zoom: number, pixels: number): number {
  return (360 / (256 * Math.pow(2, zoom))) * pixels;
}

export function agruparPorProximidade<T>(
  itens: T[],
  coordenada: (item: T) => [number, number] | null,
  zoom: number,
  pixelsDeSeparacao = 46
): Grupo<T>[] {
  const lado = ladoEmGraus(zoom, pixelsDeSeparacao);
  const grupos = new Map<string, { lat: number; lng: number; itens: T[] }>();

  for (const item of itens) {
    const xy = coordenada(item);
    if (!xy) continue;
    const [lng, lat] = xy;

    const chave = `${Math.floor(lng / lado)}:${Math.floor(lat / lado)}`;
    const grupo = grupos.get(chave) ?? { lat: 0, lng: 0, itens: [] };
    grupo.itens.push(item);
    grupo.lat += lat;
    grupo.lng += lng;
    grupos.set(chave, grupo);
  }

  // A posição do grupo é o centro dos seus pontos, não o canto da
  // célula: o pino cai onde as ocorrências estão, e não numa grade
  // visível que não existe.
  return [...grupos.entries()].map(([chave, g]) => ({
    chave,
    lat: g.lat / g.itens.length,
    lng: g.lng / g.itens.length,
    itens: g.itens,
  }));
}

/** Lê o par [lng, lat] de uma geometria GeoJSON em texto. */
export function pontoDe(geojson: string): [number, number] | null {
  try {
    const g = JSON.parse(geojson) as { coordinates?: [number, number] };
    return g.coordinates ?? null;
  } catch {
    return null;
  }
}

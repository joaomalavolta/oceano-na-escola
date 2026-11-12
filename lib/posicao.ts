/**
 * A posição de uma escola no mapa, como par de números.
 *
 * Fica separado do componente do mapa porque as mesmas regras valem em
 * três lugares — o pino arrastado, os campos digitados e o aviso da
 * ficha —, e porque dá para testá-las sem montar um mapa.
 */

export interface Posicao {
  lat: number;
  lng: number;
}

/**
 * Onde o mapa abre quando a escola ainda não tem posição: o centro da
 * área do piloto, em Itanhaém. É só o enquadramento inicial — não vira
 * coordenada de ninguém enquanto a pessoa não marcar o ponto.
 */
export const CENTRO_INICIAL: Posicao = { lat: -24.18, lng: -46.79 };

/**
 * A coordenada que o cadastro preenchia sozinho, até a versão anterior.
 *
 * Os dois campos nasciam com este valor, e quem não reparasse neles
 * cadastrava a escola neste ponto — o mesmo para todas. Fica guardada
 * aqui para a ficha poder reconhecer o caso e avisar: escola parada
 * exatamente neste ponto quase certamente nunca teve a posição marcada.
 */
export const POSICAO_PADRAO_ANTIGA: Posicao = { lat: -24.1875, lng: -46.8015 };

/** Seis casas: cerca de dez centímetros. Mais que isso é ruído do arrasto. */
export function arredondar(valor: number): number {
  return Math.round(valor * 1e6) / 1e6;
}

export function posicaoValida(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function ehPosicaoPadraoAntiga(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  if (!posicaoValida(lat, lng)) return false;
  return (
    Math.abs((lat as number) - POSICAO_PADRAO_ANTIGA.lat) < 1e-6 &&
    Math.abs((lng as number) - POSICAO_PADRAO_ANTIGA.lng) < 1e-6
  );
}

/**
 * Lê o que foi digitado num campo de coordenada.
 *
 * Campo vazio é "sem posição", e não zero: `Number("")` dá 0, e latitude
 * zero com longitude zero é um ponto de verdade, no meio do Atlântico.
 * Aceita vírgula decimal, que é como se escreve número em português.
 */
export function lerCoordenada(texto: string): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (limpo === "" || limpo === "-") return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

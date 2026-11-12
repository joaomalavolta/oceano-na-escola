"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { Offset } from "maplibre-gl";

/** Como o balão foi aberto. Só o passar do mouse é "de passagem". */
export type OrigemDoBalao = "mouse" | "clique";

/**
 * O balão que abre ao passar o mouse e fecha ao sair.
 *
 * Fecha com atraso, e não na hora: entre o pino e o balão há uma fresta,
 * e sem o atraso o balão sumiria no caminho do mouse até o botão dentro
 * dele. Entrar no balão cancela o fechamento.
 */
export function useBalao<T>(atrasoMs = 250) {
  const [aberto, setAberto] = useState<T | null>(null);
  const [origem, setOrigem] = useState<OrigemDoBalao>("mouse");
  // Conta as aberturas, para o enquadramento rodar de novo a cada clique,
  // mesmo quando o balão já estava aberto pela passagem do mouse.
  const [vez, setVez] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelar = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const abrir = useCallback(
    (x: T, como: OrigemDoBalao = "clique") => {
      cancelar();
      setAberto(x);
      setOrigem(como);
      setVez((n) => n + 1);
    },
    [cancelar]
  );

  const fecharDepois = useCallback(() => {
    cancelar();
    timer.current = setTimeout(() => setAberto(null), atrasoMs);
  }, [cancelar, atrasoMs]);

  const fechar = useCallback(() => {
    cancelar();
    setAberto(null);
  }, [cancelar]);

  useEffect(() => cancelar, [cancelar]);

  return { aberto, origem, vez, abrir, fecharDepois, fechar, cancelar };
}

/** Quanto de cada borda do mapa está coberto por outra coisa. */
export interface Folgas {
  topo: number;
  base: number;
  esquerda: number;
  direita: number;
}

/**
 * Desloca o mapa até o balão caber inteiro na área visível.
 *
 * Só depois de clique ou toque: a quem só passou o mouse, mover o mapa
 * tiraria o pino de baixo do cursor — e o balão fecharia na hora. E a
 * escolha automática do lado do balão (ver `offsetDoBalao`) já resolve a
 * maioria dos casos sem mover nada.
 *
 * Se o balão for mais alto que o próprio mapa, ganha o topo: é lá que
 * estão o nome e os fatos; o botão fica a uma rolagem de distância.
 */
export function enquadrarBalao(mapa: MapRef | null, folgas: Folgas) {
  if (!mapa) return;
  const caixa = mapa.getContainer();
  const balao = caixa.querySelector<HTMLElement>(".maplibregl-popup");
  if (!balao) return;

  const c = caixa.getBoundingClientRect();
  const b = balao.getBoundingClientRect();
  const topo = c.top + folgas.topo;
  const base = c.bottom - folgas.base;
  const esq = c.left + folgas.esquerda;
  const dir = c.right - folgas.direita;

  let dy = 0;
  if (b.top < topo) dy = b.top - topo;
  else if (b.bottom > base) dy = Math.min(b.bottom - base, b.top - topo);

  let dx = 0;
  if (b.left < esq) dx = b.left - esq;
  else if (b.right > dir) dx = Math.min(b.right - dir, b.left - esq);

  if (dx !== 0 || dy !== 0) mapa.panBy([dx, dy], { duration: 350 });
}

/**
 * O deslocamento do balão para cada lado em que ele pode abrir.
 *
 * Sem `anchor` fixo, o MapLibre escolhe sozinho o lado em que o balão
 * cabe — em cima do pino, embaixo, ou de lado. O deslocamento acompanha:
 * acima, ele sobe a altura do pino; abaixo, encosta na ponta; de lado,
 * fica na altura do meio do pino.
 */
export function offsetDoBalao(alturaDoPino: number): Offset {
  const meio = -Math.round(alturaDoPino / 2);
  return {
    center: [0, meio],
    top: [0, 6],
    bottom: [0, -alturaDoPino],
    left: [20, meio],
    right: [-20, meio],
    "top-left": [12, 4],
    "top-right": [-12, 4],
    "bottom-left": [12, -alturaDoPino],
    "bottom-right": [-12, -alturaDoPino],
  };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * O balão que abre ao passar o mouse e fecha ao sair.
 *
 * Fecha com atraso, e não na hora: entre o pino e o balão há uma fresta,
 * e sem o atraso o balão sumiria no caminho do mouse até o botão dentro
 * dele. Entrar no balão cancela o fechamento.
 */
export function useBalao<T>(atrasoMs = 250) {
  const [aberto, setAberto] = useState<T | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelar = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const abrir = useCallback(
    (x: T) => {
      cancelar();
      setAberto(x);
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

  return { aberto, abrir, fecharDepois, fechar, cancelar };
}

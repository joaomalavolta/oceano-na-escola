"use client";

import { useEffect } from "react";

/**
 * Registra o service worker. Componente separado porque o layout é
 * server component e o registro precisa do navigator — e porque o SW
 * só faz sentido no build de produção: em dev ele cacharia páginas
 * que mudam a cada salvamento.
 */
export function RegistraSw() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sem SW o app segue funcionando; só perde o shell offline.
    });
  }, []);
  return null;
}

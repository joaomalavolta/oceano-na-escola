import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Os testes cobrem a lógica pura: agrupamento de pinos, escala de
 * densidade, composição do grupo, ordem da navegação e o catálogo que o
 * campo guarda para funcionar sem sinal.
 *
 * Não cobrem o que só existe contra o Supabase — RLS, upload, fila
 * subindo — nem o service worker, que é script de escopo global e não
 * módulo. Essas partes seguem dependendo de verificação manual, e o
 * README diz isso em voz alta para ninguém confundir suíte verde com
 * sistema verificado.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**"],
  },
});

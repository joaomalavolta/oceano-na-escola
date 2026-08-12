/**
 * Service worker do Oceano na Escola.
 *
 * Escopo deliberadamente pequeno: shell e estáticos em cache para o app
 * abrir na praia sem sinal, e uma página de aviso quando nem o cache
 * tem a rota. Os DADOS não passam por aqui — Supabase é sempre rede, e
 * o registro sem rede tem caminho próprio, a fila em IndexedDB do
 * /campo. Cachear resposta de API esconderia dado velho como se fosse
 * atual, que é pior do que dizer "sem conexão".
 */

const VERSAO = "oceano-v1";
const SHELL = ["/", "/campo", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSAO)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Só GET da própria origem. Supabase, tiles e POST seguem direto.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Estáticos com hash no nome: cache primeiro, rede preenche.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(png|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then(
        (memo) =>
          memo ??
          fetch(request).then((resp) => {
            const copia = resp.clone();
            caches.open(VERSAO).then((cache) => cache.put(request, copia));
            return resp;
          })
      )
    );
    return;
  }

  // Navegação: rede primeiro — a página nova vale mais que a guardada —
  // com cache e depois aviso de offline como retaguarda.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(VERSAO).then((cache) => cache.put(request, copia));
          return resp;
        })
        .catch(async () => {
          const memo = await caches.match(request);
          return memo ?? caches.match("/offline.html");
        })
    );
  }
});

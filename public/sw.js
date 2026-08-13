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

/**
 * Trocar esta versão apaga tudo que ficou para trás, no `activate`.
 *
 * Subiu para v2 porque a v1 guardava resposta de erro: quando um arquivo
 * ainda não existia, o 404 dele entrava no cache e, como estático era
 * servido do cache primeiro e sem revalidar, aquele 404 virava
 * definitivo. Foi o que aconteceu com a logo — os navegadores que
 * visitaram o site antes de o arquivo existir guardaram a ausência dela
 * e nunca mais perguntaram. O conserto abaixo impede que volte a
 * acontecer; a troca de versão limpa quem já estava envenenado.
 */
const VERSAO = "oceano-v2";
const SHELL = ["/", "/campo", "/offline.html"];

/** Estático de endereço fixo, que pode mudar de conteúdo sem mudar de nome. */
const ESTATICO = /\.(png|jpe?g|svg|ico|webp|woff2?)$/;

/**
 * Guarda no cache só o que deu certo.
 *
 * Um 404 guardado é pior que nenhum cache: com estratégia de cache
 * primeiro, ele responde no lugar da rede e o arquivo nunca mais é
 * encontrado, mesmo depois de publicado. Respostas opacas também ficam
 * de fora — não dá para saber se deram certo.
 */
function guarda(request, resp) {
  if (!resp || !resp.ok || resp.type === "opaque") return resp;
  const copia = resp.clone();
  caches.open(VERSAO).then((cache) => cache.put(request, copia));
  return resp;
}

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

  // Build do Next: o nome carrega o hash do conteúdo, então mudou o
  // arquivo, mudou o endereço. Cache primeiro e ponto — revalidar seria
  // pedir de novo algo que, por construção, não muda.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((memo) => memo ?? fetch(request).then((r) => guarda(request, r)))
    );
    return;
  }

  // Estáticos de endereço fixo — logo, ícones, fontes. Responde do cache
  // na hora, para o app abrir rápido e sem sinal, e busca na rede em
  // paralelo para a próxima visita já ver a versão nova. Cache primeiro
  // puro, que era o que estava aqui, congelava esses arquivos para
  // sempre: trocar a arte da logo não chegaria a quem já tinha a antiga.
  if (ESTATICO.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((memo) => {
        const daRede = fetch(request)
          .then((r) => guarda(request, r))
          .catch(() => memo);
        return memo ?? daRede;
      })
    );
    return;
  }

  // Navegação: rede primeiro — a página nova vale mais que a guardada —
  // com cache e depois aviso de offline como retaguarda.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => guarda(request, resp))
        .catch(async () => {
          const memo = await caches.match(request);
          return memo ?? caches.match("/offline.html");
        })
    );
  }
});

import { barraDeEscala, coordenadaLegivel } from "@/lib/cartografia";

export interface TerritorioCapturado {
  /** PNG em data: URL, tirado do canvas do mapa. */
  imagem: string;
  lat: number;
  lng: number;
  zoom: number;
  /** Largura da imagem em pixels, para a barra de escala fechar. */
  largura: number;
  atribuicao: string;
  capturadoEm: string;
}

/**
 * A prancha com o território real impresso.
 *
 * É um documento cartográfico, e não um print de tela: leva barra de
 * escala, norte, coordenada do centro e o crédito da imagem. Sem essas
 * quatro coisas a folha é uma figura bonita — com elas, a turma pode
 * medir distância, se orientar e dizer de onde veio a imagem, que é o
 * mínimo para chamar aquilo de mapa.
 *
 * O crédito não é enfeite nem cortesia: a imagem é da Esri e de quem
 * mais estiver na cadeia, e ela sai da escola impressa, circula em
 * reunião e às vezes vira anexo de ofício. Vai junto, sempre.
 */
export function PranchaTerritorio({ t }: { t: TerritorioCapturado }) {
  const escala = barraDeEscala(t.lat, t.zoom, Math.min(160, t.largura / 4));

  return (
    <article className="ficha-folha text-black">
      <header className="border-b-2 border-black pb-2 mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[8pt] uppercase tracking-widest">
            Oceano na Escola · Instituto Ecosurf
          </p>
          <h1 className="text-[15pt] font-bold leading-tight">O território de verdade</h1>
          <p className="text-[9pt]">
            Imagem de satélite do trecho da saída de campo — para comparar com o nosso desenho
          </p>
        </div>
        <div className="text-right text-[8pt] shrink-0">
          <div className="uppercase tracking-wide">Grupo</div>
          <div className="border-2 border-black w-[56px] h-[30px] ml-auto" />
        </div>
      </header>

      <div className="flex gap-3 mb-2">
        {["Escola", "Turma", "Data"].map((r) => (
          <div key={r} className="flex-1">
            <div className="text-[8pt] uppercase tracking-wide text-black/70">{r}</div>
            <div className="border-b border-black h-[18px]" />
          </div>
        ))}
      </div>

      {/* ── A imagem ──────────────────────────────────── */}
      <div className="relative border-2 border-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.imagem}
          alt="Imagem de satélite do trecho onde a expedição vai trabalhar"
          className="block w-full"
        />

        {/* Norte e escala por cima da imagem, com fundo branco: sobre
            areia clara um traço preto sozinho some. */}
        <div className="absolute right-2 top-2 bg-white border border-black px-1.5 py-1 flex flex-col items-center">
          <svg width="20" height="20" viewBox="-12 -12 24 24" fill="none" stroke="black" strokeWidth="1.6">
            <path d="M0 9 L0 -8" />
            <path d="M0 -11 L-3.5 -5 L3.5 -5 Z" fill="black" />
          </svg>
          <span className="text-[7pt] font-bold leading-none">N</span>
        </div>

        <div className="absolute left-2 bottom-2 bg-white border border-black px-1.5 py-1">
          <div className="flex items-end gap-1">
            <div>
              <div className="h-[6px] border-l border-r border-b border-black" style={{ width: escala.pixels }} />
              <div className="text-[7.5pt] text-center leading-tight">{escala.rotulo}</div>
            </div>
          </div>
        </div>
      </div>

      {/* O crédito da imagem, colado nela. */}
      <p className="text-[7.5pt] mt-1 leading-tight">
        {t.atribuicao} · centro {coordenadaLegivel(t.lat, t.lng)} · zoom {t.zoom.toFixed(1)} ·
        capturado em {t.capturadoEm}
      </p>

      {/* ── O que fazer com ela ───────────────────────── */}
      <section className="mt-3">
        <h2 className="text-[9pt] font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5">
          Comparando com o nosso desenho
        </h2>
        <div className="space-y-2">
          {[
            "O que a gente desenhou e está aqui:",
            "O que está aqui e a gente não desenhou:",
            "O que a gente sabe e esta imagem não mostra:",
          ].map((p) => (
            <div key={p}>
              <div className="text-[8.5pt] font-semibold">{p}</div>
              <div className="border-b border-black/60 h-[19px]" />
              <div className="border-b border-black/60 h-[19px]" />
            </div>
          ))}
        </div>
      </section>

      <p className="text-[8pt] mt-2 leading-snug border-l-[3px] border-black pl-2 py-0.5">
        A terceira pergunta é a mais importante. Cheiro, barulho, horário, quem usa o lugar e o
        que já existiu ali — nada disso aparece numa imagem aérea, e é o que só a turma sabe.
      </p>

      <footer className="mt-3 pt-1.5 border-t border-black text-[8pt]">
        Marque nesta imagem, com caneta, os trechos que a turma escolheu para amostrar — e escreva
        ao lado a hipótese de cada um.
      </footer>
    </article>
  );
}

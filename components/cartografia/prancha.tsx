import { Glifo } from "@/components/mapa/icones";
import { SimboloSocial } from "./simbolos";
import { FAMILIAS } from "@/lib/cartografia";

/**
 * A prancha em branco e a folha de símbolos.
 *
 * A prancha é quase toda vazia, e é assim que tem de ser: o que vale é
 * o que a turma põe ali. O que a folha traz de pronto é só o mínimo
 * para o desenho não virar rabisco solto — moldura, uma faixa de mar
 * para orientar, a rosa dos ventos, e os campos que identificam de quem
 * é a folha.
 */

export function PranchaEmBranco() {
  return (
    <article className="ficha-folha text-black">
      <header className="border-b-2 border-black pb-2 mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-[8pt] uppercase tracking-widest">
            Oceano na Escola · Instituto Ecosurf
          </p>
          <h1 className="text-[15pt] font-bold leading-tight">
            Nosso mapa do território
          </h1>
          <p className="text-[9pt]">Cartografia social — antes da saída de campo</p>
        </div>
        <div className="text-right text-[8pt] shrink-0">
          <div className="uppercase tracking-wide">Grupo</div>
          <div className="border-2 border-black w-[56px] h-[34px] ml-auto" />
        </div>
      </header>

      <div className="flex gap-3 mb-2">
        {["Escola", "Turma", "Data"].map((r) => (
          <div key={r} className="flex-1">
            <div className="text-[8pt] uppercase tracking-wide text-black/70">{r}</div>
            <div className="border-b border-black h-[20px]" />
          </div>
        ))}
      </div>
      <div className="mb-2">
        <div className="text-[8pt] uppercase tracking-wide text-black/70">Quem desenhou</div>
        <div className="border-b border-black h-[20px]" />
      </div>

      {/* ── A moldura de desenho ──────────────────────── */}
      <div className="relative border-2 border-black" style={{ height: "125mm" }}>
        {/* Faixa de mar no alto: orienta sem desenhar o lugar por
            ninguém. Sem nenhuma referência, metade dos grupos começa
            desenhando a rua e não sabe onde pôr o mar. */}
        <div className="absolute inset-x-0 top-0 h-[16mm] border-b-2 border-dashed border-black/60">
          <span className="absolute left-2 top-1 text-[8pt] uppercase tracking-widest text-black/50">
            Mar
          </span>
        </div>

        <span className="absolute left-2 bottom-1 text-[8pt] uppercase tracking-widest text-black/50">
          Cidade
        </span>

        {/* Rosa dos ventos */}
        <svg
          className="absolute right-2 top-[18mm]"
          width="42"
          height="42"
          viewBox="-24 -24 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle r="17" />
          <path d="M0 -17 L0 17 M-17 0 L17 0" />
          <path d="M0 -22 L-4 -14 L4 -14 Z" fill="currentColor" />
          <text x="-3" y="-25" fontSize="9" fill="currentColor" stroke="none">
            N
          </text>
        </svg>
      </div>

      <p className="text-[8pt] mt-1 text-black/70">
        Sem escala e sem régua. O que importa é o que aparece e o que fica de fora.
      </p>

      {/* ── Legenda para a turma preencher ────────────── */}
      <section className="mt-3">
        <h2 className="text-[9pt] font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5">
          Nossa legenda — o símbolo e o que ele quer dizer aqui
        </h2>
        <div className="grid grid-cols-2 gap-x-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-2 py-[3px]">
              <span className="w-[22px] h-[22px] border border-black shrink-0" />
              <span className="flex-1 border-b border-black/60 h-[18px]" />
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-3 pt-1.5 border-t border-black text-[8pt]">
        Guarde esta folha. Depois da expedição, a turma volta a ela com o mapa da plataforma do
        lado — e é aí que se descobre o que a gente sabia sem saber.
      </footer>
    </article>
  );
}

/**
 * A folha de símbolos, para recortar ou copiar.
 *
 * As perguntas vêm impressas junto de cada símbolo porque é a pergunta
 * que faz a criança lembrar. "Lugar de memória" não diz nada; "o que já
 * existiu aqui e não existe mais?" faz a sala inteira falar ao mesmo
 * tempo.
 */
export function FolhaDeSimbolos() {
  return (
    <article className="ficha-folha text-black">
      <header className="border-b-2 border-black pb-2 mb-3">
        <p className="text-[8pt] uppercase tracking-widest">
          Oceano na Escola · Instituto Ecosurf
        </p>
        <h1 className="text-[15pt] font-bold leading-tight">Símbolos do nosso mapa</h1>
        <p className="text-[9pt]">
          Marque no desenho do seu grupo tudo o que reconhecer. Símbolo que ninguém soube onde pôr
          também é informação: escreva a dúvida na margem.
        </p>
      </header>

      {FAMILIAS.map((f) => (
        <section key={f.id} className="mb-4 break-inside-avoid">
          <h2 className="text-[9.5pt] font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1">
            {f.titulo}
          </h2>
          <p className="text-[8pt] leading-snug border-l-[3px] border-black pl-2 py-0.5 mb-2">
            {f.descricao}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {f.simbolos.map((s) => (
              <div key={s.slug} className="flex items-start gap-2 break-inside-avoid">
                <span className="inline-flex items-center justify-center w-[28px] h-[28px] border-2 border-black shrink-0 mt-[1px]">
                  {f.id === "social" ? (
                    <SimboloSocial slug={s.slug} tamanho={17} />
                  ) : (
                    <Glifo slug={s.slug} tamanho={17} />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-[9pt] font-semibold leading-tight">{s.nome}</div>
                  <div className="text-[8pt] leading-tight text-black/75">{s.pergunta}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <footer className="pt-1.5 border-t border-black text-[8pt]">
        Os símbolos de cima são os mesmos do mapa público da plataforma: o que a turma marcar ali
        vira hipótese, e a expedição confere. Os de baixo ficam com a escola — memória e uso do
        lugar não se publica sobre o bairro de ninguém.
      </footer>
    </article>
  );
}

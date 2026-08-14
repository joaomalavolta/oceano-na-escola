import { Glifo } from "@/components/mapa/icones";
import { SimboloSocial } from "./simbolos";

/**
 * Um mapa de cartografia social já pronto.
 *
 * Existe para responder à pergunta que todo professor faz antes da
 * primeira oficina: "mas como é que fica no fim?". Descrever o método
 * não responde; ver um pronto responde.
 *
 * O território é fictício — Praia do Sonho não é a praia de ninguém —
 * e isso é deliberado por duas razões. Um exemplo de praia real seria
 * copiado em vez de servir de referência, e o mapa de uma comunidade
 * real traria para uma página da plataforma coisas ("aqui é perigoso",
 * "aqui ninguém deixa ir") que não se publica sobre o bairro de
 * ninguém.
 *
 * É desenho de turma, não planta baixa: proporção torta, letra de mão,
 * anotação na margem. Um exemplo bonito demais faria a turma achar que
 * fez errado.
 */

const AREIA = "#f4e4c1";
const MAR = "#bfe3ef";
const VERDE = "#cfe3b8";
const RUA = "#e8e5df";
const TINTA = "#1a2b3c";

/** Um símbolo colocado no mapa, com a etiqueta escrita ao lado. */
function Marca({
  x,
  y,
  slug,
  social,
  rotulo,
  ancora = "start",
}: {
  x: number;
  y: number;
  slug: string;
  social?: boolean;
  rotulo: string;
  ancora?: "start" | "end";
}) {
  const dx = ancora === "start" ? 16 : -16;
  return (
    <g>
      <rect x={x - 11} y={y - 11} width={22} height={22} fill="#fff" stroke={TINTA} strokeWidth={1.5} />
      <g transform={`translate(${x - 7} ${y - 7})`} color={TINTA}>
        {social ? <SimboloSocial slug={slug} tamanho={14} /> : <Glifo slug={slug} tamanho={14} />}
      </g>
      <text
        x={x + dx}
        y={y + 4}
        textAnchor={ancora}
        fontSize={10.5}
        fill={TINTA}
        style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui, sans-serif" }}
      >
        {rotulo}
      </text>
    </g>
  );
}

export function MapaExemplo({ className }: { className?: string }) {
  return (
    <figure className={className}>
      <svg
        viewBox="0 0 760 482"
        className="w-full h-auto border-2 border-black bg-white"
        role="img"
        aria-label="Exemplo de mapa de cartografia social de um trecho de praia fictício, com símbolos da plataforma e da camada social colocados pela turma"
      >
        {/* ── O território ─────────────────────────────── */}
        <rect width="760" height="482" fill="#fffdf7" />

        {/* Mar, com a linha da arrebentação desenhada à mão */}
        <path d="M0 0 H760 V120 C620 150 520 100 380 132 C240 162 130 118 0 142 Z" fill={MAR} />
        <path
          d="M0 142 C130 118 240 162 380 132 C520 100 620 150 760 120"
          fill="none"
          stroke={TINTA}
          strokeWidth={2}
        />
        <path
          d="M40 96 c14-7 26 7 40 0 M180 84 c14-7 26 7 40 0 M520 76 c14-7 26 7 40 0 M650 100 c14-7 26 7 40 0"
          fill="none"
          stroke={TINTA}
          strokeWidth={1.4}
          opacity={0.55}
        />
        <text x={54} y={52} fontSize={17} fill={TINTA} style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui, sans-serif" }}>
          MAR
        </text>

        {/* Areia */}
        <path
          d="M0 142 C130 118 240 162 380 132 C520 100 620 150 760 120 V250 C600 268 460 236 320 258 C200 276 100 250 0 262 Z"
          fill={AREIA}
        />

        {/* Restinga */}
        <path
          d="M0 262 C100 250 200 276 320 258 C460 236 600 268 760 250 V318 C600 336 440 306 300 326 C190 342 90 320 0 330 Z"
          fill={VERDE}
        />
        <path
          d="M0 262 C100 250 200 276 320 258 C460 236 600 268 760 250"
          fill="none"
          stroke={TINTA}
          strokeWidth={1.6}
          strokeDasharray="7 4"
        />

        {/* Rua e quadras */}
        <path d="M0 330 C90 320 190 342 300 326 C440 306 600 336 760 318 V368 H0 Z" fill={RUA} />
        <path
          d="M0 330 C90 320 190 342 300 326 C440 306 600 336 760 318"
          fill="none"
          stroke={TINTA}
          strokeWidth={1.8}
        />
        <path d="M0 368 H760" stroke={TINTA} strokeWidth={1.8} />
        <text x={306} y={356} fontSize={12} fill={TINTA} style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui, sans-serif" }}>
          Av. Beira-Mar
        </text>

        {/* Quadras do bairro */}
        {[40, 190, 340, 490, 640].map((x) => (
          <rect key={x} x={x} y={382} width={104} height={60} fill="#fff" stroke={TINTA} strokeWidth={1.4} />
        ))}
        <text x={372} y={418} fontSize={11.5} fill={TINTA} style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui, sans-serif" }}>
          bairro
        </text>

        {/* Córrego que corta tudo e chega ao mar */}
        <path
          d="M232 442 C238 400 214 372 236 330 C252 296 226 272 246 250 C262 228 240 190 252 150"
          fill="none"
          stroke="#5c8fb0"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <path
          d="M232 442 C238 400 214 372 236 330 C252 296 226 272 246 250 C262 228 240 190 252 150"
          fill="none"
          stroke={TINTA}
          strokeWidth={1.2}
        />

        {/* ── O que a turma marcou ─────────────────────── */}
        {/* As marcas vão em faixas, e cada faixa reserva a largura do
            rótulo mais longo dela. Espalhadas "onde couber", como
            estavam, os rótulos se atropelavam — e num mapa de legenda
            escrita à mão isso não é detalhe: é o texto ficando ilegível
            justamente onde ele carrega a informação. */}

        {/* Faixa da areia, alta */}
        <Marca x={252} y={166} slug="corrego" rotulo="foz do córrego" />
        <Marca x={470} y={166} slug="residuos" rotulo="junta muito lixo aqui" />

        {/* Faixa da areia, meio */}
        <Marca x={110} y={202} slug="pesca" social rotulo="pescaria da madrugada" />
        <Marca x={714} y={202} slug="avifauna" rotulo="maçaricos de manhã" ancora="end" />

        {/* Faixa da areia, baixa */}
        <Marca x={186} y={236} slug="esgoto" rotulo="cheiro quando chove" />
        <Marca x={714} y={236} slug="microplasticos" rotulo="linha de deixa" ancora="end" />
        <Marca x={430} y={236} slug="banho" social rotulo="a criançada entra aqui" />

        {/* Faixa da restinga */}
        <Marca x={110} y={292} slug="perigo" social rotulo="valão aberto" />
        <Marca x={352} y={292} slug="memoria" social rotulo="aqui tinha dunas" />
        <Marca x={714} y={292} slug="restinga" rotulo="restinga pisoteada" ancora="end" />

        {/* Faixa da rua */}
        <Marca x={110} y={352} slug="caminho" social rotulo="descida da escola" />
        <Marca x={714} y={352} slug="encontro" social rotulo="quiosque, roda de samba" ancora="end" />

        {/* Faixa do bairro */}
        <Marca x={470} y={412} slug="descarte" rotulo="entulho no fim da rua" />
        <Marca x={714} y={412} slug="gosto" social rotulo="pôr do sol" ancora="end" />

        {/* A escola */}
        <g>
          <rect x={78} y={382} width={104} height={60} fill="#fff" stroke={TINTA} strokeWidth={2.4} />
          <g transform="translate(118 398)" color={TINTA}>
            <Glifo slug="escola" tamanho={20} />
          </g>
          <text x={130} y={434} textAnchor="middle" fontSize={11} fill={TINTA} style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui, sans-serif" }}>
            nossa escola
          </text>
        </g>

        {/* Anotações de margem, que é onde mora o melhor do desenho */}
        <text x={16} y={182} fontSize={11} fill={TINTA} style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui, sans-serif" }}>
          areia
        </text>
        <text x={16} y={300} fontSize={11} fill={TINTA} style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui, sans-serif" }}>
          restinga
        </text>

        {/* Hipótese escrita pelo grupo — o que a oficina produz de mais útil */}
        {/* A caixa vai no mar, que é a única área vazia do desenho.
            Onde estava, cobria o símbolo do descarte — e uma caixa de
            texto por cima de um símbolo é a forma mais rápida de perder
            a informação que ela deveria explicar. */}
        <g>
          <path d="M452 74 L468 154" stroke={TINTA} strokeWidth={1.2} />
          <rect x={214} y={26} width={252} height={46} fill="#fff" stroke={TINTA} strokeWidth={1.4} />
          <text x={222} y={44} fontSize={10.5} fill={TINTA} style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui, sans-serif" }}>
            HIPÓTESE: tem mais lixo perto da foz
          </text>
          <text x={222} y={60} fontSize={10.5} fill={TINTA} style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui, sans-serif" }}>
            porque o córrego traz da cidade. Equipe 2.
          </text>
        </g>

        {/* Rosa dos ventos, torta como se desenha à mão */}
        <g transform="translate(714 62)" stroke={TINTA} fill="none" strokeWidth={1.6}>
          <circle r={20} />
          <path d="M0 -20 L0 20 M-20 0 L20 0" />
          <path d="M0 -26 L-5 -16 L5 -16 Z" fill={TINTA} />
          <text x={-3.5} y={-30} fontSize={11} fill={TINTA} stroke="none" style={{ fontFamily: "ui-rounded, system-ui, sans-serif" }}>
            N
          </text>
        </g>

        {/* Escala declarada como o que é */}
        <text x={16} y={470} fontSize={10} fill={TINTA} style={{ fontFamily: "ui-rounded, system-ui, sans-serif" }}>
          sem escala — desenhado de memória pela turma antes da saída
        </text>
      </svg>

      <figcaption className="text-[11px] text-muted-foreground mt-2 leading-relaxed print:text-black">
        Exemplo de mapa produzido por uma turma. O território é fictício. Repare no que ele tem e
        um mapa de satélite não teria: o cheiro depois da chuva, a pescaria de madrugada, o lugar
        onde havia dunas, a hipótese escrita à mão. É disso que sai a decisão de onde amostrar.
      </figcaption>
    </figure>
  );
}

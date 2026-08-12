"use client";

export interface FatiaDoGrupo {
  cor: string;
  nome: string;
  quantidade: number;
}

/** O que o pino precisa saber de cada ocorrência do grupo. */
interface Composto {
  protocolo_cor: string | null;
  protocolo_nome: string | null;
}

interface Props {
  /** Quantas ocorrências o grupo reúne. */
  quantidade: number;
  /** Composição por protocolo, para o anel. Uma fatia por cor. */
  fatias: FatiaDoGrupo[];
  titulo: string;
  onClick: () => void;
}

const CIRCUNFERENCIA = 2 * Math.PI * 50;

/** Cor de quem não tem protocolo com cor definida — a mesma do pino solto. */
const COR_PADRAO = "#a63d40";

/**
 * A composição do grupo, por protocolo.
 *
 * Ordenada da maior fatia para a menor, com desempate pelo nome: a ordem
 * precisa ser a mesma entre dois renders do mesmo grupo, senão o anel
 * gira sozinho quando o React reaproveita o marcador.
 */
export function composicaoDoGrupo(itens: Composto[]): FatiaDoGrupo[] {
  const conta = new Map<string, FatiaDoGrupo>();
  for (const o of itens) {
    const nome = o.protocolo_nome ?? "Sem protocolo";
    const fatia = conta.get(nome);
    if (fatia) fatia.quantidade += 1;
    else conta.set(nome, { cor: o.protocolo_cor ?? COR_PADRAO, nome, quantidade: 1 });
  }
  return [...conta.values()].sort(
    (a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome)
  );
}

/**
 * A mesma composição do anel, em texto — para o tooltip e para quem usa
 * leitor de tela, que não enxerga o anel (ele é `aria-hidden`).
 */
export function resumoDoGrupo(fatias: FatiaDoGrupo[]): string {
  return fatias.map((f) => (f.quantidade > 1 ? `${f.nome} (${f.quantidade})` : f.nome)).join(", ");
}

/**
 * O pino de um grupo de ocorrências.
 *
 * Redondo, e não em gota como o pino individual: a forma diz que aquilo
 * não é um ponto no território, é uma contagem de pontos.
 *
 * O anel mostra de que protocolos o grupo é feito, na proporção de
 * cada um. Sem ele, um grupo misto tinha de ficar de cor neutra — e cor
 * neutra é informação jogada fora: o mapa sabia que ali havia três
 * ocorrências de esgoto e uma de restinga, e não contava. Com o anel,
 * dá para ler a composição sem aproximar.
 *
 * Clicar aproxima até o grupo se desfazer.
 */
export function PinoAgrupado({ quantidade, fatias, titulo, onClick }: Props) {
  // Cresce um pouco com o tamanho do grupo, com teto: sem limite, um
  // grupo grande viraria um disco que esconde o mapa.
  const tamanho = Math.min(48, 28 + Math.log2(quantidade) * 6);
  const total = fatias.reduce((s, f) => s + f.quantidade, 0) || 1;

  // Cada fatia vira um arco: comprimento proporcional à quantidade e
  // início onde a anterior terminou. Começa no topo (o -rotate-90 do svg)
  // e anda no sentido horário, que é como se lê um gráfico de setores.
  // Os deslocamentos são calculados de uma vez, e não acumulados dentro
  // do map, para não haver variável mudando durante o render.
  const arcos: { cor: string; comprimento: number; inicio: number }[] = [];
  let percorrido = 0;
  for (const f of fatias) {
    const comprimento = (f.quantidade / total) * CIRCUNFERENCIA;
    arcos.push({ cor: f.cor, comprimento, inicio: percorrido });
    percorrido += comprimento;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      className="relative flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
      style={{ width: tamanho, height: tamanho }}
    >
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-md"
        aria-hidden="true"
      >
        {/* Miolo branco: separa o anel do número e dá contraste sobre
            satélite, onde fundo escuro engoliria as cores. */}
        <circle cx="60" cy="60" r="38" fill="#fff" />
        {arcos.map((a, i) => (
          <circle
            key={i}
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={a.cor}
            strokeWidth="20"
            strokeDasharray={`${a.comprimento} ${CIRCUNFERENCIA - a.comprimento}`}
            strokeDashoffset={-a.inicio}
          />
        ))}
      </svg>

      <span
        className="relative font-bold text-foreground tabular-nums"
        style={{ fontSize: tamanho > 38 ? 13 : 11 }}
      >
        {quantidade}
      </span>
    </button>
  );
}

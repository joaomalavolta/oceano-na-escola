"use client";

interface Props {
  /** Quantas ocorrências o grupo reúne. */
  quantidade: number;
  /** Cor do protocolo quando o grupo é de um só; neutra quando mistura. */
  cor: string | null;
  titulo: string;
  onClick: () => void;
}

/**
 * O pino de um grupo de ocorrências.
 *
 * Redondo, e não em gota como o pino individual: a forma diz que aquilo
 * não é um ponto no território, é uma contagem de pontos. Clicar
 * aproxima o mapa até o grupo se desfazer.
 *
 * A cor segue o protocolo quando o grupo inteiro é do mesmo; misturando
 * protocolos, fica neutra — pintar de um só enganaria sobre o que está
 * embaixo.
 */
export function PinoAgrupado({ quantidade, cor, titulo, onClick }: Props) {
  // Cresce um pouco com o tamanho do grupo, com teto: sem limite, um
  // grupo grande viraria um disco que esconde o mapa.
  const tamanho = Math.min(46, 26 + Math.log2(quantidade) * 6);

  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      className="flex items-center justify-center rounded-full border-2 border-white text-white font-bold shadow-md transition-transform hover:scale-110 cursor-pointer"
      style={{
        width: tamanho,
        height: tamanho,
        backgroundColor: cor ?? "var(--color-primary)",
        fontSize: tamanho > 36 ? 13 : 11,
      }}
    >
      {quantidade}
    </button>
  );
}

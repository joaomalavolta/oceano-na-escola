import type { ReactNode } from "react";

/**
 * As peças de que as duas fichas são feitas.
 *
 * Tudo aqui é desenhado para a impressora, não para a tela: traço
 * preto, fundo branco, sem cor de preenchimento. Impressora de escola é
 * jato de tinta com cartucho pela metade — o que for cinza-claro sai
 * invisível, e o que for área chapada gasta tinta que a escola paga.
 */

/** Linha para escrever à mão, com o rótulo em cima. */
export function Campo({
  rotulo,
  largura = "flex-1",
  unidade,
}: {
  rotulo: string;
  largura?: string;
  unidade?: string | null;
}) {
  return (
    <div className={`${largura} min-w-0`}>
      <div className="text-[8pt] uppercase tracking-wide text-black/70 leading-tight">
        {rotulo}
        {unidade ? ` (${unidade})` : ""}
      </div>
      {/* Altura fixa e não `min-h`: a linha precisa caber a letra de um
          aluno de 12 anos, que é maior que a de um adulto. */}
      <div className="border-b border-black h-[22px]" />
    </div>
  );
}

/** Quadradinho para marcar. */
export function Caixa({ rotulo }: { rotulo: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9pt] whitespace-nowrap">
      <span className="inline-block w-[11px] h-[11px] border border-black" />
      {rotulo}
    </span>
  );
}

export function Titulo({ children, numero }: { children: ReactNode; numero?: number }) {
  return (
    <h2 className="text-[10pt] font-bold uppercase tracking-wide border-b-2 border-black pb-0.5 mb-2 flex items-baseline gap-2">
      {numero !== undefined && (
        <span className="inline-flex items-center justify-center w-[18px] h-[18px] border border-black text-[9pt] shrink-0">
          {numero}
        </span>
      )}
      {children}
    </h2>
  );
}

/** Aviso curto, com traço grosso à esquerda — sobrevive ao xerox. */
export function Nota({ children }: { children: ReactNode }) {
  return (
    <p className="text-[8.5pt] leading-snug border-l-[3px] border-black pl-2 py-0.5">{children}</p>
  );
}

/**
 * O cabeçalho comum às duas fichas.
 *
 * Repetido em toda folha de propósito: as fichas se separam na mesa do
 * professor no dia seguinte, e folha sem identificação vira dado órfão
 * — quem lembra de qual equipe era a folha três dias depois?
 */
export function Cabecalho({
  titulo,
  protocolo,
  versao,
  direita,
}: {
  titulo: string;
  protocolo: string;
  versao: string;
  direita?: ReactNode;
}) {
  return (
    <header className="border-b-2 border-black pb-2 mb-3 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[8pt] uppercase tracking-widest">
          Oceano na Escola · Instituto Ecosurf
        </p>
        <h1 className="text-[15pt] font-bold leading-tight">{titulo}</h1>
        <p className="text-[9pt]">
          Protocolo <strong>{protocolo}</strong> · ficha versão {versao}
        </p>
      </div>
      {direita}
    </header>
  );
}

/** Linhas em branco para texto corrido, com pauta. */
export function Pauta({ linhas = 3 }: { linhas?: number }) {
  return (
    <div>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="border-b border-black/60 h-[20px]" />
      ))}
    </div>
  );
}

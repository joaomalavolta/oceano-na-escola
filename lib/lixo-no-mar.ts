/**
 * Lixo no mar (LIM): quanto, de quê e de que marca, em cada ponto.
 *
 * Só lógica pura — o mesmo arquivo serve ao formulário de campo, à fila
 * do aparelho, à revisão e ao balão do mapa. As regras de verdade estão
 * no banco (tabelas lixo_no_ponto*); aqui é para a tela não deixar
 * passar o que o banco vai recusar.
 */

/**
 * Material predominante: os grupos de material da lista de RES, mais
 * "misto" para quando nenhum predomina. Mesma lista do `check` do banco.
 */
export const MATERIAIS = [
  { id: "plastico", nome: "Plástico" },
  { id: "isopor", nome: "Isopor e espumas" },
  { id: "metal", nome: "Metal" },
  { id: "vidro", nome: "Vidro" },
  { id: "papel", nome: "Papel" },
  { id: "borracha", nome: "Borracha" },
  { id: "tecido", nome: "Tecido" },
  { id: "madeira", nome: "Madeira" },
  { id: "saude", nome: "Saúde" },
  { id: "outros", nome: "Outros" },
  { id: "misto", nome: "Misto" },
] as const;

export type Material = (typeof MATERIAIS)[number]["id"];

export function nomeDoMaterial(m: string | null | undefined): string | null {
  return MATERIAIS.find((x) => x.id === m)?.nome ?? null;
}

export interface MarcaContada {
  marca: string;
  quantidade: number;
}

export interface LixoNoPonto {
  /** Quantidade estimada de itens no ponto. */
  quantidadeEstimada: number | null;
  sacos: number | null;
  /** Tamanho do saco, quando se sabe. Sem ele, "sacos" não se compara. */
  litrosPorSaco: number | null;
  material: Material | null;
  /** Contagem por tipo: id do item de RES → quantidade. */
  itens: Record<number, number>;
  marcas: MarcaContada[];
}

export const LIXO_VAZIO: LixoNoPonto = {
  quantidadeEstimada: null,
  sacos: null,
  litrosPorSaco: null,
  material: null,
  itens: {},
  marcas: [],
};

/**
 * A chave da marca: a MESMA conta do banco (`marca_chave`). Minúscula,
 * sem acento, espaços colapsados — "Marca Á" e " marca  a" são uma só.
 */
export function chaveDaMarca(marca: string): string {
  const de = "áàâãäéèêëíìîïóòôõöúùûüçñ";
  const para = "aaaaaeeeeiiiiooooouuuucn";
  return Array.from(marca.trim().toLowerCase())
    .map((c) => {
      const i = de.indexOf(c);
      return i >= 0 ? para[i] : c;
    })
    .join("")
    .replace(/\s+/g, " ");
}

export function somaDosItens(l: LixoNoPonto): number {
  return Object.values(l.itens).reduce((s, n) => s + (n > 0 ? n : 0), 0);
}

/**
 * A magnitude do ponto no mapa: a quantidade estimada; sem ela, a soma
 * da contagem por tipo; sem nenhuma das duas, nula (presença).
 */
export function quantidadeDoPonto(l: LixoNoPonto): number | null {
  if (l.quantidadeEstimada !== null) return l.quantidadeEstimada;
  const soma = somaDosItens(l);
  return soma > 0 ? soma : null;
}

/** Junta marcas repetidas pela chave, somando, e descarta as vazias. */
export function juntarMarcas(marcas: MarcaContada[]): MarcaContada[] {
  const porChave = new Map<string, MarcaContada>();
  for (const m of marcas) {
    const nome = m.marca.trim().replace(/\s+/g, " ");
    if (nome === "" || !(m.quantidade > 0)) continue;
    const k = chaveDaMarca(nome);
    const atual = porChave.get(k);
    if (atual) atual.quantidade += Math.round(m.quantidade);
    else porChave.set(k, { marca: nome, quantidade: Math.round(m.quantidade) });
  }
  return [...porChave.values()];
}

export function temAlgumDado(l: LixoNoPonto): boolean {
  return (
    l.quantidadeEstimada !== null ||
    l.sacos !== null ||
    l.material !== null ||
    somaDosItens(l) > 0 ||
    juntarMarcas(l.marcas).length > 0
  );
}

/** Problemas em português, ou lista vazia. Mesmos limites do banco. */
export function problemasDoLixo(l: LixoNoPonto): string[] {
  const p: string[] = [];
  const inteiro = (n: number | null, max: number) => n === null || (Number.isInteger(n) && n >= 0 && n <= max);
  if (!inteiro(l.quantidadeEstimada, 100000)) p.push("A quantidade estimada é um número inteiro de itens.");
  if (l.sacos !== null && !(l.sacos >= 0 && l.sacos <= 1000)) p.push("Número de sacos fora da faixa.");
  if (l.litrosPorSaco !== null) {
    if (l.sacos === null) p.push("Informe quantos sacos antes do tamanho do saco.");
    else if (!(Number.isInteger(l.litrosPorSaco) && l.litrosPorSaco >= 1 && l.litrosPorSaco <= 1000))
      p.push("O tamanho do saco é em litros, de 1 a 1000.");
  }
  for (const n of Object.values(l.itens)) {
    if (!(Number.isInteger(n) && n >= 0 && n <= 100000)) {
      p.push("A contagem por tipo aceita só números inteiros.");
      break;
    }
  }
  if (l.marcas.some((m) => m.marca.trim().length > 80)) p.push("Nome de marca longo demais.");
  return p;
}

/** "2 sacos de 100 L", "1,5 saco", ou nulo. */
export function volumeLegivel(sacos: number | null, litros: number | null): string | null {
  if (sacos === null) return null;
  const n = sacos.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const palavra = sacos > 1 ? "sacos" : "saco";
  return litros ? `${n} ${palavra} de ${litros} L` : `${n} ${palavra}`;
}

/** O resumo de uma linha, para a revisão e o balão. */
export function resumoDoLixo(d: {
  quantidade_estimada: number | null;
  sacos: number | null;
  litros_por_saco: number | null;
  material: string | null;
  marcas?: MarcaContada[];
}): string {
  const partes = [
    d.quantidade_estimada !== null ? `~${d.quantidade_estimada.toLocaleString("pt-BR")} itens` : null,
    volumeLegivel(d.sacos, d.litros_por_saco),
    nomeDoMaterial(d.material),
    d.marcas && d.marcas.length > 0 ? `${d.marcas.length} marca(s)` : null,
  ].filter(Boolean);
  return partes.join(" · ");
}

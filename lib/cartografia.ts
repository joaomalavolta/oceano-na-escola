/**
 * Cartografia social do território, antes da saída de campo.
 *
 * A turma desenha o pedaço de costa que vai visitar **antes** de
 * visitá-lo, com o que já sabe: onde o pai pesca, onde a criança entra
 * na água, de onde vem o cheiro quando chove, onde ninguém deixa ir.
 * Depois a expedição confere.
 *
 * Isso não é ilustração para a aula render mais. Muda o dado:
 *
 * - **Decide onde amostrar.** Um trecho escolhido no mapa de satélite é
 *   um trecho qualquer. Um trecho escolhido porque a turma sabe que ali
 *   sai a drenagem depois da chuva é uma hipótese.
 * - **Faz a criança chegar com pergunta.** Quem já desenhou o lugar sai
 *   a campo para conferir o que desenhou, e não para cumprir tarefa.
 * - **Registra o que a plataforma não guarda.** Memória, uso, medo e
 *   afeto não cabem em contagem de itens por m² — e são metade do que a
 *   turma tem a dizer sobre o próprio bairro.
 *
 * O desenho é da turma e fica com a escola. O que dele vira dado é o
 * que a expedição confirmar em campo, com coordenada e foto.
 */

/** Uma família de símbolos, e o que ela quer dizer. */
export interface SimboloCartografia {
  slug: string;
  nome: string;
  /** A pergunta que faz a turma se lembrar de marcar este símbolo. */
  pergunta: string;
}

export interface FamiliaDeSimbolos {
  id: "protocolo" | "social";
  titulo: string;
  descricao: string;
  simbolos: SimboloCartografia[];
}

/**
 * O que a plataforma registra.
 *
 * Os slugs são os mesmos de `components/mapa/icones.tsx`, e não por
 * economia: o símbolo que a turma desenha na cartolina é o mesmo que
 * vai aparecer no mapa público depois da expedição. É essa
 * correspondência que faz a criança reconhecer o próprio trabalho no
 * mapa da rede — e ela se perde no instante em que alguém inventar um
 * desenho novo aqui.
 */
const DA_PLATAFORMA: FamiliaDeSimbolos = {
  id: "protocolo",
  titulo: "O que a expedição vai medir",
  descricao:
    "Estes símbolos são os mesmos do mapa da rede. O que a turma marcar aqui vira hipótese: em campo, confere-se se está lá mesmo — e aí ganha coordenada, foto e lugar no mapa público.",
  simbolos: [
    {
      slug: "residuos",
      nome: "Lixo acumulado",
      pergunta: "Onde sempre tem mais lixo? Muda quando o mar avança?",
    },
    {
      slug: "microplasticos",
      nome: "Faixa de deixa",
      pergunta: "Onde fica a linha de coisinhas que o mar deixa na areia?",
    },
    {
      slug: "esgoto",
      nome: "Cano, valão ou água suja",
      pergunta: "De onde vem o cheiro quando chove? Onde a água sai escura?",
    },
    {
      slug: "corrego",
      nome: "Córrego ou foz",
      pergunta: "Onde um rio ou córrego encontra o mar?",
    },
    {
      slug: "descarte",
      nome: "Descarte irregular",
      pergunta: "Onde alguém joga entulho, móvel velho ou queima lixo?",
    },
    {
      slug: "restinga",
      nome: "Vegetação de restinga",
      pergunta: "Onde a vegetação baixa segura a areia? Alguém pisa nela?",
    },
    {
      slug: "avifauna",
      nome: "Aves e bichos",
      pergunta: "Onde os pássaros ficam? Já viram bicho enroscado ou encalhado?",
    },
    {
      slug: "agua",
      nome: "Ponto de água",
      pergunta: "Onde vale medir a água sempre no mesmo lugar?",
    },
  ],
};

/**
 * O que só a turma sabe.
 *
 * Nada disto entra na plataforma, e é de propósito: a plataforma guarda
 * o que se pode medir e publicar sem expor ninguém. Uso, memória, medo
 * e afeto ficam com a escola — e são o que faz a turma escolher onde
 * amostrar, que é a decisão mais importante da expedição inteira.
 */
const DA_TURMA: FamiliaDeSimbolos = {
  id: "social",
  titulo: "O que só quem mora ali sabe",
  descricao:
    "Isto não vai para o mapa público, e não deve ir: é a memória e o uso do lugar, e há coisas aqui que não se publica sobre ninguém. Fica com a escola, e é o que decide onde a expedição vai amostrar.",
  simbolos: [
    {
      slug: "pesca",
      nome: "Onde se pesca ou se cata",
      pergunta: "Quem tira comida ou renda daqui? Em que época?",
    },
    {
      slug: "banho",
      nome: "Onde se entra na água",
      pergunta: "Onde criança toma banho? Onde ninguém entra, e por quê?",
    },
    {
      slug: "encontro",
      nome: "Onde as pessoas se juntam",
      pergunta: "Onde tem roda, jogo, feira, festa, campinho?",
    },
    {
      slug: "caminho",
      nome: "Por onde se chega",
      pergunta: "Que caminho a gente faz até aqui? Passa ônibus? Dá para ir a pé?",
    },
    {
      slug: "memoria",
      nome: "Lugar de memória",
      pergunta: "O que já existiu aqui e não existe mais? Quem conta essa história?",
    },
    {
      slug: "perigo",
      nome: "Lugar de perigo",
      pergunta: "Onde é perigoso, e por quê? Buraco, corrente, vidro, movimento?",
    },
    {
      slug: "mudou",
      nome: "O que mudou",
      pergunta: "O que está diferente de quando os mais velhos eram crianças?",
    },
    {
      slug: "gosto",
      nome: "Lugar de que se gosta",
      pergunta: "Qual é o pedaço mais bonito? O que você mostraria a alguém de fora?",
    },
  ],
};

export const FAMILIAS: FamiliaDeSimbolos[] = [DA_PLATAFORMA, DA_TURMA];

export function familia(id: FamiliaDeSimbolos["id"]): FamiliaDeSimbolos {
  const f = FAMILIAS.find((x) => x.id === id);
  if (!f) throw new Error(`Família de símbolos desconhecida: ${id}`);
  return f;
}

/** Todos os slugs, para conferir que existe desenho para cada um. */
export function todosOsSlugs(): string[] {
  return FAMILIAS.flatMap((f) => f.simbolos.map((s) => s.slug));
}

// ── O roteiro da oficina ──────────────────────────────────────────────

export interface EtapaOficina {
  id: string;
  titulo: string;
  minutos: number;
  /** Quem conduz esta etapa. */
  conduz: "professor" | "facilitador" | "turma";
  objetivo: string;
  comoFazer: string[];
  /** O que existe no fim da etapa, em papel. */
  produz: string;
}

/**
 * Duas aulas de 50 minutos, que é o que uma escola consegue reservar.
 *
 * A ordem é deliberada e a primeira etapa é a que costuma ser cortada
 * por falta de tempo — e é a única insubstituível. Desenhar de memória,
 * antes de ver imagem de satélite, é o que traz à tona o que a turma
 * sabe. Depois da foto de satélite na parede ninguém mais se lembra de
 * nada que a foto não mostre.
 */
export const OFICINA: EtapaOficina[] = [
  {
    id: "memoria",
    titulo: "Desenhar de memória",
    minutos: 20,
    conduz: "turma",
    objetivo:
      "Trazer à tona o que a turma já sabe do lugar, antes de qualquer imagem oficial contaminar a lembrança.",
    comoFazer: [
      "Grupos de quatro a cinco, uma prancha em branco por grupo.",
      "Sem celular, sem mapa, sem satélite. Só o que cada um lembra.",
      "Comece pelo que é fácil: o mar, a rua, a escola, onde a gente entra na praia.",
      "Não corrija proporção nem distância. Mapa de memória não é planta baixa; o que importa é o que aparece e o que fica de fora.",
    ],
    produz: "Uma prancha por grupo, a lápis, sem legenda ainda.",
  },
  {
    id: "simbolos",
    titulo: "Colocar os símbolos",
    minutos: 20,
    conduz: "professor",
    objetivo:
      "Passar do desenho solto para uma linguagem comum — a mesma que a plataforma usa.",
    comoFazer: [
      "Distribua a folha de símbolos e leia as perguntas de cada um em voz alta.",
      "Cada grupo marca no próprio desenho o que reconhecer, usando o símbolo certo.",
      "Insista nos dois lados: o que a expedição vai medir e o que só quem mora ali sabe.",
      "Símbolo que ninguém soube onde pôr é informação: anote a dúvida na margem.",
    ],
    produz: "Prancha com legenda preenchida e dúvidas anotadas na margem.",
  },
  {
    id: "confronto",
    titulo: "Comparar com a imagem de satélite",
    minutos: 20,
    conduz: "facilitador",
    objetivo:
      "Ver o que a memória coletiva acerta, o que ela distorce e o que ela vê que o satélite não mostra.",
    comoFazer: [
      "Só agora projete o mapa da plataforma, na camada de satélite, no trecho da saída.",
      "Pergunte, nesta ordem: o que a gente desenhou e está lá? O que está lá e a gente não desenhou? O que a gente sabe e o satélite não mostra?",
      "A terceira pergunta é a mais importante da oficina. Cheiro, barulho, horário, quem usa o lugar — nada disso aparece numa imagem aérea.",
      "Marque na prancha, com outra cor, o que a comparação revelou.",
    ],
    produz: "Lista das três respostas, escrita, colada ao lado da prancha.",
  },
  {
    id: "hipoteses",
    titulo: "Escolher onde amostrar",
    minutos: 20,
    conduz: "professor",
    objetivo:
      "Transformar o mapa numa decisão de campo: onde as equipes vão trabalhar, e por quê.",
    comoFazer: [
      "Cada grupo propõe um trecho e escreve a hipótese numa frase: \"achamos que ali tem mais lixo porque…\".",
      "Compare as propostas e escolha as da saída. Registre quem propôs cada uma.",
      "Distribua as equipes pelos trechos escolhidos e anote na ficha do professor.",
      "Hipótese que a turma escreveu é o que dá sentido a contar bituca por três horas.",
    ],
    produz: "Trechos escolhidos, com a hipótese de cada um por escrito.",
  },
  {
    id: "depois",
    titulo: "Depois da saída — fechar o ciclo",
    minutos: 20,
    conduz: "professor",
    objetivo: "Voltar ao desenho com o dado na mão. É aqui que a oficina vira aprendizado.",
    comoFazer: [
      "Abra o mapa da plataforma com a expedição já publicada, ao lado das pranchas.",
      "Pergunte: a hipótese se confirmou? O que surpreendeu? O que a gente não tinha visto?",
      "O que sobrou de conversa e não coube em número vira uma História do Território, publicada pela escola.",
      "Guarde as pranchas. Na expedição do ano que vem, elas são o ponto de partida — e a comparação entre as duas é dado de verdade.",
    ],
    produz: "Uma História do Território escrita pela turma, e as pranchas arquivadas.",
  },
];

export function minutosTotais(etapas: EtapaOficina[] = OFICINA): number {
  return etapas.reduce((s, e) => s + e.minutos, 0);
}

// ── A prancha com o território real ───────────────────────────────────

/**
 * Quantos metros o mapa mostra por pixel, na latitude e no zoom dados.
 *
 * A fórmula é a do Web Mercator, e o cosseno da latitude não é
 * detalhe: sem ele a barra de escala erra por um fator que cresce com
 * a distância do equador. Em Itanhaém, a −24°, o erro seria de 9% —
 * suficiente para uma turma medir errado o trecho que escolheu.
 */
export function metrosPorPixel(latitude: number, zoom: number): number {
  return (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom);
}

export interface BarraDeEscala {
  metros: number;
  pixels: number;
  rotulo: string;
}

/**
 * Uma barra de escala com número redondo.
 *
 * Redondo importa: "247 m" numa régua impressa não serve para estimar
 * nada de cabeça, e é de cabeça que a turma vai estimar o trecho.
 */
export function barraDeEscala(
  latitude: number,
  zoom: number,
  larguraMaxPx = 160
): BarraDeEscala {
  const mpp = metrosPorPixel(latitude, zoom);
  const maximo = mpp * larguraMaxPx;

  const REDONDOS = [
    10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000,
  ];
  // O maior valor redondo que ainda cabe; se nenhum couber, o menor —
  // uma barra um pouco mais larga é melhor que barra nenhuma.
  const metros = [...REDONDOS].reverse().find((m) => m <= maximo) ?? REDONDOS[0];

  return {
    metros,
    pixels: Math.round(metros / mpp),
    rotulo: metros >= 1000 ? `${metros / 1000} km` : `${metros} m`,
  };
}

/** Coordenada em grau decimal, como se escreve num relatório. */
export function coordenadaLegivel(lat: number, lng: number): string {
  const eixo = (v: number, pos: string, neg: string) =>
    `${Math.abs(v).toFixed(5)}° ${v >= 0 ? pos : neg}`;
  return `${eixo(lat, "N", "S")}, ${eixo(lng, "L", "O")}`;
}

/** As etapas que cabem antes da saída — o "depois" é outra aula. */
export function etapasAntesDoCampo(): EtapaOficina[] {
  return OFICINA.filter((e) => e.id !== "depois");
}

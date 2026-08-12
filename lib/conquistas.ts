/**
 * Conquistas da escola.
 *
 * O plano de produção pede reconhecer expedições realizadas, territórios
 * monitorados, protocolos aplicados e tempo de monitoramento. Pede
 * também, na lista do que NÃO reaproveitar do Rio do Nosso Bairro,
 * "ranking de membros" — e é por isso que aqui não existe classificação
 * entre escolas nem entre estudantes.
 *
 * Cada conquista mede a escola contra o próprio percurso. Uma escola de
 * duas turmas num município pequeno não deveria aparecer atrás de uma
 * escola grande por ter menos gente: o que se reconhece é a
 * continuidade do monitoramento, não o volume comparado.
 *
 * Nada disso é gravado: tudo se deriva do que já está publicado. Sem
 * tabela de pontos para desincronizar do dado real.
 */

import type {
  PubExpedicao,
  PubIndicadorEscola,
  PubObservacaoPontual,
} from "./database.types";

export interface Conquista {
  id: string;
  nome: string;
  /** O que ela reconhece, em uma frase para o estudante ler. */
  descricao: string;
  /** Slug do glifo em components/mapa/icones.tsx. */
  icone: string;
  cor: string;
  atual: number;
  meta: number;
  conquistada: boolean;
  /** Texto do progresso, já com a unidade certa. */
  progresso: string;
}

/** Degraus de uma mesma conquista: alcança-se o próximo, não se perde o anterior. */
function degrau(valor: number, degraus: number[]): { meta: number; nivel: number } {
  for (let i = 0; i < degraus.length; i += 1) {
    if (valor < degraus[i]) return { meta: degraus[i], nivel: i };
  }
  return { meta: degraus[degraus.length - 1], nivel: degraus.length };
}

function inteiro(v: number): string {
  return v.toLocaleString("pt-BR");
}

export function calcularConquistas(
  indicador: PubIndicadorEscola | null,
  expedicoes: PubExpedicao[],
  ocorrencias: PubObservacaoPontual[],
  fotosPublicadas: number
): Conquista[] {
  const nExpedicoes = indicador?.expedicoes ?? expedicoes.length;
  const metros = indicador?.extensao_total_m ?? 0;
  const itens = indicador?.itens_catalogados ?? 0;
  const pontuais = indicador?.registros_pontuais ?? ocorrencias.length;

  const territorios = new Set(
    expedicoes.map((e) => e.territorio).filter((t): t is string => Boolean(t))
  ).size;

  const protocolos = new Set(ocorrencias.map((o) => o.protocolo)).size;

  // Meses distintos com saída de campo: é a medida de continuidade, e
  // não de volume — uma saída por mês vale mais que dez num dia só.
  const meses = new Set(expedicoes.map((e) => e.data_campo.slice(0, 7))).size;

  const definicoes: Omit<Conquista, "meta" | "conquistada" | "progresso">[] = [
    {
      id: "expedicoes",
      nome: "Escola em campo",
      descricao: "Saídas de campo realizadas e publicadas pela escola.",
      icone: "escola",
      cor: "#1e6a78",
      atual: nExpedicoes,
    },
    {
      id: "continuidade",
      nome: "Monitoramento contínuo",
      descricao: "Meses diferentes com saída de campo. O mapa nunca termina.",
      icone: "agua",
      cor: "#1f8a9e",
      atual: meses,
    },
    {
      id: "territorios",
      nome: "Territórios adotados",
      descricao: "Trechos distintos que a escola acompanha: praia, restinga, foz, manguezal.",
      icone: "restinga",
      cor: "#4a7c2d",
      atual: territorios,
    },
    {
      id: "protocolos",
      nome: "Olhar ampliado",
      descricao: "Protocolos diferentes aplicados em campo pela escola.",
      icone: "microplasticos",
      cor: "#7c5cbf",
      atual: protocolos,
    },
    {
      id: "itens",
      nome: "Catálogo de resíduos",
      descricao: "Itens contados e classificados nas fichas de campo.",
      icone: "residuos",
      cor: "#2d7d72",
      atual: itens,
    },
    {
      id: "ocorrencias",
      nome: "Ocorrências mapeadas",
      descricao: "Pontos registrados com coordenada: descarte, esgoto, supressão, fauna.",
      icone: "descarte",
      cor: "#a63d40",
      atual: pontuais,
    },
    {
      id: "extensao",
      nome: "Costa percorrida",
      descricao: "Metros de orla efetivamente caminhados e monitorados.",
      icone: "trilha",
      cor: "#8a5a2b",
      atual: metros,
    },
    {
      id: "galeria",
      nome: "Memória do território",
      descricao: "Fotos curadas pelo professor e publicadas na galeria da escola.",
      icone: "avifauna",
      cor: "#2f6f9f",
      atual: fotosPublicadas,
    },
  ];

  const DEGRAUS: Record<string, number[]> = {
    expedicoes: [1, 5, 10, 25],
    continuidade: [1, 3, 6, 12],
    territorios: [1, 2, 4],
    protocolos: [1, 2, 4],
    itens: [100, 500, 1000, 5000],
    ocorrencias: [5, 25, 100],
    extensao: [500, 2000, 10000],
    galeria: [1, 5, 20],
  };

  return definicoes.map((d) => {
    const { meta } = degrau(d.atual, DEGRAUS[d.id]);
    const conquistada = d.atual >= DEGRAUS[d.id][0];
    const progresso =
      d.id === "extensao"
        ? `${inteiro(d.atual)} m de ${inteiro(meta)} m`
        : `${inteiro(d.atual)} de ${inteiro(meta)}`;
    return { ...d, meta, conquistada, progresso };
  });
}

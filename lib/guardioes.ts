/**
 * O conteúdo da página do programa Guardiões Ecosurf.
 *
 * Fica em dado, e não solto no JSX, por uma razão só: a página promete
 * coisas, e promessa dá para conferir. Cada frente de observação diz se
 * já existe na plataforma ou se ainda está em definição, e a que já
 * existe aponta os protocolos que a sustentam — o teste ao lado confere
 * que eles existem de verdade. Uma escola de surf decide participar
 * lendo isto; anunciar um levantamento que a plataforma ainda não sabe
 * registrar custaria caro na primeira saída de campo.
 */

export type SituacaoDaFrente = "disponivel" | "em_definicao";

export interface Frente {
  id: string;
  titulo: string;
  texto: string;
  situacao: SituacaoDaFrente;
  /** Códigos dos protocolos que já registram esta frente. Vazio quando
   *  ela ainda está em definição. */
  protocolos: string[];
  /** Slug do glifo em components/mapa/icones.tsx. */
  icone: string;
}

export const FRENTES: Frente[] = [
  {
    id: "residuos",
    titulo: "Resíduos na praia",
    texto:
      "Contagem de resíduos e de microplásticos num trecho medido de areia, pelo mesmo protocolo que as escolas aplicam. Trecho medido é o que permite comparar uma praia com outra, e a mesma praia ao longo do ano.",
    situacao: "disponivel",
    protocolos: ["RES", "MIC"],
    icone: "residuos",
  },
  {
    id: "lixo-no-mar",
    titulo: "Lixo no mar",
    texto:
      "O que a prancha encontra: lixo boiando, rede e linha de pesca abandonadas, o acúmulo na linha de maré, o lixo na foz, os pellets na areia. Cada achado vira pino no mapa, com foto, no ponto em que foi visto.",
    situacao: "disponivel",
    protocolos: ["LIM"],
    icone: "lixo-mar",
  },
  {
    id: "esgoto",
    titulo: "Esgoto e lançamentos na praia",
    texto:
      "O ponto de lançamento marcado no lugar exato, com foto e data. Aparece no mapa como ocorrência, na coordenada em que está — problema ambiental que não se pode apontar não se pode cobrar.",
    situacao: "disponivel",
    protocolos: ["ESG"],
    icone: "esgoto",
  },
  {
    id: "descarte",
    titulo: "Descarte irregular",
    texto:
      "Entulho, móveis, podas e lixo deixados na orla, na restinga ou na beira do rio. Também vira pino no mapa, no ponto em que foi encontrado.",
    situacao: "disponivel",
    protocolos: ["DES"],
    icone: "descarte",
  },
  {
    id: "restinga-dano",
    titulo: "Danos ao jundu e à restinga",
    texto:
      "O protocolo de restinga registra hoje a área afetada: onde a vegetação foi suprimida, pisoteada, aterrada ou tomada por espécie invasora.",
    situacao: "disponivel",
    protocolos: ["RST"],
    icone: "restinga",
  },
  {
    id: "jundu-preservado",
    titulo: "Áreas preservadas de jundu",
    texto:
      "Mapear o que ainda está de pé, e não só o que foi perdido. O jeito de medir — por área, por trecho de orla ou por ponto — ainda está sendo definido com a equipe do Ecosurf.",
    situacao: "em_definicao",
    protocolos: [],
    icone: "restinga",
  },
  {
    id: "rios",
    titulo: "Poluição nos rios",
    texto:
      "Os rios que chegam à praia trazem o que acontece na bacia inteira. Quais ocorrências de rio entram na lista de registro ainda está em definição.",
    situacao: "em_definicao",
    protocolos: [],
    icone: "agua",
  },
];

export const ROTULO_DA_SITUACAO: Record<SituacaoDaFrente, string> = {
  disponivel: "Já na plataforma",
  em_definicao: "Em definição",
};

export interface PassoDoGuardiao {
  n: string;
  titulo: string;
  texto: string;
}

export const PASSOS: PassoDoGuardiao[] = [
  {
    n: "1",
    titulo: "A escola de surf se cadastra",
    texto:
      "O instrutor responsável cria a conta e cadastra a escola de surf e as turmas de aula. O cadastro passa por análise do Instituto Ecosurf antes de a escola aparecer no mapa.",
  },
  {
    n: "2",
    titulo: "O registro acontece na praia",
    texto:
      "Com o celular, no ponto em que a ocorrência está: foto, coordenada e o que foi visto. A contagem de resíduos por trecho usa a ficha de campo, como nas escolas.",
  },
  {
    n: "3",
    titulo: "O instrutor confere antes de publicar",
    texto:
      "Nada vai direto ao público. O dado passa pelas mesmas etapas de revisão das escolas, e as fotos pela mesma curadoria.",
  },
  {
    n: "4",
    titulo: "O Guardião entra no mapa da rede",
    texto:
      "A escola de surf aparece com pino próprio, ao lado das escolas, e o que ela registrou soma com o delas no mesmo mapa e nos mesmos dados abertos.",
  },
];

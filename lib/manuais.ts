/**
 * Os manuais da plataforma.
 *
 * Conteúdo separado da tela de propósito: quem vai corrigir uma frase
 * do manual do aluno não deveria precisar abrir um componente React
 * para isso, e os dois manuais compartilham a mesma folha impressa.
 *
 * O que está escrito aqui descreve a plataforma como ela é hoje — o
 * fluxo da expedição, o piso de três unidades, o portão das fotos. Ao
 * mudar qualquer um deles no código, esta é a segunda coisa a mudar.
 */

export type Bloco =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "passos"; itens: { titulo: string; texto: string }[] }
  | { tipo: "aviso"; nivel: "perigo" | "atencao" | "nota"; titulo: string; texto: string }
  | { tipo: "tabela"; cabecalho: string[]; linhas: string[][] };

export interface SecaoManual {
  id: string;
  titulo: string;
  blocos: Bloco[];
}

export interface Manual {
  slug: "professor" | "aluno";
  titulo: string;
  subtitulo: string;
  /** Quem lê. Vai no cabeçalho da folha impressa. */
  publico: string;
  /** Quantas páginas A4, aproximadamente, para quem vai xerocar. */
  paginas: string;
  secoes: SecaoManual[];
}

export const VERSAO_MANUAIS = "1.0 · agosto de 2026";

// ─────────────────────────────────────────────────────────────────────
// Manual do professor
// ─────────────────────────────────────────────────────────────────────

const PROFESSOR: Manual = {
  slug: "professor",
  titulo: "Manual do professor",
  subtitulo: "Do cadastro da escola ao dado publicado no mapa da rede",
  publico: "Professores e coordenação",
  // Medido no navegador em largura A4 com margem: 3,8 folhas.
  paginas: "4 páginas A4",
  secoes: [
    {
      id: "o-que-e",
      titulo: "1. O que é o Oceano na Escola",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "É uma plataforma de ciência cidadã costeira do Instituto Ecosurf. A turma sai a campo, aplica um protocolo, conta o que encontra, e o resultado vira um mapa público que qualquer pessoa pode consultar — inclusive a prefeitura, a imprensa e outras escolas.",
        },
        {
          tipo: "paragrafo",
          texto:
            "A diferença entre uma limpeza de praia e uma expedição do Oceano na Escola é o esforço amostral. Numa limpeza, a turma recolhe o lixo. Numa expedição, a turma mede quanto lixo havia em quanta praia — e é isso que permite comparar duas praias, ou a mesma praia em dois anos. Sem essa medida, os números não servem para argumentar com ninguém.",
        },
        {
          tipo: "aviso",
          nivel: "nota",
          titulo: "O que a escola ganha",
          texto:
            "A escola tem página própria no mapa, com os indicadores dela e as histórias que a turma escreve. O dado é público e reutilizável: quando a turma vai à Câmara Municipal falar de saneamento, ela leva um mapa, não uma impressão.",
        },
      ],
    },
    {
      id: "antes",
      titulo: "2. Antes da primeira saída",
      blocos: [
        {
          tipo: "passos",
          itens: [
            {
              titulo: "Cadastre a escola e as turmas",
              texto:
                "No primeiro acesso a plataforma pede o nome da escola, o município, o endereço e a posição no mapa. Cadastre todas as turmas que vão a campo — uma expedição pode reunir mais de uma.",
            },
            {
              titulo: "Confirme os termos",
              texto:
                "A escola declara que colheu o termo de responsabilidade sobre os alunos e o termo de uso de imagem, e que os dois estão arquivados na secretaria. Sem essa confirmação, nenhuma foto da escola aparece em página pública.",
            },
            {
              titulo: "Aguarde a análise do Ecosurf",
              texto:
                "O cadastro entra numa fila e o Instituto confere antes de a escola ir ao mapa da rede. Isso não trava o seu trabalho: a turma já pode sair a campo, e a expedição fica guardada, entrando no mapa junto com a escola quando ela for aprovada.",
            },
          ],
        },
        {
          tipo: "aviso",
          nivel: "atencao",
          titulo: "Os termos são condição, não formalidade",
          texto:
            "São crianças e adolescentes num espaço público, e as fotos vão para um mapa aberto. O termo de imagem não é papel de arquivo: é o que autoriza a escola a publicar. Se ele não existe, marque a caixa como não confirmada e trabalhe sem foto pública — o dado continua valendo.",
        },
      ],
    },
    {
      id: "protocolos",
      titulo: "3. Os sete protocolos",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "Cada protocolo é uma ficha com estrutura própria. Escolha o que responde à pergunta da turma — não é obrigatório aplicar todos, e é melhor aplicar um bem do que três pela metade.",
        },
        {
          tipo: "tabela",
          cabecalho: ["Código", "Protocolo", "Como o dado sai"],
          linhas: [
            ["RES", "Resíduos costeiros e marinhos", "Itens por m² num trecho de praia"],
            ["MIC", "Microplásticos", "Partículas por m² em quadrats na linha de deixa"],
            ["AGU", "Qualidade da água", "Medidas repetidas no mesmo ponto ao longo do tempo"],
            ["ESG", "Esgoto e drenagem", "Ocorrências localizadas, com foto"],
            ["DES", "Descarte irregular", "Ocorrências localizadas, com foto"],
            ["RST", "Restinga e vegetação costeira", "Ocorrências, com a área afetada"],
            ["AVI", "Avifauna e fauna costeira", "Avistamentos e encalhes, com foto"],
          ],
        },
        {
          tipo: "paragrafo",
          texto:
            "RES e MIC produzem densidade e viram grade colorida no mapa. Os outros cinco produzem ocorrências, que viram pinos onde aconteceram. A ficha de cada protocolo está na plataforma, e a versão dela fica gravada junto com o dado — se o protocolo mudar no futuro, a série histórica continua interpretável.",
        },
        {
          tipo: "aviso",
          nivel: "atencao",
          titulo: "Revisão pedagógica pendente",
          texto:
            "Os textos de método dos protocolos ainda não passaram por revisão formal do Instituto Ecosurf. Antes de usar com turma, confirme o procedimento com a equipe do Instituto — sobretudo em MIC e AGU, onde o limite de detecção e a calibragem mudam o que o número significa.",
        },
      ],
    },
    {
      id: "campo",
      titulo: "4. No campo",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "A coleta acontece no papel, na ficha impressa, com as equipes. O celular serve para duas coisas que o papel não faz: marcar a coordenada e tirar a foto. Abra Registrar em campo no seu celular.",
        },
        {
          tipo: "passos",
          itens: [
            {
              titulo: "Marque o ponto",
              texto:
                "A plataforma lê o GPS do aparelho. Confira se a precisão apresentada é razoável antes de gravar — dentro de prédio ela costuma passar de 50 m, e uma ocorrência mal localizada é pior que nenhuma.",
            },
            {
              titulo: "Fotografe a evidência",
              texto:
                "Uma foto por ocorrência basta. Enquadre o objeto e o entorno suficiente para entender onde é. Nunca fotografe rostos de alunos: a foto vai para um mapa público.",
            },
            {
              titulo: "Trabalhe sem sinal",
              texto:
                "Praia costuma não ter rede. O registro fica numa fila no próprio aparelho e sobe sozinho quando a conexão voltar. Não feche o aplicativo antes de ver a fila zerada — confira ainda no ônibus, na volta.",
            },
          ],
        },
        {
          tipo: "aviso",
          nivel: "perigo",
          titulo: "Segurança antes do dado",
          texto:
            "Resíduo de saúde — seringa, agulha, medicamento — e caco de vidro entram na contagem, mas ninguém os recolhe com a mão. Registre, fotografe, não toque, e avise a limpeza urbana. Nenhum número justifica um aluno ferido.",
        },
      ],
    },
    {
      id: "transcricao",
      titulo: "5. Transcrever, revisar, publicar",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "De volta à escola, o professor transcreve as fichas de papel. Não existe conta de aluno: quem transcreve é sempre o professor responsável, e é ele que responde pelo que foi publicado.",
        },
        {
          tipo: "paragrafo",
          texto:
            "A expedição percorre cinco etapas: rascunho, enviada, revisada, validada e publicada. Ela avança um degrau por vez, e voltar é livre — devolver para correção faz parte do trabalho.",
        },
        {
          tipo: "aviso",
          nivel: "nota",
          titulo: "Achou um número errado depois de publicar?",
          texto:
            "Use Corrigir a ficha, na tela de revisão. A expedição volta a rascunho num passo só e a ficha destrava. Enquanto estiver em correção o dado sai do mapa, e o carimbo de quem validou é apagado — dado corrigido não pode continuar carregando a assinatura de quem validou o que havia antes.",
        },
        {
          tipo: "paragrafo",
          texto:
            "A tela de revisão confere, antes de publicar, se o dado vai mesmo aparecer. Ela avisa quando falta coordenada, quando falta área amostrada e quando a célula ainda não atingiu o piso de três unidades. Leia esses avisos: nenhum deles dá erro depois — o dado simplesmente não aparece, e você ficaria procurando o defeito.",
        },
      ],
    },
    {
      id: "privacidade",
      titulo: "6. Privacidade — das crianças e do território",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "O mapa público não mostra o trecho exato onde a turma andou. Ele mostra células de 100 metros com o dado somado, e só publica uma célula a partir de três unidades amostrais. É o que impede que alguém deduza o percurso de uma turma específica num dia específico.",
        },
        {
          tipo: "lista",
          itens: [
            "Foto só aparece na galeria pública depois de três coisas: o termo de imagem registrado, a curadoria do professor e a escola publicada.",
            "Qualquer pessoa pode pedir a remoção de uma imagem. Ela sai do ar na hora do pedido, e o arquivo é apagado em até 72 horas.",
            "Nenhum nome de aluno entra na plataforma. A autoria é da turma e da escola.",
          ],
        },
        {
          tipo: "aviso",
          nivel: "atencao",
          titulo: "A regra da foto, dita ao contrário",
          texto:
            "Antes de publicar uma foto, pergunte-se se você a mostraria impressa no mural da escola com o nome da turma embaixo. Se hesitar, não publique. A galeria é curadoria, não arquivo.",
        },
      ],
    },
    {
      id: "papeis",
      titulo: "7. Quem faz o quê",
      blocos: [
        {
          tipo: "tabela",
          cabecalho: ["Papel", "O que faz"],
          linhas: [
            [
              "Professor",
              "Cadastra escola e turma, cria expedições, registra em campo, transcreve, cura a galeria, valida e publica a expedição",
            ],
            ["Coordenação escolar", "Acompanha as turmas da escola e faz curadoria da galeria"],
            ["Coordenação municipal", "Acompanha várias escolas do município"],
            ["Pesquisador", "Consulta e exporta os dados da rede"],
            [
              "Administração Ecosurf",
              "Analisa cadastros de escola, convida pessoas, define papéis e faz a validação técnica junto ao professor",
            ],
          ],
        },
        {
          tipo: "paragrafo",
          texto:
            "Toda conta nasce como professor. Papel diferente é concedido pelo Instituto Ecosurf depois do cadastro — não é escolhido por quem se inscreve. Se você precisa de acesso de coordenação ou de pesquisa, peça ao Instituto.",
        },
      ],
    },
    {
      id: "problemas",
      titulo: "8. Problemas comuns",
      blocos: [
        {
          tipo: "tabela",
          cabecalho: ["O que acontece", "Por quê", "O que fazer"],
          linhas: [
            [
              "Publiquei a expedição e nada apareceu no mapa",
              "A escola ainda não foi aprovada, ou a célula não chegou a três unidades amostrais",
              "Veja os avisos na tela de revisão; o dado fica guardado e entra sozinho quando a condição chegar",
            ],
            [
              "O protocolo aparece sem densidade",
              "Faltou o esforço amostral — a área ou a extensão medida",
              "Volte à ficha e preencha; sem área a contagem entra no total mas não vira itens por m²",
            ],
            [
              "A foto não entra na galeria",
              "Falta o termo de imagem, a curadoria, ou a escola não está publicada",
              "Confira os três na ficha da escola e na galeria",
            ],
            [
              "O registro de campo não subiu",
              "O aparelho estava sem rede",
              "Abra Registrar em campo com conexão e espere a fila zerar",
            ],
            [
              "Não acho o meu município na lista",
              "Municípios são cadastrados pelo Ecosurf, para o indicador por cidade não se partir entre grafias diferentes",
              "Peça a inclusão ao Instituto",
            ],
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// Manual do aluno
// ─────────────────────────────────────────────────────────────────────

/*
  Escrito para ser impresso, dobrado e levado na mochila — não para ser
  lido na tela. Frases curtas, segunda pessoa, e a segurança antes de
  tudo: a lista de itens do protocolo de resíduos inclui seringa, agulha
  e caco de vidro, e o manual seria irresponsável se tratasse isso como
  um item de contagem como outro qualquer.
*/
const ALUNO: Manual = {
  slug: "aluno",
  titulo: "Manual do mapeador",
  subtitulo: "O que fazer na saída de campo",
  publico: "Estudantes",
  // Medido: 2,3 folhas — ou seja, cai em 3, e em 2 se imprimir frente
  // e verso. Dizer "2" faria a escola tirar cópia a menos.
  paginas: "3 páginas A4 — cabe em 1 folha frente e verso",
  secoes: [
    {
      id: "missao",
      titulo: "A sua missão",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "Hoje você não vai só limpar a praia. Você vai medir. A diferença é enorme: quem limpa deixa a praia bonita por um dia, quem mede consegue provar o que está acontecendo — e provar é o que faz a prefeitura, a escola e o vizinho mudarem de ideia.",
        },
        {
          tipo: "paragrafo",
          texto:
            "Tudo o que a sua equipe contar hoje vai para um mapa na internet que qualquer pessoa pode abrir. O seu trabalho não termina na praia.",
        },
      ],
    },
    {
      id: "seguranca",
      titulo: "Segurança — leia antes de tudo",
      blocos: [
        {
          tipo: "aviso",
          nivel: "perigo",
          titulo: "Nunca pegue com a mão",
          texto:
            "Seringa, agulha, remédio, caco de vidro, lata amassada, pilha e qualquer coisa cortante ou com cheiro forte. Você CONTA e FOTOGRAFA. Quem recolhe é adulto, com equipamento.",
        },
        {
          tipo: "lista",
          itens: [
            "Use luva e calçado fechado. Não trabalhe de chinelo.",
            "Boné, camiseta e protetor solar. A praia queima mesmo nublado.",
            "Beba água antes de sentir sede.",
            "Fique sempre à vista do professor. Ninguém entra na água.",
            "Achou animal vivo, ferido ou morto? Não toque. Chame o professor.",
            "Passou mal, cortou-se, ficou tonto: avise na hora. Não é frescura.",
          ],
        },
      ],
    },
    {
      id: "levar",
      titulo: "O que a equipe leva",
      blocos: [
        {
          tipo: "lista",
          itens: [
            "A ficha de papel e uma prancheta",
            "Duas canetas — uma sempre falha",
            "Luvas para todo mundo",
            "Trena ou corda marcada, para medir o trecho",
            "Sacos separados, se a turma também for recolher",
            "Um celular por equipe, com o professor",
          ],
        },
      ],
    },
    {
      id: "medir",
      titulo: "Passo 1 — Meça o pedaço",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "Antes de contar qualquer coisa, marque onde começa e onde termina o seu trecho, e anote quantos metros são. Este é o passo que todo mundo esquece e é o mais importante de todos.",
        },
        {
          tipo: "aviso",
          nivel: "atencao",
          titulo: "Por que isso importa tanto",
          texto:
            "«Achamos 200 bitucas» não diz nada. «Achamos 200 bitucas em 50 metros de praia» diz tudo — dá para comparar com outra praia, com outro ano, com a praia da escola vizinha. Sem a medida, a sua contagem não serve para comparar com nada.",
        },
      ],
    },
    {
      id: "contar",
      titulo: "Passo 2 — Conte",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "Ande devagar pelo trecho, olhando o chão. Cada coisa que encontrar, marque um risquinho na linha certa da ficha. No fim, some os risquinhos.",
        },
        {
          tipo: "lista",
          itens: [
            "Conte só o que for maior que 2,5 cm — mais ou menos uma tampinha de garrafa.",
            "Contou uma sacola rasgada em três pedaços? São três pedaços, não uma sacola.",
            "Não sabe em que linha marcar? Use «Outro» e escreva o que era.",
            "Zero também é resultado. Se não achou bituca nenhuma, escreva zero — não deixe em branco.",
          ],
        },
        {
          tipo: "paragrafo",
          texto:
            "As linhas da ficha estão agrupadas por material: plástico, isopor, metal, vidro, papel, borracha, tecido, madeira, saúde e outros. Plástico é o grupo maior, com bituca de cigarro, sacola, garrafa PET, tampinha, canudo, copo descartável, embalagem de salgadinho e mais.",
        },
      ],
    },
    {
      id: "fotografar",
      titulo: "Passo 3 — Fotografe",
      blocos: [
        {
          tipo: "lista",
          itens: [
            "Fotografe o que for importante: um descarte grande, um cano jogando água suja, um animal enroscado em rede.",
            "Chegue perto o suficiente para dar para entender o que é, e longe o suficiente para dar para entender onde é.",
            "Se puder, ponha algo do lado para dar tamanho — uma caneta, um pé, uma régua.",
          ],
        },
        {
          tipo: "aviso",
          nivel: "perigo",
          titulo: "Nunca fotografe o rosto de ninguém",
          texto:
            "Nem dos colegas, nem de quem estiver na praia. Essas fotos vão para um mapa público na internet. Foto de gente não entra. Se aparecer alguém sem querer, tire outra.",
        },
      ],
    },
    {
      id: "cuidado",
      titulo: "Passo 4 — Deixe a praia melhor do que achou",
      blocos: [
        {
          tipo: "lista",
          itens: [
            "Não pise na vegetação da restinga. Aquelas plantas baixas seguram a areia e são a parte mais frágil da praia.",
            "Não tire conchas, plantas nem animais do lugar.",
            "Se a turma for recolher o lixo, faça isso depois de contar. Contou primeiro, recolheu depois.",
            "Leve embora o seu próprio lixo, inclusive a luva usada.",
          ],
        },
      ],
    },
    {
      id: "depois",
      titulo: "Depois da saída",
      blocos: [
        {
          tipo: "paragrafo",
          texto:
            "O professor transcreve as fichas de papel para a plataforma. Aí a sua contagem vira um quadrado colorido no mapa, junto com a de outras turmas e de outras escolas do litoral.",
        },
        {
          tipo: "paragrafo",
          texto:
            "O mapa não mostra exatamente onde a sua turma andou — ele junta o dado em quadrados de 100 metros, e só publica um quadrado quando três equipes já passaram por ali. Isso é de propósito: protege vocês, e ainda mostra o problema.",
        },
        {
          tipo: "aviso",
          nivel: "nota",
          titulo: "Conte para alguém",
          texto:
            "A parte que falta é a sua. Mostre o mapa em casa, no conselho de escola, na Câmara da sua cidade. O dado sozinho não muda nada — quem muda são as pessoas que sabem dele.",
        },
      ],
    },
  ],
};

export const MANUAIS: Manual[] = [PROFESSOR, ALUNO];

export function manualPorSlug(slug: string): Manual | null {
  return MANUAIS.find((m) => m.slug === slug) ?? null;
}

# Guardiões Ecosurf — escolas de surf na plataforma

Complemento do programa Oceano na Escola: escolas de surf participam com o
mesmo método e o mesmo sistema das escolas. Este documento registra o que
já existe, as decisões tomadas e o que depende de definição do Instituto
Ecosurf.

## 1. Decisões de modelo

**A escola de surf é uma `escola` com `tipo = 'surf'`**, e não uma tabela
própria. Vínculo, análise de cadastro, protocolos, curadoria de foto, termo
de imagem e mapa já funcionam para `escola`; uma tabela paralela criaria
dois lugares para consertar cada regra de privacidade.

**O tipo é escolhido no cadastro e não muda depois.** A coluna só é
concedida em `insert`. Trocar o tipo de uma organização que já publicou
dado mudaria o sentido do que está no mapa. Correção de cadastro errado é
feita pelo Ecosurf, direto no banco.

**A sessão é uma `expedicao` com `tipo = 'sessao'`**, pela mesma razão:
ocorrência, evidência, pedido de remoção e views públicas penduram em
`expedicao_id`. A função `publicar_sessao` sobe a escada de status um
degrau por vez, sem afrouxar o gatilho de transição. **Ainda não há tela
que a chame** — ver a seção 4.

**Não há item novo no menu.** As escolas de surf aparecem numa aba de
`/escolas` e têm página própria em `/guardioes`. Um item a mais no menu
diria que são duas plataformas.

## 2. O que a fase 1 entregou

| Onde | O quê |
| --- | --- |
| Cadastro (`/onboarding`) | Primeira pergunta: escola ou escola de surf. Para a escola de surf some a rede de ensino, a turma vira "turma de aula", o nível vira faixa (Infantil, Juvenil, Adulto, Misto). |
| Vocabulário (`lib/organizacao.ts`) | Um lugar só para os termos de cada tipo: escola / escola de surf, professor / instrutor, turma / turma de aula. |
| Mapa (`/`) | Pino próprio (onda, magenta), linha própria na legenda, filtro "Rede" e endereço `/?rede=surf`. |
| Índice (`/escolas`) | Abas "Escolas" e "Escolas de surf" (`/escolas?rede=surf`). |
| Programa (`/guardioes`) | Página pública: o que se observa, como funciona, regras de proteção, quem participa, chamada para o cadastro. |
| Administração | Selo "Escola de surf" na fila de análise e na tabela da rede. |
| Painel e ficha da escola | Título e campos acompanham o tipo; o tipo aparece e não se edita. |

A legenda e o filtro de rede só aparecem quando existe escola de surf
publicada. Antes disso seriam um interruptor que não liga nada.

## 3. Escolhas sem fonte, que o Ecosurf precisa confirmar

Nada disto veio de documento do instituto. São padrões razoáveis para a
tela não ficar em branco, e todos se trocam num arquivo só.

- **Faixas da turma de aula** — Infantil, Juvenil, Adulto, Misto
  (`lib/organizacao.ts`). São rótulos de cadastro, sem efeito no dado.
- **Termos da escola de surf** — a tela pede os mesmos dois termos das
  escolas (responsabilidade e uso de imagem), com a ressalva "assinados
  pelo responsável, quando o aluno é menor de idade", porque escola de surf
  também atende adultos. A redação é provisória (`app/onboarding/page.tsx`).
- **Cor e desenho do pino** — magenta, por ser a faixa de matiz que nem a
  escola nem os protocolos usam; onda quebrando, porque a prancha, no
  tamanho de um pino, se lia como folha.
- **Escola de surf fictícia na demonstração** — "Escola de Surf
  Arrebentação" só existe no modo sem banco (`lib/mapa-publico.ts`), com
  nome e coordenada inventados.

## 4. O que falta, e o que depende de quem

**Depende de definição de método (Ecosurf):**

1. **Áreas preservadas de jundu.** O protocolo de restinga (RST) hoje só
   registra dano: supressão, pisoteio, espécie invasora e aterro. Levantar
   o que está preservado pede decidir a unidade — área, trecho de orla ou
   ponto.
2. **Poluição nos rios.** Quais ocorrências entram na lista.
3. **Termos da escola de surf.** Se são os mesmos das escolas.

Enquanto isso, a página `/guardioes` marca as duas primeiras frentes como
"em definição", e um teste (`lib/guardioes.test.ts`) impede que virem
"disponível" sem o item de protocolo existir.

**Depende só de desenvolvimento (fases seguintes):**

- Tela de registro de sessão, chamando `publicar_sessao`.
- Manual do instrutor e ficha de sessão.
- Coluna `registro_tipo` já está em `pub_observacao_pontual`; o mapa ainda
  não distingue ocorrência de sessão de ocorrência de expedição.

# Oceano na Escola — Documento de Premissas v0.3

**Instituto Ecosurf** · Itanhaém/SP · Agosto de 2026

Atualização da v0.2 com as definições de João Malavolta e com o registro do que já foi construído.

As premissas continuam sendo a decisão; os blocos em itálico marcados *Implementado* dizem como
cada uma virou plataforma, e onde a construção foi além ou ficou aquém do previsto. Quando as duas
coisas divergirem, a premissa manda — foi assim que a exportação de dados voltou para trás do
login.

---

## 1. Definição do produto

Plataforma web de Cultura Oceânica, ciência cidadã e monitoramento ambiental, organizada a partir
de escolas. A escola atua como núcleo local, os estudantes como mapeadores, e o mapa coletivo como
instrumento de leitura e transformação do território.

Endereço: **www.oceanonaescola.org**

Antecedente metodológico: projeto Rio do Nosso Bairro — Escolas Cuidando da Água (Ecosurfi, 2010),
metodologia Mapa Verde, Comunidade Virtual e Conferência Metropolitana Infanto-Juvenil.

Cinco verbos que organizam o escopo: **mapear, investigar, monitorar, compartilhar, agir.**
Funcionalidade que não couber em pelo menos um deles fica fora.

---

## 2. Dados pessoais e proteção de menores

- Controlador dos dados: **Instituto Ecosurf**.
- A escola assina **termo de responsabilidade sobre os alunos** e **termo de uso de imagem**.
- O Ecosurf assina **termo de parceria** com cada escola participante, e esse termo define as
  responsabilidades da escola, incluindo imagem e uso de aparelho.
- Não existe conta pessoal de aluno. As contas são de escola, turma e classe.
- O professor cadastra a escola, cria e administra a página da turma.
- Fotos apenas como registro coletivo da turma e das saídas de campo.
- Nome de estudante não aparece em página pública.
- Imagens e informações permanecem na plataforma como **memória e documento** do trabalho da escola.
- Galeria sempre pública, com **curadoria do professor ou coordenador** responsável pela escola.

**Remoção a pedido da família:** havendo pedido formalizado, o Ecosurf remove em até **72 horas**.
O prazo entra no termo de parceria e no termo de uso de imagem. Na plataforma, o pedido chega por
um botão de solicitação no perfil da escola, e a imagem passa ao estado "despublicada" antes da
exclusão definitiva.

*Implementado.* O botão está em cada foto da galeria pública e é aberto a quem não tem conta —
quem precisa pedir é a família, e família não tem login. O pedido tira a imagem do ar no mesmo
instante, por gatilho no banco; o prazo de 72 horas conta para a exclusão do arquivo, que a
escola ou o Ecosurf executam em `/galeria`. Quem tem vínculo com a escola pode atender, além do
Ecosurf: o termo promete um prazo, não uma pessoa específica.

---

## 3. Registro de campo

- A ficha impressa é o registro primário de toda ação de campo, obrigatória.
- Duas fichas: a do aluno mapeador (bruta, por equipe) e a do professor (consolidada).
- O professor transcreve pelo celular em campo ou pelo computador na escola ou em casa.
- Depois da transcrição, a turma trabalha em sala sobre o que foi mapeado.
- Impressão das fichas: Ecosurf ou escola, definido em acordo prévio.
- Cronograma de saída de campo e prazo de transcrição: definidos no acordo prévio entre escola e
  Ecosurf.

**Consequências técnicas assumidas:**

- A definição do protocolo gera o formulário web **e** o PDF da ficha impressa, no mesmo layout e
  na mesma ordem dos campos.
- A data da observação é a da saída de campo, não a da digitação. Dois carimbos de tempo distintos.
- Foto ou digitalização das fichas dos alunos fica anexada à Expedição como evidência.
- Offline completo não entra no MVP. Rascunho salvo no navegador e formulário que não perde o
  preenchido se a conexão cair.

*Implementado, e um pouco além do previsto.* A ficha impressa continua sendo o registro primário
das contagens por área — resíduos e microplásticos —, porque contagem sem esforço amostral não
vira densidade. O que passou a nascer direto no celular é a **ocorrência pontual**: entulho,
lançamento de esgoto, supressão de restinga, encalhe. Em `/campo`, com GPS, foto e magnitude.

Quando a rede falha, o registro não falha junto: ele entra numa fila em IndexedDB, foto inclusive,
e sobe quando a conexão volta. A plataforma é instalável (PWA), mas o service worker guarda só o
casco do app — dado nunca, porque mostrar dado velho como se fosse atual é pior do que dizer "sem
conexão".

---

## 4. Dispositivos em campo

- Celular do professor, ou de aluno que se voluntarie a ceder o aparelho.
- Há conectividade nas praias onde as expedições ocorrem.
- A escola solicita formalmente o uso do aparelho, previsto no termo de parceria.

**Regras que decorrem disso:**

- Quem está autenticado no aparelho é sempre o **professor**, mesmo quando o celular é do aluno.
- A foto vai direto para a plataforma e **não fica salva na galeria do aparelho**.
- A Lei 15.100/2025 permite o uso para fim estritamente pedagógico. O termo de parceria deve citar
  a lei e a finalidade, para a escola ter respaldo documental.

---

## 5. Papéis e validação

| Papel | Faz o quê |
|---|---|
| Professor | Cadastra escola e turma, cria expedições, transcreve fichas, valida, publica |
| Coordenação escolar | Acompanha as turmas da escola e faz curadoria da galeria |
| Coordenação municipal | Acompanha várias escolas |
| Pesquisador | Consulta e exporta dados |
| Administrador Ecosurf | Gestão da rede e validação técnica junto ao professor |

Estados do dado: rascunho → enviado → revisado → validado → publicado.

- Validação **em lote**, por expedição, com possibilidade de marcar exceções individuais.
- Validação técnica: responsabilidade do professor em parceria com o Ecosurf.

*Implementado em `/expedicoes/[id]/revisar`.* A regra da transição mora no banco, não no botão: um
gatilho só deixa avançar um degrau por vez, carimba quem validou e quando, limpa o carimbo se a
expedição for devolvida para correção, e recusa publicar expedição sem nenhuma unidade amostral
nem ocorrência — que não daria erro em lugar nenhum, apenas sumiria do mapa.

A tela confere, antes de publicar, as três condições que decidem se o dado aparece de fato, e
nenhuma delas falha com mensagem: status publicado, escola publicada, e célula com pelo menos três
unidades amostrais. A função `previa_grade_expedicao` responde a última repetindo a agregação da
view pública para uma expedição só.

---

## 6. Escopo do piloto

O piloto será **fictício**, para demonstração e teste da plataforma:

- Escola fictícia.
- Território: Praia do Sonho, Itanhaém.
- Duas expedições fictícias.
- Um protocolo fictício, o mais completo possível.

Critério de sucesso: percorrer o ciclo inteiro na plataforma, do cadastro da escola à publicação no
mapa, sem travar em nenhuma etapa.

Nesta fase, **tudo é fictício**: escola, turma, professores, expedições, protocolo, fichas
preenchidas, fotos e indicadores. A base serve para construir e demonstrar a plataforma inteira,
de ponta a ponta, sem envolver nenhuma escola, aluno ou dado real.

---

## 7. Sustentação

- O Instituto Ecosurf mantém a plataforma em www.oceanonaescola.org.
- Recursos de patrocinadores, secretarias de ensino e fontes correlatas.
- Plataforma privada, dados privados. Sem publicação de dados abertos nesta fase.

*Como isso ficou na plataforma.* A página `/dados` mostra a quem não tem login apenas o que o §9
já abre — indicadores agregados por escola, município e rede. A exportação em CSV, que o §9 põe
sob login, pede sessão.

Vale registrar o limite dessa trava: ela fecha a porta do produto, não a do banco. As views `pub_*`
seguem legíveis pela chave anônima porque é delas que vive o mapa público, e quem souber usar a API
do PostgREST alcança o mesmo conteúdo. Fechar de verdade significaria revogar o `select` do `anon`
e derrubar o mapa junto. A decisão do cenário C já pesou isso ao publicar o mapa agregado.

**Custo de infraestrutura:** sempre coberto por recursos próprios do Ecosurf ou de terceiros
(patrocinadores, secretarias de ensino e fontes correlatas), inclusive a partir do segundo ano.

**Titularidade e uso dos dados:** os dados são exclusivos do Instituto Ecosurf e das escolas
participantes. Terceiros só podem utilizá-los mediante consentimento do Ecosurf. Isso vale para
pesquisadores, poder público, imprensa e parceiros, e precisa constar do termo de parceria.

---

## 8. Decisões técnicas fixadas

- Projeto Supabase separado do ecosurf.app, com PostgreSQL e PostGIS.
- RLS escopado por escola desde a primeira migration.
- Next.js com TypeScript, shadcn/ui e Tailwind. MapLibre GL como motor cartográfico.
- Design system compartilhado com o ecosurf.app por cópia, não por runtime comum.
- Iconografia própria. Os ícones do Green Map System são protegidos e servem só como referência.
- Domínio oceanonaescola.org.

---

## 9. Ponto que precisa de decisão antes do modelo de dados

A titularidade já está resolvida no bloco 7: os dados são do Ecosurf e das escolas, e terceiros só
os usam com consentimento. Falta a outra metade da pergunta, que é de visibilidade: o que um
visitante sem login enxerga ao abrir o site. O modelo de permissões muda conforme a resposta.

| Cenário | Mapa e página da escola | Dados brutos | Galeria |
|---|---|---|---|
| **A. Vitrine pública** | Visíveis sem login | Só logado | Pública, curada |
| **B. Fechada** | Só logado | Só logado | Pública apenas dentro da rede |
| **C. Mista** | Mapa público com dado agregado, sem coordenada exata | Só logado | Pública, curada |

**Adotado: cenário C**, que é o padrão em plataformas de ciência cidadã com participação de menores.
Na prática:

**Aberto a visitante sem login**

- Mapa da rede com as escolas participantes e os territórios monitorados.
- Indicadores agregados por escola, município e rede (número de expedições, observações, extensão
  monitorada, resíduos catalogados, espécies registradas).
- Página pública de cada escola, sem nome de estudante.
- Galeria pública curada pelo professor ou coordenador.
- Páginas institucionais do projeto.

**Só com login**

- Registro individual de observação e sua coordenada exata.
- Tabelas, filtros avançados, exportação e download de dados.
- Fichas digitalizadas, fotos não curadas e qualquer dado em revisão.
- Área administrativa da escola e da turma.

**Regras de proteção** *(revisto em 11/08/2026)*

A regra deixou de ser uma só. Ela passou a distinguir o que a coordenada revela.

- **Esforço amostral — agregado em grade de 100 m.** Onde a turma percorreu o trecho ou instalou o
  quadrat aparece somado por célula, e a célula só é publicada a partir de três unidades amostrais.
  Essa coordenada diz onde as crianças estiveram, e continua protegida.
- **Ocorrência ambiental — coordenada exata.** Ponto de lançamento de esgoto, entulho na margem,
  supressão de restinga e a foto que documenta cada um aparecem no lugar em que estão. Essa
  coordenada descreve o território, não a turma, e agregá-la esvaziaria a função do mapa: um
  problema ambiental que não se pode apontar não se pode cobrar.
- A galeria pública e as fotos de ocorrência ficam fora da indexação de buscadores (`noindex`),
  mesmo sendo acessíveis pelo site. Mapa, página da escola e páginas institucionais são indexáveis.
- Foto de ocorrência exige as três condições juntas: curadoria do professor, escola publicada e
  termo de uso de imagem confirmado.
- Pesquisador que precise da coordenada exata do esforço amostral solicita acesso ao Ecosurf,
  conforme a regra de uso de dados do bloco 7.

*Sobre o armazenamento das fotos.* O bucket é **privado**, e essa decisão não é detalhe de
infraestrutura: a view pública entrega o caminho do arquivo a quem não tem login, e com bucket
público nem a curadoria do professor nem o `termos_ok` da escola protegeriam a imagem. As políticas
do storage repetem as três condições acima, e a foto chega ao navegador por URL assinada.

---

## 10. Educomunicação

Duas peças herdadas do Rio do Nosso Bairro, separadas por uma regra de privacidade.

**Diário de Campo** — o antigo Diário de Bordo, preso à expedição e dividido em *antes, durante e
depois* do mapeamento, como no manual de Mapa Verde. Cada momento traz o convite de escrita; o
"depois" pergunta o que os números dizem do território e de quem é a responsabilidade.

O diário é **interno à escola**. Escrita de estudante em processo pertence à mesma categoria das
fichas digitalizadas e das fotos sem curadoria: pode ter nome, desabafo, erro de percurso.

**História do Território** — o artefato curado, escrito para sair. Combina texto, o mapa e os
indicadores das expedições que narra. A história **aponta** para as expedições em vez de copiar
números, e por isso não envelhece quando uma contagem é corrigida na revisão.

Publicar é decisão da escola, e retirar do ar apaga o carimbo de publicação — a página nunca
mostra data de história que saiu.

---

## 11. Reconhecimento, não classificação

O plano de produção pede reconhecer expedições realizadas, territórios monitorados, protocolos
aplicados e tempo de monitoramento. Pede também, na lista do que **não** reaproveitar do Rio do
Nosso Bairro, o "ranking de membros".

As conquistas da página da escola seguem as duas coisas: cada escola é medida contra o próprio
percurso, e não existe classificação entre escolas nem entre estudantes. O critério que mais pesa é
a **continuidade** — meses distintos com saída de campo, não volume acumulado. Uma escola de duas
turmas num município pequeno não aparece atrás de uma escola grande por ter menos gente.

Nada é gravado: tudo se deriva do que já está publicado, sem tabela de pontos para desincronizar
do dado real.

---

## Próximo passo

Passo 2 concluído: os protocolos estão em `docs/02-protocolos.md` e no banco, e a ficha gera o
formulário web. O ciclo do critério de sucesso do bloco 6 fecha ponta a ponta — cadastrar escola,
abrir expedição, registrar em campo, transcrever a ficha, revisar, publicar no mapa, escrever a
história.

Aberto para a próxima fase: API pública documentada, integração com universidades, sensoriamento
remoto comparativo e identificação assistida de espécies.

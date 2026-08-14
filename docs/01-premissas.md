# Oceano na Escola — Documento de Premissas v0.3

**Instituto Ecosurf** · Itanhaém/SP · Agosto de 2026

Terceira versão das premissas. As decisões da v0.2 que a construção confirmou seguem como estavam;
as que a construção obrigou a rever estão marcadas *(revisto em 12/08/2026)*, e o que mudou está
listado no changelog, no fim do documento.

Este documento é a decisão. Quando ele e a plataforma divergirem, ele manda.

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
  A foto nasce despublicada e só entra na galeria por ato de uma pessoa, que fica registrada.

**Remoção a pedido da família** *(revisto em 12/08/2026)*

Havendo pedido formalizado, o Ecosurf remove em até **72 horas**. O prazo entra no termo de
parceria e no termo de uso de imagem.

O prazo de 72 horas conta para a **exclusão do arquivo**, não para a retirada do ar: a imagem é
despublicada no instante em que o pedido é registrado. Quem pede não espera atendimento para a foto
sair de vista.

O pedido é aberto a quem não tem conta — quem precisa pedir é a família, e família não tem login
na plataforma. Pode atender tanto o Ecosurf quanto quem tem vínculo com a escola: o termo promete
um prazo, não uma pessoa específica, e a escola é quem age mais rápido.

---

## 3. Registro de campo *(revisto em 12/08/2026)*

O registro tem duas naturezas, e a v0.2 tratava as duas como uma só.

**Contagem por área — a ficha impressa é o registro primário.** Vale para resíduos costeiros e
microplásticos. A ficha é obrigatória, em duas versões: a do aluno mapeador (bruta, por equipe) e a
do professor (consolidada). O professor transcreve depois, pelo celular em campo ou pelo computador
na escola. A razão é metodológica e não muda: contagem sem esforço amostral registrado não vira
densidade, e sem densidade o dado não compara praia nem ano.

**Ocorrência pontual — nasce no celular.** Vale para entulho, lançamento de esgoto, supressão de
restinga, encalhe, avistamento e medida de água. Não há quadrat nem trecho: o aluno registra o que
encontra no ponto em que está, com GPS, foto e magnitude. Passar isso por ficha de papel seria
transcrever uma coordenada que o aparelho já sabe.

Demais regras de campo:

- Depois da transcrição, a turma trabalha em sala sobre o que foi mapeado.
- Impressão das fichas: Ecosurf ou escola, definido em acordo prévio.
- Cronograma de saída e prazo de transcrição: definidos no acordo prévio entre escola e Ecosurf.

**Consequências técnicas assumidas:**

- A definição do protocolo gera o formulário web **e** o PDF da ficha impressa, no mesmo layout e
  na mesma ordem dos campos. Protocolo novo entra por cadastro, sem alteração de schema.
- A data da observação é a da saída de campo, não a da digitação. Dois carimbos de tempo distintos.
- Foto ou digitalização das fichas dos alunos fica anexada à Expedição como evidência.
- **Offline parcial, não completo.** O registro feito sem rede fica guardado no aparelho, foto
  inclusive, e sobe quando a conexão volta. A plataforma é instalável, mas o cache guarda apenas o
  casco do aplicativo: dado nunca. Mostrar dado velho como se fosse atual é pior do que dizer "sem
  conexão".

---

## 4. Dispositivos em campo

- Celular do professor, ou de aluno que se voluntarie a ceder o aparelho.
- Há conectividade nas praias onde as expedições ocorrem — e, quando não houver, o registro espera
  no aparelho, conforme o bloco 3.
- A escola solicita formalmente o uso do aparelho, previsto no termo de parceria.

**Regras que decorrem disso:**

- Quem está autenticado no aparelho é sempre o **professor**, mesmo quando o celular é do aluno.
- A foto vai direto para a plataforma e **não fica salva na galeria do aparelho**.
- A Lei 15.100/2025 permite o uso para fim estritamente pedagógico. O termo de parceria deve citar
  a lei e a finalidade, para a escola ter respaldo documental.

---

## 5. Papéis e validação *(revisto em 14/08/2026)*

| Papel | Faz o quê |
|---|---|
| Professor | Cadastra escola e turma, cria expedições, registra em campo, transcreve fichas, cura a galeria, valida, publica expedição |
| Coordenação escolar | Acompanha as turmas da escola e faz curadoria da galeria |
| Coordenação municipal | Acompanha várias escolas |
| Pesquisador | Consulta e exporta dados |
| Administrador Ecosurf | Gestão da rede, análise dos cadastros de escola e validação técnica junto ao professor |

### 5.1 Análise do cadastro de escola *(14/08/2026)*

Qualquer pessoa cria conta e cadastra escola sem passar por ninguém — e isso continua assim de
propósito, porque exigir aprovação da **conta** faria a professora que se inscreve numa quinta à
noite esperar até alguém do instituto abrir o painel. O que passa pelo Ecosurf é a **escola**:

**pendente → aprovada**, ou **pendente → recusada → pendente** depois de a escola corrigir.

- A escola nasce **pendente** e, enquanto está, nada dela alcança quem não tem login.
- **O trabalho não espera a aprovação.** A turma sai a campo, o professor transcreve e publica a
  expedição; o que fica retido é a chegada ao mapa da rede, não o registro.
- **Recusa exige motivo escrito**, que a escola lê na própria ficha. Recusa sem motivo é recusa
  que ninguém tem como responder, e o mesmo cadastro volta igual na semana seguinte.
- **Aprovar exige coordenada.** Sem posição a escola não apareceria no mapa mesmo aprovada, e o
  painel diria que ela entrou.
- `situacao` e `publicada` são colunas diferentes de propósito: a escola aprovada tira a própria
  página do ar quando quiser e continua aprovada. Com uma coluna só, ela voltaria para a fila de
  análise a cada vez.

Isto é regra de banco, não de tela: `publicada` deixou de ser concedida ao cliente e passa por
`escola_define_visibilidade()`, que exige o cadastro aprovado. Até 14/08 a coluna estava
concedida em update ao papel `authenticated` — quem cadastrava escola podia publicá-la sozinho no
mapa da rede, sem etapa nenhuma no Ecosurf.

Estados do dado: **rascunho → enviado → revisado → validado → publicado.**

- Validação **em lote**, por expedição, com possibilidade de marcar exceções individuais.
- Validação técnica: responsabilidade do professor em parceria com o Ecosurf.
- **A transição avança um degrau por vez.** Voltar é livre — devolver para correção faz parte do
  fluxo, e expedição publicada por engano precisa poder sair do mapa sem refazer o caminho.
- Devolver desfaz a validação: o carimbo de quem validou não sobrevive ao dado que ele validou.
- **Não se publica expedição sem nenhum dado.** Ela não daria erro em lugar nenhum: apenas não
  apareceria no mapa, e quem publicou ficaria procurando o defeito.

Essas regras vivem no banco, não na tela. Botão não é regra.

**O que decide se o dado publicado aparece de fato.** Três condições, e nenhuma delas falha com
mensagem de erro — quando falta uma, o dado simplesmente não aparece. Por isso a tela de revisão
confere as três antes de publicar:

1. Expedição publicada.
2. Escola publicada.
3. Célula da grade com pelo menos três unidades amostrais (bloco 9).

---

## 6. Escopo do piloto *(revisto em 12/08/2026)*

O piloto é **inteiramente fictício**: escolas, turmas, territórios, expedições, protocolos, fichas
preenchidas, ocorrências, diário e histórias. Nenhuma escola, aluno ou dado real nesta fase.

- **Quatro escolas fictícias**, em Itanhaém.
- **Territórios fictícios** — praia, restinga, foz, manguezal e costão. Nomes inventados: nomear a
  praia real que uma turma monitora ajuda a identificar a turma, que é justamente o que o bloco 9
  protege.
- **Doze expedições fictícias**, com fichas transcritas e ocorrências registradas.
- **Sete protocolos**, dois de densidade e cinco de ocorrência.

Critério de sucesso: percorrer o ciclo inteiro na plataforma, sem travar em nenhuma etapa —
cadastrar a escola, abrir a expedição, registrar em campo, transcrever a ficha, revisar, publicar
no mapa e escrever a história do território. **Critério atingido.**

---

## 7. Sustentação *(revisto em 12/08/2026)*

- O Instituto Ecosurf mantém a plataforma em www.oceanonaescola.org.
- Recursos de patrocinadores, secretarias de ensino e fontes correlatas.
- Plataforma privada, dados privados. **Sem publicação de dados abertos nesta fase.**

O que existe hoje não é dado aberto: é a mesma informação do mapa, em outra forma. Quem não tem
login vê os indicadores agregados que o bloco 9 já abre. A exportação em arquivo, que o bloco 9 põe
sob login, exige sessão.

Registrado o limite dessa trava, para não se confiar demais nela: **ela fecha a porta do produto,
não a do banco.** As views públicas continuam legíveis pela chave anônima, porque é delas que vive
o mapa; quem souber usar a API alcança o mesmo conteúdo. Fechar de verdade significaria derrubar o
mapa público junto. O cenário C já pesou esse custo quando decidiu publicar o mapa agregado.

**Custo de infraestrutura:** sempre coberto por recursos próprios do Ecosurf ou de terceiros
(patrocinadores, secretarias de ensino e fontes correlatas), inclusive a partir do segundo ano.

**Titularidade e uso dos dados:** os dados são exclusivos do Instituto Ecosurf e das escolas
participantes. Terceiros só podem utilizá-los mediante consentimento do Ecosurf. Isso vale para
pesquisadores, poder público, imprensa e parceiros, e precisa constar do termo de parceria.

---

## 8. Decisões técnicas fixadas *(revisto em 12/08/2026)*

- Projeto Supabase separado do ecosurf.app, com PostgreSQL e PostGIS.
- RLS escopado por escola desde a primeira migration.
- Next.js com TypeScript, shadcn/ui e Tailwind. MapLibre GL como motor cartográfico.
- Design system compartilhado com o ecosurf.app por cópia, não por runtime comum.
- **Iconografia própria.** Os ícones do Green Map System são protegidos e servem só como
  referência. Nenhum asset de banco de ícones de terceiros entra no repositório: a licença
  acompanha o arquivo, e o repositório é público.
- **Armazenamento de imagem privado.** A camada pública entrega o caminho do arquivo a quem não tem
  login; com armazenamento aberto, nem a curadoria nem o termo de imagem protegeriam a foto. A
  imagem chega ao navegador por endereço assinado e temporário.
- **A regra crítica mora no banco, não na tela.** Transição de status, despublicação por pedido de
  remoção e piso de agregação são gatilhos e políticas. Tela é conveniência; quem protege é o banco.
- Domínio oceanonaescola.org.

---

## 9. Visibilidade: o que o visitante enxerga

A titularidade está resolvida no bloco 7: os dados são do Ecosurf e das escolas, e terceiros só os
usam com consentimento. Este bloco resolve a outra metade — o que um visitante sem login enxerga.

| Cenário | Mapa e página da escola | Dados brutos | Galeria |
|---|---|---|---|
| **A. Vitrine pública** | Visíveis sem login | Só logado | Pública, curada |
| **B. Fechada** | Só logado | Só logado | Pública apenas dentro da rede |
| **C. Mista** | Mapa público com dado agregado, sem coordenada exata | Só logado | Pública, curada |

**Adotado: cenário C**, que é o padrão em plataformas de ciência cidadã com participação de menores.

**Aberto a visitante sem login**

- Mapa da rede com as escolas participantes e os territórios monitorados.
- Indicadores agregados por escola, município e rede.
- Página pública de cada escola, sem nome de estudante.
- Galeria pública curada pelo professor ou coordenador.
- Histórias do Território publicadas pela escola.
- Páginas institucionais do projeto.

**Só com login**

- Registro individual de observação e a coordenada exata do esforço amostral.
- Tabelas, filtros avançados, exportação e download de dados.
- Fichas digitalizadas, fotos não curadas e qualquer dado em revisão.
- Diário de Campo.
- Área administrativa da escola e da turma.

**Regras de proteção** *(revisto em 11/08/2026)*

A regra deixou de ser uma só. Ela distingue o que a coordenada revela.

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

---

## 10. Protocolos *(novo em 12/08/2026)*

O protocolo se descreve a si mesmo: seções, campos e itens ficam em tabelas, e a mesma definição
gera o formulário da tela e o PDF da ficha impressa. Protocolo novo entra por cadastro.

Todo dado fica amarrado à versão do protocolo que o gerou. Revisar um protocolo não reescreve o
passado.

**Sete protocolos aprovados**, em duas famílias:

| Família | Protocolos | O que o método enfatiza |
|---|---|---|
| Densidade | RES, MIC | Esforço amostral: área conhecida, ficha impressa, trecho e quadrat |
| Ocorrência | RST, ESG, DES, AVI, AGU | Observar sem interferir e sem se expor |

O método de cada um é parte do protocolo, não anexo: está escrito por extenso, vai para a ficha
impressa e aparece na tela de campo no momento em que o aluno escolhe o protocolo — porque metade
dele é cuidado de segurança, e a hora de ler é antes de chegar perto.

Três regras atravessam os protocolos de ocorrência:

- **Descrever vale mais que nomear errado.** Espécie só é registrada com identificação segura; na
  dúvida, foto e descrição.
- **Ninho não ganha coordenada de acesso.** Registro à distância, sem foto aproximada e sem indicar
  trilha na descrição.
- **Valor isolado diz pouco.** É a repetição no mesmo ponto e nas mesmas condições que constrói a
  série.

As listas de itens abrem com quatro entradas por protocolo de ocorrência e serão revistas conforme
o uso real das escolas.

---

## 11. Educomunicação *(novo em 12/08/2026)*

Duas peças herdadas do Rio do Nosso Bairro, separadas por uma regra de privacidade.

**Diário de Campo** — o antigo Diário de Bordo, preso à expedição e dividido em *antes, durante e
depois* do mapeamento, como no manual de Mapa Verde. Cada momento traz o convite de escrita; o
"depois" pergunta o que os números dizem do território e de quem é a responsabilidade.

O diário é **interno à escola**. Escrita de estudante em processo pertence à mesma categoria das
fichas digitalizadas e das fotos sem curadoria: pode ter nome, desabafo, erro de percurso.

**História do Território** — o artefato curado, escrito para sair. Combina texto, o mapa e os
indicadores das expedições que narra. A história **aponta** para as expedições em vez de copiar
números, e por isso não envelhece quando uma contagem é corrigida na revisão.

Publicar é decisão da escola, e retirar do ar apaga o carimbo de publicação — a página nunca mostra
data de história que saiu.

---

## 12. Reconhecimento, não classificação *(novo em 12/08/2026)*

O plano de produção pede reconhecer expedições realizadas, territórios monitorados, protocolos
aplicados e tempo de monitoramento. Pede também, na lista do que **não** reaproveitar do Rio do
Nosso Bairro, o "ranking de membros".

As conquistas da página da escola seguem as duas coisas: cada escola é medida contra o próprio
percurso, e não existe classificação entre escolas nem entre estudantes. O critério que mais pesa é
a **continuidade** — meses distintos com saída de campo, não volume acumulado. Uma escola de duas
turmas num município pequeno não aparece atrás de uma escola grande por ter menos gente.

Nada é gravado: tudo se deriva do que já está publicado, sem tabela de pontos para desincronizar do
dado real.

---

## Changelog da v0.2 para a v0.3

| Bloco | O que mudou | Por quê |
|---|---|---|
| 2 | O prazo de 72 h passou a valer para a exclusão do arquivo; a imagem sai do ar imediatamente | A v0.2 já dizia "despublicada antes da exclusão"; faltava dizer que isso é imediato |
| 2 | A escola com vínculo também pode atender o pedido, além do Ecosurf | O termo promete prazo, não pessoa; a escola age mais rápido |
| 3 | Separadas as duas naturezas de registro: contagem por área na ficha, ocorrência pontual no celular | Tratar as duas como uma só obrigava a transcrever coordenada que o aparelho já tem |
| 3 | "Offline completo não entra no MVP" virou "offline parcial": fila local que sobe depois | O registro em campo não pode falhar por falta de sinal |
| 5 | Explicitadas as regras de transição e o que impede a publicação | Estavam implícitas; passaram a viver no banco |
| 6 | O piloto passou de 1 escola / 2 expedições / 1 protocolo para 4 / 12 / 7, com territórios fictícios | O piloto cresceu na construção; Praia do Sonho saiu por ser lugar real |
| 7 | Descrito o que a página de dados abre e o limite real da trava de exportação | Evitar confiar numa trava que é de produto, não de banco |
| 8 | Acrescentados armazenamento privado de imagem, proibição de asset de terceiros e a regra de que o crítico mora no banco | Decisões tomadas durante a construção |
| 9 | Diário de Campo e Histórias entraram nas listas de visibilidade | Peças novas |
| 10, 11, 12 | Blocos novos: protocolos, educomunicação e reconhecimento | Não existiam na v0.2 |

---

## Próximo passo

O ciclo do bloco 6 fecha ponta a ponta. Aberto para a próxima fase: API pública documentada,
integração com universidades, sensoriamento remoto comparativo e identificação assistida de
espécies.

Antes de qualquer escola real entrar: revisão técnica dos métodos e das listas de itens dos
protocolos de ocorrência por quem conhece a restinga e a avifauna de Itanhaém.

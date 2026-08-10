# Oceano na Escola — Documento de Premissas v0.2

**Instituto Ecosurf** · Itanhaém/SP · Agosto de 2026

Atualização da v0.1 com as definições de João Malavolta.
Todas as pendências estão fechadas. O documento está pronto para abrir o passo 2.

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

**Regras de proteção**

- Para o visitante sem login, a localização das observações aparece agregada em grade de 100 m ou
  como o trecho percorrido, nunca como o ponto exato do registro.
- A galeria pública fica fora da indexação de buscadores (`noindex`), mesmo sendo acessível pelo
  site. Mapa, página da escola e páginas institucionais são indexáveis.
- Pesquisador que precise da coordenada exata solicita acesso ao Ecosurf, conforme a regra de uso
  de dados do bloco 7.

---

## Próximo passo

Passo 2: protocolos e fichas. Definir campo a campo os protocolos de resíduos costeiros e
microplásticos, no formato da ficha do aluno mapeador e da ficha consolidada do professor.

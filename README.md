# Oceano na Escola

Plataforma de Cultura Oceânica, ciência cidadã e monitoramento ambiental, organizada a partir de
escolas. Instituto Ecosurf · Itanhaém/SP.

Antecedente metodológico: projeto Rio do Nosso Bairro — Escolas Cuidando da Água (Ecosurfi, 2010).

## Como o sistema se organiza

Cinco verbos definem o escopo: **mapear, investigar, monitorar, compartilhar, agir.**
Funcionalidade que não couber em pelo menos um deles fica fora.

A ficha impressa é o registro primário de campo. O professor transcreve para a plataforma. Não
existe conta pessoal de aluno: as contas são de escola, turma e classe.

Hierarquia dos dados:

```
Município → Escola → Turma → Expedição → Equipe → Unidade amostral → Observação
```

## Stack

- Next.js + TypeScript + shadcn/ui + Tailwind
- Supabase (PostgreSQL 17 + PostGIS), projeto `oceano-na-escola`, região `sa-east-1`
- MapLibre GL JS
- Vercel

## Banco de dados

```
supabase/migrations/
├── …203037_schema_oceano_na_escola.sql        tipos, tabelas, índices GiST, triggers
├── …203118_rls_e_views_publicas.sql           RLS por escola + views públicas
├── …203155_protocolos_seed_v1.sql             protocolos RES e MIC, versão 1.0
├── …203231_hardening_advisors.sql             correções dos Security Advisors
├── …222309_correcoes_rls_e_indicadores.sql    grants por coluna, fim do fan-out nos indicadores
├── …222320_piso_de_agregacao_da_grade.sql     célula exige 3 unidades amostrais
├── …224005_celula_da_grade_vira_poligono.sql  st_expand para a célula ser polígono
├── …012325_seed_piloto_ficticio.sql           4 escolas, 12 expedições, 12 células
├── …012450_corrige_ancoragem_do_seed.sql      snap ao vértice antes do deslocamento
├── …013610_revoga_execute_da_funcao_de_trigger.sql
├── …120000_protocolo_se_descreve.sql          ícone, cor, unidade; várias turmas por expedição
├── …123000_pins_e_fotos_georreferenciadas.sql views de ocorrência e foto
├── …140000_ocorrencia_com_magnitude.sql       item + valor no ponto; 5 protocolos novos
├── …160000_seed_ocorrencias.sql
├── …170000_municipios_do_litoral_sul.sql
├── …190000_transicao_de_status_e_previa_da_grade.sql
├── …200000_seed_territorios_ficticios.sql
├── …210000_storage_de_evidencias.sql          bucket privado + políticas
├── …220000_diario_de_campo_e_historias.sql
├── …230000_pedido_de_remocao_despublica.sql
└── …233000_seed_diario_e_historias.sql
```

Estas migrations já estão aplicadas no projeto `mtjtjnofjtouzmbdcwad`. Os arquivos refletem
exatamente o estado do banco. Para um ambiente novo, aplicar na ordem pelo SQL Editor ou pelo CLI:

```bash
supabase link --project-ref mtjtjnofjtouzmbdcwad
supabase db push
```

Se o schema reclamar do PostGIS, ative a extensão em Database → Extensions antes.

### Verificação

```sql
select p.codigo, pv.versao,
       (select count(*) from protocolo_item i where i.versao_id = pv.id) as itens,
       (select count(*) from protocolo_campo c
          join protocolo_secao s on s.id = c.secao_id
         where s.versao_id = pv.id) as campos
from protocolo p join protocolo_versao pv on pv.protocolo_id = p.id;
```

Esperado: `RES / 1.0 / 30 / 9`, `MIC / 1.0 / 0 / 14`, e RST, ESG, DES, AVI e AGU com 4 itens cada.

### Decisões de segurança registradas

As views `pub_*` são `security definer` de propósito. É o que impede o `anon` de alcançar
qualquer tabela base — ele não tem grant em nenhuma. Com `security_invoker` seria preciso dar
`select` nas tabelas e expor colunas indesejadas via PostgREST. O linter do Supabase marca isso
como ERROR sem distinguir os dois casos; é uma exceção aceita e documentada.

PostGIS permanece no schema `public`, que é como o Supabase instala. Mover para `extensions` depois
que as tabelas já usam tipos `geography` traz mais problema que benefício.

Existe uma função `rls_auto_enable()` que não faz parte destas migrations. Veio com o provisionamento
do projeto pelo Vercel Marketplace. Vale auditar antes de confiar nela.

## Visibilidade dos dados

Cenário C. O visitante sem login vê mapa, indicadores agregados, página da escola e galeria curada.
Registro individual, coordenada exata, tabelas e exportação exigem login.

O `anon` não tem acesso a nenhuma tabela base. Tudo passa pelas views `pub_*`, com filtro fixo.
A localização pública é agregada em grade de 100 m (SIRGAS 2000 / UTM 23S, EPSG:31983).

## Proteção de menores

- Controlador dos dados: Instituto Ecosurf.
- A escola assina termo de responsabilidade e termo de uso de imagem; o Ecosurf assina termo de
  parceria com cada escola.
- Nome de estudante nunca aparece em página pública.
- A galeria pública depende de `escola.termos_ok = true` e de curadoria do professor.
- Pedido formalizado de remoção de imagem: atendido em até **72 horas**. A tabela
  `solicitacao_remocao` aceita pedido de quem não tem conta e calcula o prazo automaticamente.
  O pedido despublica a imagem no mesmo instante, por gatilho — o prazo é para apagar o arquivo,
  não para deixar de exibi-lo.
- O bucket `evidencias` é **privado**. A view pública entrega o caminho do arquivo ao `anon`; com
  bucket público, nem a curadoria nem o `termos_ok` protegeriam a foto. As políticas do storage
  repetem as três condições e a imagem chega por URL assinada.
- O Diário de Campo não é público. Escrita de estudante em processo fica na mesma categoria das
  fichas digitalizadas e das fotos sem curadoria.
- A galeria deve ser servida com `noindex`.

## Protocolos

| Código | Nome | Forma de agregação | Resultado |
|---|---|---|---|
| RES | Resíduos costeiros e marinhos | densidade, trecho de 50 m por equipe | itens/m² |
| MIC | Microplásticos | densidade, 5 quadrats de 0,25 m² | itens/m² |
| RST | Restinga e vegetação costeira | área afetada | m² |
| ESG | Esgoto e drenagem | ocorrência pontual | pontos |
| DES | Descarte irregular | ocorrência pontual | pontos |
| AVI | Avifauna e fauna costeira | ocorrência pontual | indivíduos |
| AGU | Qualidade da água | medida | valor medido |

Protocolos são configuráveis: seções, campos e itens ficam em tabelas, e a mesma definição gera o
formulário web e o PDF da ficha impressa. Protocolo novo aparece na plataforma sem uma linha de
React.

Os sete estão aprovados, cada um com o método de campo escrito em `protocolo_versao.metodo` — é o
texto que vai para a ficha impressa. RES e MIC medem densidade e exigem esforço amostral; os cinco
de ocorrência registram o ponto exato e a magnitude na unidade do item.

Todo dado fica amarrado à versão do protocolo que o gerou.

## Telas

| Rota | O que faz |
|---|---|
| `/` | Mapa público: grade de densidade, pins de ocorrência, escolas, filtros |
| `/escolas`, `/escola/[slug]` | Rede e página pública de cada escola |
| `/dados` | Indicadores por município; exportação em CSV sob login |
| `/painel` | Centro da área autenticada |
| `/expedicoes`, `/expedicoes/nova` | Saídas de campo |
| `/campo` | Registro em campo: GPS, foto, ocorrência, fila offline |
| `/expedicoes/[id]/transcrever` | Ficha de campo gerada pelo protocolo |
| `/expedicoes/[id]/revisar` | Validação de rascunho a publicado |
| `/expedicoes/[id]/relatorio` | Relatório para impressão |
| `/expedicoes/[id]/diario` | Diário de Campo, interno à escola |
| `/historias`, `/historias/[id]` | Histórias do Território |
| `/galeria` | Curadoria de fotos e pedidos de remoção |

## Fase atual

Base de demonstração inteiramente fictícia: escolas, turmas, territórios, expedições, fichas,
ocorrências, diário e histórias. Nenhuma escola, aluno ou dado real nesta fase.

## Documentação

- [`docs/01-premissas.md`](docs/01-premissas.md) — v0.3: governança, proteção de menores, registro
  de campo, papéis e validação, visibilidade, educomunicação. Traz o changelog do que mudou desde
  a v0.2 e por quê. **É a decisão: quando ele e a plataforma divergirem, ele manda.**
- [`docs/02-protocolos.md`](docs/02-protocolos.md) — protocolos campo a campo e as duas fichas

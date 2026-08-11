-- =====================================================================
-- Oceano na Escola — 20260811120000_protocolo_se_descreve_e_varias_turmas.sql
--
-- Duas mudancas que destravam o universo de protocolos.
--
-- 1. O protocolo passa a se descrever
--
-- Hoje o front decide como desenhar e como medir cada protocolo: as
-- camadas do mapa sao os booleanos residuos e microplasticos, e a escala
-- de densidade e um dicionario com as chaves RES e MIC. Um protocolo
-- novo — restinga, avifauna, qualidade da agua, esgoto — existiria no
-- banco e continuaria invisivel no mapa.
--
-- Iconografia e metrica viram coluna. Quem sabe como um protocolo se
-- desenha e se mede e o protocolo, nao o componente React.
--
-- forma_agregacao existe porque nem todo protocolo e itens por metro
-- quadrado. Residuo e microplastico sao densidade. Ponto de lancamento
-- de esgoto e ocorrencia: conta-se quantos, nao quantos por area.
-- Supressao de restinga e area afetada. Sem essa coluna, a grade publica
-- seguiria dividindo tudo por area amostrada e produzindo numero sem
-- significado, que e o erro que ja corrigimos duas vezes neste projeto.
--
-- 2. Expedicao com varias turmas
--
-- expedicao.turma_id era not null: uma saida de campo, uma turma. Duas
-- turmas na mesma praia no mesmo dia exigiam duplicar a expedicao, o que
-- duplicaria tambem o esforco amostral e inflaria a extensao monitorada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Iconografia e metrica como dado
-- ---------------------------------------------------------------------

alter table protocolo
  add column if not exists icone           text,
  add column if not exists cor             text,
  add column if not exists unidade_medida  text,
  add column if not exists forma_agregacao text not null default 'densidade';

alter table protocolo
  add constraint protocolo_forma_agregacao_valida
  check (forma_agregacao in ('densidade', 'ocorrencia', 'area_afetada', 'medida', 'nenhuma'));

comment on column protocolo.icone is
  'Nome do simbolo na iconografia propria do Ecosurf. Os icones do Green Map System sao protegidos e servem so como referencia.';
comment on column protocolo.cor is
  'Hex do pin e da rampa de densidade. Fora do codigo para que protocolo novo nao exija deploy.';
comment on column protocolo.unidade_medida is
  'O que o numero significa: itens/m2, ocorrencias, m2, mg/L.';
comment on column protocolo.forma_agregacao is
  'Como a grade publica resume este protocolo. densidade divide por area amostrada; ocorrencia apenas conta; area_afetada soma area; medida usa valor declarado; nenhuma nao vai ao mapa.';

-- Item de lista tambem ganha simbolo: o pin de uma rede de pesca
-- abandonada nao deve ser igual ao de um ponto de esgoto.
alter table protocolo_item
  add column if not exists icone text;

update protocolo set
  icone           = 'residuos',
  cor             = '#2d7d72',
  unidade_medida  = 'itens/m²',
  forma_agregacao = 'densidade'
where codigo = 'RES';

update protocolo set
  icone           = 'microplasticos',
  cor             = '#7c5cbf',
  unidade_medida  = 'itens/m²',
  forma_agregacao = 'densidade'
where codigo = 'MIC';

-- ---------------------------------------------------------------------
-- 2. Varias turmas por expedicao
--
-- turma_id continua existindo como turma responsavel — a que o professor
-- indica como principal, e que a ficha impressa nomeia no cabecalho.
-- expedicao_turma passa a ser a lista completa de quem foi a campo.
-- ---------------------------------------------------------------------

alter table expedicao alter column turma_id drop not null;

comment on column expedicao.turma_id is
  'Turma responsavel, a que assina o cabecalho da ficha. A lista completa de turmas participantes esta em expedicao_turma.';

create table if not exists expedicao_turma (
  expedicao_id bigint not null references expedicao(id) on delete cascade,
  turma_id     bigint not null references turma(id)     on delete cascade,
  primary key (expedicao_id, turma_id)
);

comment on table expedicao_turma is
  'Turmas que participaram da saida de campo. Duas turmas na mesma praia no mesmo dia sao uma expedicao com duas turmas, nao duas expedicoes — senao o esforco amostral conta em dobro.';

-- Toda expedicao existente ja tem a sua turma; ela entra na lista.
insert into expedicao_turma (expedicao_id, turma_id)
select id, turma_id from expedicao where turma_id is not null
on conflict do nothing;

alter table expedicao_turma enable row level security;

-- Mesmo alcance da expedicao a que pertence.
create policy expedicao_turma_tudo on expedicao_turma for all to authenticated
  using (exists (select 1 from expedicao e where e.id = expedicao_id
                 and (app_tem_vinculo(e.escola_id) or app_is_pesquisador())))
  with check (exists (select 1 from expedicao e where e.id = expedicao_id
                      and app_tem_vinculo(e.escola_id)));

create index on expedicao_turma (turma_id);

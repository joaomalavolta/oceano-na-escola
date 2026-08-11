-- =====================================================================
-- Oceano na Escola — 20260811140000_ocorrencia_com_magnitude_e_catalogo_de_protocolos.sql
--
-- 1. A ocorrencia ganha magnitude
--
-- observacao_pontual tinha descricao e origem_provavel, texto livre. Nao
-- havia onde escrever "3 pontos verificados" ou "30 metros quadrados"
-- como dado. Entram item_id, que diz que problema e aquele, e valor, que
-- diz quanto. A unidade vive no item: entulho se conta em pontos,
-- supressao de restinga se mede em m2, e quem sabe disso e o catalogo,
-- nao cada registro.
--
-- 2. Catalogo de protocolos
--
-- Cinco protocolos novos, alem de residuos e microplasticos. Os codigos
-- RST e AVI ja estavam previstos no comentario da tabela protocolo desde
-- a primeira migration.
--
-- As listas de itens sao RASCUNHO. Definir protocolo campo a campo levou
-- um documento inteiro para dois deles, no Passo 2. Estes entram para que
-- a maquina funcione de ponta a ponta e o Ecosurf tenha o que corrigir
-- em cima — nao como palavra final sobre metodologia.
--
-- 3. Coordenada exata na ocorrencia
--
-- Decisao do Ecosurf, contrariando o bloco 9 das premissas, que pedia
-- grade de 100 m para toda observacao. A distincao preservada: pin de
-- ocorrencia sai exato, porque descreve o ambiente; a grade de densidade
-- segue agregada, porque descreve onde a turma amostrou.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Magnitude da ocorrencia
-- ---------------------------------------------------------------------

alter table protocolo_item
  add column if not exists unidade text;

comment on column protocolo_item.unidade is
  'Como este item se mede: pontos, m2, individuos, metros. Vazio quando o item so se conta em contagem por unidade amostral.';

alter table observacao_pontual
  add column if not exists item_id bigint references protocolo_item(id),
  add column if not exists valor   numeric(12,3);

comment on column observacao_pontual.item_id is
  'Que problema e este, conforme o catalogo do protocolo. Nulo em registro livre, so descrito em texto.';
comment on column observacao_pontual.valor is
  'Magnitude na unidade do item: 3 pontos verificados, 30 m2 de supressao. Nulo quando a ocorrencia e presenca, sem quantidade.';

-- ---------------------------------------------------------------------
-- 2. Catalogo
-- ---------------------------------------------------------------------

insert into protocolo (codigo, nome, descricao, icone, cor, unidade_medida, forma_agregacao)
values
  ('RST', 'Restinga e vegetacao costeira',
   'Supressao, pisoteio e invasao biologica na restinga e na vegetacao de duna.',
   'restinga', '#4a7c2d', 'm²', 'area_afetada'),
  ('ESG', 'Esgoto e drenagem',
   'Pontos de lancamento, ligacao irregular e indicios de contaminacao em saida de drenagem, corrego e foz.',
   'esgoto', '#8a5a2b', 'pontos', 'ocorrencia'),
  ('DES', 'Descarte irregular',
   'Entulho, moveis, resto de construcao e queima a ceu aberto em margem de rio, terreno e faixa de areia.',
   'descarte', '#a63d40', 'pontos', 'ocorrencia'),
  ('AVI', 'Avifauna e fauna costeira',
   'Registro de especies, ninhos e interacao de fauna com residuo.',
   'avifauna', '#2f6f9f', 'individuos', 'ocorrencia'),
  ('AGU', 'Qualidade da agua',
   'Parametros medidos em campo na agua do mar, do corrego ou da foz.',
   'agua', '#1f8a9e', 'valor medido', 'medida')
on conflict (codigo) do nothing;

insert into protocolo_versao (protocolo_id, versao, metodo, ativa, publicada_em)
select p.id, '1.0', 'Rascunho para revisao do Instituto Ecosurf', true, now()
from protocolo p
where p.codigo in ('RST','ESG','DES','AVI','AGU')
  and not exists (select 1 from protocolo_versao v where v.protocolo_id = p.id);

-- Secao unica de ocorrencia para os quatro protocolos de campo, mais a
-- secao qualitativa que todo protocolo tem.
insert into protocolo_secao (versao_id, codigo, nome, ordem)
select v.id, s.codigo, s.nome, s.ordem
from protocolo p
join protocolo_versao v on v.protocolo_id = p.id
cross join (values
  ('ocorrencia',  'Ocorrencias registradas', 1),
  ('qualitativo', 'Observacoes da equipe',   2)
) as s(codigo, nome, ordem)
where p.codigo in ('RST','ESG','DES','AVI','AGU')
  and not exists (
    select 1 from protocolo_secao ps where ps.versao_id = v.id and ps.codigo = s.codigo
  );

-- Itens: o que se registra, com a unidade em que se mede.
insert into protocolo_item (versao_id, codigo, nome, grupo, ordem, icone, unidade)
select v.id, i.codigo, i.nome, i.grupo, i.ordem, i.icone, i.unidade
from protocolo p
join protocolo_versao v on v.protocolo_id = p.id
join (values
  -- Restinga
  ('RST','RST01','Supressao de vegetacao de restinga','Supressao',1,'restinga-corte','m²'),
  ('RST','RST02','Pisoteio e trilha irregular',       'Degradacao',2,'trilha','m²'),
  ('RST','RST03','Especie exotica invasora',          'Invasao',  3,'invasora','m²'),
  ('RST','RST04','Deposito de areia ou aterro',        'Supressao',4,'aterro','m²'),
  -- Esgoto e drenagem
  ('ESG','ESG01','Ponto de lancamento em drenagem',   'Lancamento',1,'tubulacao','pontos'),
  ('ESG','ESG02','Ligacao irregular aparente',        'Lancamento',2,'ligacao','pontos'),
  ('ESG','ESG03','Espuma, odor ou coloracao anomala', 'Indicio',  3,'espuma','pontos'),
  ('ESG','ESG04','Corrego com aspecto contaminado',   'Indicio',  4,'corrego','metros'),
  -- Descarte irregular
  ('DES','DES01','Entulho de construcao',             'Entulho',  1,'entulho','pontos'),
  ('DES','DES02','Movel ou eletrodomestico descartado','Volumoso', 2,'volumoso','pontos'),
  ('DES','DES03','Queima a ceu aberto',               'Queima',   3,'queima','pontos'),
  ('DES','DES04','Acumulo de residuo em terreno',     'Acumulo',  4,'acumulo','m²'),
  -- Avifauna
  ('AVI','AVI01','Especie avistada',                  'Registro', 1,'ave','individuos'),
  ('AVI','AVI02','Ninho ou area de reproducao',       'Reproducao',2,'ninho','pontos'),
  ('AVI','AVI03','Fauna interagindo com residuo',     'Interacao',3,'ave-residuo','individuos'),
  ('AVI','AVI04','Animal encalhado ou morto',         'Ocorrencia',4,'encalhe','individuos'),
  -- Qualidade da agua
  ('AGU','AGU01','pH',                                'Fisico-quimico',1,'ph',''),
  ('AGU','AGU02','Turbidez',                          'Fisico-quimico',2,'turbidez','NTU'),
  ('AGU','AGU03','Temperatura',                       'Fisico-quimico',3,'temperatura','°C'),
  ('AGU','AGU04','Salinidade',                        'Fisico-quimico',4,'salinidade','ppt')
) as i(protocolo, codigo, nome, grupo, ordem, icone, unidade) on i.protocolo = p.codigo
where not exists (
  select 1 from protocolo_item pi where pi.versao_id = v.id and pi.codigo = i.codigo
);

-- ---------------------------------------------------------------------
-- 3. Views com coordenada exata e magnitude
-- ---------------------------------------------------------------------

drop view if exists pub_observacao_pontual;
create view pub_observacao_pontual with (security_invoker = off) as
select
  op.id,
  e.slug   as escola_slug,
  e.nome   as escola_nome,
  p.codigo as protocolo,
  p.nome   as protocolo_nome,
  p.icone  as protocolo_icone,
  p.cor    as protocolo_cor,
  pi.codigo  as item_codigo,
  pi.nome    as item_nome,
  pi.grupo   as item_grupo,
  pi.icone   as item_icone,
  pi.unidade as item_unidade,
  op.valor,
  op.descricao,
  op.origem_provavel,
  x.numero as expedicao_numero,
  x.data_campo,
  st_asgeojson(op.geom::geometry) as ponto_geojson
from observacao_pontual op
join expedicao x           on x.id = op.expedicao_id and x.status = 'publicado'
join escola e              on e.id = x.escola_id and e.publicada = true
join protocolo_versao pv   on pv.id = op.versao_id
join protocolo p           on p.id = pv.protocolo_id
left join protocolo_item pi on pi.id = op.item_id;

comment on view pub_observacao_pontual is
  'Ocorrencias ambientais como pin, em coordenada exata por decisao do Ecosurf. Contraria o bloco 9 das premissas na redacao original; a distincao mantida e que a grade de densidade segue agregada em 100 m, porque descreve onde a turma amostrou, enquanto o pin descreve o ambiente.';

drop view if exists pub_foto_georreferenciada;
create view pub_foto_georreferenciada with (security_invoker = off) as
select
  ev.id,
  ev.storage_path,
  ev.legenda,
  ev.publicada_em,
  e.slug   as escola_slug,
  e.nome   as escola_nome,
  p.codigo as protocolo,
  p.icone  as protocolo_icone,
  p.cor    as protocolo_cor,
  pi.nome    as item_nome,
  pi.icone   as item_icone,
  pi.unidade as item_unidade,
  op.valor,
  op.descricao as ocorrencia,
  op.origem_provavel,
  x.numero as expedicao_numero,
  x.data_campo,
  st_asgeojson(op.geom::geometry) as ponto_geojson
from evidencia ev
join observacao_pontual op  on op.id = ev.pontual_id
join expedicao x            on x.id = op.expedicao_id and x.status = 'publicado'
join escola e               on e.id = ev.escola_id and e.publicada = true and e.termos_ok = true
join protocolo_versao pv    on pv.id = op.versao_id
join protocolo p            on p.id = pv.protocolo_id
left join protocolo_item pi on pi.id = op.item_id
where ev.status = 'publicada';

comment on view pub_foto_georreferenciada is
  'Foto de ocorrencia em coordenada exata. Servir com noindex. Exige curadoria do professor, escola publicada e termo de imagem confirmado.';

grant select on pub_observacao_pontual, pub_foto_georreferenciada to anon, authenticated;

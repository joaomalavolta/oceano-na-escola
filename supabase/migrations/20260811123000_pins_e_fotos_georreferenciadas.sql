-- =====================================================================
-- Oceano na Escola — 20260811123000_pins_e_fotos_georreferenciadas.sql
--
-- O registro pontual — rede abandonada, ponto de esgoto, foco de
-- supressao de restinga — nunca teve view publica. Ele existia na tabela
-- e so aparecia como numero dentro do indicador da escola. A peca mais
-- caracteristica de um Mapa Verde, o territorio marcado com simbolos que
-- dizem o que ha ali, era a que faltava.
--
-- Sobre a coordenada
--
-- O bloco 9 das premissas e explicito: para o visitante sem login, a
-- localizacao das observacoes aparece agregada em grade de 100 m, nunca
-- como o ponto exato do registro. Estas views obedecem — o ponto sai
-- puxado para o vertice da grade, como ja fazemos com a densidade.
--
-- Diferente da grade, nao ha piso de tres aqui, e a razao e outra. O
-- piso da grade protege o local onde criancas amostraram. Um pin de
-- lancamento de esgoto descreve o ambiente, nao a turma: suprimi-lo por
-- ser unico esvaziaria justamente o proposito do mapa. Se o Ecosurf
-- entender diferente, e uma linha de having.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Pins de ocorrencia
-- ---------------------------------------------------------------------

drop view if exists pub_observacao_pontual;
create view pub_observacao_pontual with (security_invoker = off) as
select
  op.id,
  e.slug     as escola_slug,
  e.nome     as escola_nome,
  p.codigo   as protocolo,
  p.icone    as protocolo_icone,
  p.cor      as protocolo_cor,
  op.descricao,
  op.origem_provavel,
  x.numero   as expedicao_numero,
  date_trunc('month', x.data_campo)::date as mes,
  st_asgeojson(
    st_transform(st_snaptogrid(st_transform(op.geom::geometry, 31983), 100), 4326)
  ) as ponto_geojson
from observacao_pontual op
join expedicao x         on x.id = op.expedicao_id and x.status = 'publicado'
join escola e            on e.id = x.escola_id and e.publicada = true
join protocolo_versao pv on pv.id = op.versao_id
join protocolo p         on p.id = pv.protocolo_id;

comment on view pub_observacao_pontual is
  'Ocorrencias ambientais como pin. Coordenada puxada para a grade de 100 m: o visitante ve onde o problema esta, nao onde a turma esteve.';

-- ---------------------------------------------------------------------
-- Fotos georreferenciadas
--
-- Foto amarrada a uma ocorrencia, com a mesma coordenada agregada. Exige
-- tres condicoes simultaneas: evidencia publicada pela curadoria do
-- professor, escola publicada, e escola com termo de uso de imagem
-- confirmado. Faltando qualquer uma, a foto nao aparece.
-- ---------------------------------------------------------------------

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
  op.descricao      as ocorrencia,
  op.origem_provavel,
  x.numero as expedicao_numero,
  date_trunc('month', x.data_campo)::date as mes,
  st_asgeojson(
    st_transform(st_snaptogrid(st_transform(op.geom::geometry, 31983), 100), 4326)
  ) as ponto_geojson
from evidencia ev
join observacao_pontual op on op.id = ev.pontual_id
join expedicao x           on x.id = op.expedicao_id and x.status = 'publicado'
join escola e              on e.id = ev.escola_id and e.publicada = true and e.termos_ok = true
join protocolo_versao pv   on pv.id = op.versao_id
join protocolo p           on p.id = pv.protocolo_id
where ev.status = 'publicada';

comment on view pub_foto_georreferenciada is
  'Foto de ocorrencia com posicao agregada em 100 m. Servir com noindex, como a galeria. Exige curadoria, escola publicada e termo de imagem confirmado.';

-- ---------------------------------------------------------------------
-- Protocolos disponiveis, para o mapa montar camadas a partir do banco
-- em vez de booleanos fixos no codigo
-- ---------------------------------------------------------------------

drop view if exists pub_protocolo;
create view pub_protocolo with (security_invoker = off) as
select p.id, p.codigo, p.nome, p.descricao,
       p.icone, p.cor, p.unidade_medida, p.forma_agregacao
from protocolo p
where exists (select 1 from protocolo_versao pv where pv.protocolo_id = p.id and pv.ativa);

comment on view pub_protocolo is
  'Protocolos com versao ativa. E daqui que o mapa monta as camadas: protocolo novo aparece sem deploy.';

grant select on pub_observacao_pontual, pub_foto_georreferenciada, pub_protocolo
  to anon, authenticated;

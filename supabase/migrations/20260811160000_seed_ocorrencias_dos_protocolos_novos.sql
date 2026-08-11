-- =====================================================================
-- Oceano na Escola — 20260811160000_seed_ocorrencias_dos_protocolos_novos.sql
--
-- Os doze registros pontuais do piloto foram semeados antes de existirem
-- item_id e valor: sao todos do protocolo de residuos, com descricao em
-- texto livre e sem magnitude. Servem para provar que o pin desenha, nao
-- para mostrar o que os protocolos novos fazem.
--
-- Entram ocorrencias com item e magnitude, uma de cada protocolo novo
-- por escola, posicionadas a algumas centenas de metros da escola. Segue
-- tudo ficticio, conforme o bloco 6 das premissas.
-- =====================================================================

insert into observacao_pontual
  (expedicao_id, versao_id, item_id, valor, descricao, origem_provavel, geom)
select
  x.id,
  pv.id,
  pi.id,
  o.valor,
  o.descricao,
  o.origem,
  st_transform(
    st_translate(st_transform(e.geom::geometry, 31983), o.dx, o.dy),
    4326)::geography
from escola e
-- A ultima expedicao de cada escola e a de registro de ocorrencias.
join expedicao x on x.escola_id = e.id
              and x.numero = (select max(y.numero) from expedicao y where y.escola_id = e.id)
join (values
  ('DES','DES01', 3,    'Entulho de construcao na margem do rio', 'descarte urbano',  -210.0,  160.0),
  ('RST','RST01', 30,   'Supressao de vegetacao de restinga',     'ocupacao',          260.0, -190.0),
  ('ESG','ESG01', 1,    'Ponto de lancamento em saida de drenagem','drenagem',        -180.0, -240.0),
  ('AVI','AVI01', 12,   'Bando de trinta-reis em area de descanso','fauna',            300.0,  210.0)
) as o(protocolo, item, valor, descricao, origem, dx, dy) on true
join protocolo p          on p.codigo = o.protocolo
join protocolo_versao pv  on pv.protocolo_id = p.id and pv.ativa
join protocolo_item pi    on pi.versao_id = pv.id and pi.codigo = o.item
where e.slug in ('em-mapa-verde','em-mare-cheia','ee-costa-viva','em-duna-alta')
  and not exists (
    select 1 from observacao_pontual op
    where op.expedicao_id = x.id and op.item_id = pi.id
  );

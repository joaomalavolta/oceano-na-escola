-- =====================================================================
-- Oceano na Escola — 20260810213000_piso_de_agregacao_da_grade.sql
--
-- Piso de agregacao na grade publica de 100 m.
--
-- st_snaptogrid agrega, mas nao anonimiza sozinho: uma celula formada
-- por uma unica unidade amostral publica a posicao daquele registro
-- dentro de 100 m. Com uma escola e um quadrat, "agregado" e um ponto.
--
-- A celula passa a so aparecer para o visitante sem login quando reune
-- ao menos tres unidades amostrais. Abaixo disso ela e suprimida por
-- inteiro, e nao arredondada: arredondar deixaria a existencia do
-- registro visivel, que e justamente o que se quer esconder.
--
-- Consequencia assumida: escola que fez uma saida de campo so nao
-- aparece na camada de densidade ate acumular amostragem. O mapa da
-- rede, a pagina da escola e os indicadores agregados por escola
-- continuam visiveis — eles nao carregam posicao de registro.
-- =====================================================================

drop view if exists pub_observacao_grade;
create view pub_observacao_grade with (security_invoker = off) as
with unidade_ag as (
  -- uma linha por unidade amostral: a area entra uma vez so
  select u.id, u.geom, u.area_m2, u.expedicao_id, u.versao_id,
         coalesce(sum(oc.quantidade), 0) as itens
  from unidade_amostral u
  join observacao_contagem oc on oc.unidade_id = u.id
  group by u.id, u.geom, u.area_m2, u.expedicao_id, u.versao_id
)
select
  st_asgeojson(st_transform(st_snaptogrid(st_transform(ua.geom::geometry, 31983), 100), 4326)) as celula_geojson,
  e.slug   as escola_slug,
  p.codigo as protocolo,
  date_trunc('month', x.data_campo)::date as mes,
  count(distinct ua.id) as unidades_amostrais,
  sum(ua.itens)         as total_itens,
  sum(ua.area_m2)       as area_amostrada_m2,
  case when sum(ua.area_m2) > 0
       then round(sum(ua.itens) / sum(ua.area_m2), 3) else null end as densidade_itens_m2
from unidade_ag ua
join expedicao x         on x.id = ua.expedicao_id and x.status = 'publicado'
join escola e            on e.id = x.escola_id and e.publicada = true
join protocolo_versao pv on pv.id = ua.versao_id
join protocolo p         on p.id = pv.protocolo_id
group by 1,2,3,4
having count(distinct ua.id) >= 3;

comment on view pub_observacao_grade is
  'Visitante sem login nunca ve coordenada exata. Localizacao agregada em grade de 100 m '
  '(SIRGAS 2000 / UTM 23S), e a celula so aparece a partir de tres unidades amostrais.';

grant select on pub_observacao_grade to anon, authenticated;
